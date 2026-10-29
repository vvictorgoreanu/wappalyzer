#!/usr/bin/env node

'use strict'

/**
 * Retain one page per StackLookup host, then classify each exported claim.
 *
 *   CHROMIUM_BIN=/path/to/chrome npm run audit:stacklookup -- --limit 5
 *   npm run audit:stacklookup -- --check       # cache only, no driver loaded
 *   npm run audit:stacklookup -- --force --concurrency 6
 *   npm run audit:stacklookup -- --retry --concurrency 4   # slow loads only, 30 s
 *   npm run audit:stacklookup -- --refresh-keys          # caches without detection keys
 *
 * Each concurrent scan runs in its own worker process: driver.js reads
 * CHROMIUM_DATA_DIR once at load, so Chromium profiles cannot differ within
 * one process, and two browsers cannot share a profile.
 *
 * Export CSVs, review answers, caches and audit results are local-only data.
 * No reviewer action or page content is executed as an instruction.
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const { loadCatalog } = require('./lib/catalog')
const { PATHS } = require('./lib/untracked')
const {
    VERDICTS, parseCsv, parseSamples, dedupeSamples, mapNames, hostName,
    buildReviews, scanHealth, verdictForClaim, summarize,
} = require('./lib/stacklookup')

const ROOT = path.resolve(__dirname, '..')
const SCAN_OPTIONS = {
    extended: true,
    probe: 'full',
    maxWait: 15000,
    noRedirect: true,
    maxUrls: 1,
    recursive: false,
    // The driver staggers its ~50 probe requests by `delay` ms each, so the
    // default 500 held every host for ~26 s. Each probe keeps its own 3 s
    // timeout; the audit checks patterns, not crawler politeness.
    delay: 0,
    // Keep the complete HTML for subsequent offline evidence inspection.
    htmlMaxCols: 0,
    htmlMaxRows: 0,
}
// A retry gives slow pages twice the navigation budget.
const RETRY_OPTIONS = { ...SCAN_OPTIONS, maxWait: 30000 }
// Failures that say the page or browser was slow, not that the host is broken.
// Channels whose detections carry the key that matched (JS chain, header,
// cookie, meta name, DNS type, DOM selector). Caches from before keys were
// recorded cannot tell same-regex patterns on different keys apart.
const KEYED = new Set(['js', 'headers', 'cookies', 'meta', 'dns', 'dom'])
const RETRYABLE = /^(?:Navigation timeout|Timed out after \d+ ms while waiting for the WS endpoint|Scan watchdog expired|Scan worker exited)/

function parseArgs(args) {
    const options = { check: false, force: false, retry: false, refreshKeys: false, limit: Infinity, concurrency: 6, help: false }
    for (let index = 0; index < args.length; index++) {
        const [flag, inline, extra] = args[index].split('=')
        if (extra !== undefined) {
            throw new Error(`Invalid option: ${args[index]}`)
        }
        if (['--check', '--force', '--retry', '--refresh-keys', '--help'].includes(flag) && inline === undefined) {
            options[flag === '--refresh-keys' ? 'refreshKeys' : flag.slice(2)] = true
        } else if (['--limit', '--concurrency'].includes(flag)) {
            const value = inline === undefined ? args[++index] : inline
            if (!/^\d+$/.test(value || '') || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
                throw new Error(`${flag} requires a positive integer`)
            }
            options[flag.slice(2)] = Number(value)
        } else {
            throw new Error(`Unknown option: ${args[index]}`)
        }
    }
    if (options.retry && options.check) {
        throw new Error('--retry scans and cannot be combined with --check')
    }
    if (options.refreshKeys && (options.check || options.retry)) {
        throw new Error('--refresh-keys cannot be combined with --check or --retry')
    }
    return options
}

/** The pattern reviews and second-pass answers as stored, or null without merged.json. */
function readReviewData(directory) {
    const merged = path.join(directory, 'merged.json')
    if (!fs.existsSync(merged)) {
        return null
    }
    const patterns = JSON.parse(fs.readFileSync(merged, 'utf8'))
    if (!Array.isArray(patterns)) {
        throw new Error(`${merged}: expected a pattern array`)
    }
    const answers = []
    for (const file of fs.readdirSync(directory).filter((name) => /^second-pass-answers-.*\.jsonl$/.test(name)).sort()) {
        for (const [index, line] of fs.readFileSync(path.join(directory, file), 'utf8').split(/\r?\n/).entries()) {
            if (!line.trim()) {
                continue
            }
            try {
                answers.push(JSON.parse(line))
            } catch (error) {
                throw new Error(`${file} line ${index + 1}: invalid JSON`)
            }
        }
    }
    return { patterns, answers }
}

function loadReviews(directory, log) {
    const data = readReviewData(directory)
    if (!data) {
        log('No local pattern-review/merged.json; direct matches will need evidence review.')
        return buildReviews([])
    }
    return buildReviews(data.patterns, data.answers)
}

function loadWeights(data, log) {
    const files = fs.readdirSync(data).filter((file) => /^stacklookup-top-500-technologies-.*\.csv$/.test(file)).sort()
    const weights = new Map()
    if (!files.length) {
        log('No local top-500 export; ranking uses unweighted suspect counts.')
        return weights
    }
    const file = files[files.length - 1]
    const { columns, rows, errors } = parseCsv(fs.readFileSync(path.join(data, file), 'utf8'))
    if (!columns.includes('technology') || !columns.includes('live_companies')) {
        throw new Error(`${file}: expected technology and live_companies columns`)
    }
    errors.forEach((error) => log(`${file}: ${error}`))
    for (const row of rows) {
        const value = Number(row.live_companies)
        if (!row.live_companies.trim() || !Number.isFinite(value) || value < 0) {
            throw new Error(`${file}: invalid live_companies for ${row.technology}`)
        }
        weights.set(row.technology.trim().toLowerCase(), value)
    }
    return weights
}

/** A watchdog also bounds browser initialization, probing, and teardown. */
async function bounded(work, milliseconds, message) {
    let timer
    try {
        return await Promise.race([
            Promise.resolve().then(work),
            new Promise((resolve, reject) => {
                timer = setTimeout(() => reject(new Error(message)), milliseconds)
            }),
        ])
    } finally {
        clearTimeout(timer)
    }
}

async function scanDomain(domain, Driver, lookup, scanOptions = SCAN_OPTIONS) {
    const url = `https://${hostName(domain)}/`
    const record = {
        domain, url, finalUrl: url, status: null, headers: {}, html: '',
        technologies: [], patterns: {}, scriptSrc: [], scripts: [], cookies: {}, meta: {},
        errors: [], error: null, scannedAt: new Date().toISOString(), options: scanOptions,
    }
    const started = Date.now()
    // 60 s at the default 15 s wait: navigation, probes and teardown in turn.
    const watchdog = 2 * scanOptions.maxWait + 30000
    let driver
    let site
    // Exported hosts include mail and cPanel subdomains that no longer exist;
    // Chromium would spend a full scan on each. Only a definite NXDOMAIN skips.
    if (lookup) {
        try {
            await lookup(hostName(domain))
        } catch (error) {
            if (error.code === 'ENOTFOUND') {
                record.error = `Hostname could not be resolved (${hostName(domain)})`
                record.elapsedMs = Date.now() - started
                return record
            }
        }
    }
    try {
        driver = new Driver(scanOptions)
        await bounded(async () => {
            await driver.init()
            site = await driver.open(url)
            site.on('error', ({ message }) => record.errors.push(String(message)))
            site.on('response', ({ response }) => {
                record.finalUrl = response.url()
                record.status = response.status()
                record.headers = response.headers()
            })
            site.on('goto', ({ page, html, text, scriptSrc, scripts, cookies, meta }) => {
                record.finalUrl = page.url()
                Object.assign(record, { html, text, scriptSrc, scripts, cookies, meta })
            })
            const results = await site.analyze()
            record.technologies = results.technologies || []
            record.patterns = results.patterns || {}
            record.urls = results.urls || []
            const failed = record.urls.find((item) => item.error)
            if (failed) {
                record.error = String(failed.error)
            }
            if (record.status === null && record.urls.length) {
                const last = record.urls[record.urls.length - 1]
                record.status = last.status
                record.finalUrl = last.url
            }
            // Secondary probe failures say nothing about the page. A channel
            // timeout leaves the rest of the evidence usable; verdicts treat
            // that channel as possibly missed.
            Object.assign(record, scanHealth(record.errors))
        }, watchdog, `Scan watchdog expired after ${watchdog}ms`)
    } catch (error) {
        record.error = String(error.message || error)
    } finally {
        // The CLI's extended output truncates values above 250 characters.
        // Raw detections retain the actual match and complete channel value.
        if (site && Array.isArray(site.detections)) {
            record.patterns = {}
            for (const { technology, pattern } of site.detections) {
                const bucket = record.patterns[technology.name] || []
                bucket.push({
                    type: pattern.type, key: pattern.key, regex: pattern.regex.source,
                    value: pattern.value, match: pattern.match,
                    confidence: pattern.confidence, version: pattern.version,
                    implies: (technology.implies || []).map(({ name }) => name),
                })
                record.patterns[technology.name] = bucket
            }
        }
        if (driver) {
            // destroy() clears driver.browser before awaiting browser.close().
            const browser = driver.browser
            const browserProcess = browser && browser.process && browser.process()
            try {
                await bounded(() => driver.destroy(), 3000, 'Browser teardown timed out')
            } catch (error) {
                record.errors.push(String(error.message || error))
                record.error = record.error || String(error.message || error)
                // A wedged browser must not survive and exhaust later workers.
                if (browserProcess) {
                    browserProcess.kill()
                }
            }
        }
        record.elapsedMs = Date.now() - started
    }
    return record
}

function forkWorker(index, env) {
    return require('child_process').fork(__filename, ['--worker'], { env, serialization: 'advanced' })
}

/**
 * Kill any Chromium still using a worker's profile. A launch that times out
 * waiting for the WS endpoint can leave its browser running in its own
 * process group, out of reach of the worker's own teardown.
 */
function killProfileBrowsers(dataDir) {
    const pattern = `user-data-dir=${dataDir}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Profile 1 must not match profile 10.
        + '( |$)'
    require('child_process').spawnSync('pkill', ['-KILL', '-f', pattern])
}

/** One scan at a time per worker; a worker that dies fails only its host. */
function workerScanner(worker, scanOptions) {
    let current = null
    const settle = (record) => {
        const { resolve } = current
        current = null
        resolve(record)
    }
    worker.on('message', ({ domain, record }) => current && current.domain === domain && settle(record))
    worker.on('exit', (code, signal) => {
        if (current) {
            settle({ domain: current.domain, finalUrl: `https://${current.domain}/`, status: null, html: '',
                technologies: [], patterns: {}, errors: [], error: `Scan worker exited (${signal || code})` })
        }
    })
    return (domain) => new Promise((resolve) => {
        current = { domain, resolve }
        worker.send({ domain, options: scanOptions })
    })
}

async function runWorker() {
    const Driver = require('../driver')
    process.on('message', async ({ domain, options }) => {
        process.send({ domain, record: await scanDomain(domain, Driver, require('dns').promises.lookup, options) })
    })
}

function readCache(file) {
    if (!fs.existsSync(file)) {
        return null
    }
    try {
        const record = JSON.parse(fs.readFileSync(file, 'utf8'))
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
            throw new Error('expected a scan object')
        }
        if (typeof record.html !== 'string' || typeof record.finalUrl !== 'string' ||
            !Array.isArray(record.technologies) || !record.patterns ||
            typeof record.patterns !== 'object' || Array.isArray(record.patterns) ||
            !Object.values(record.patterns).every((patterns) => Array.isArray(patterns) && patterns.every((pattern) =>
                pattern && typeof pattern.type === 'string' && typeof pattern.regex === 'string'
            ))) {
            throw new Error('invalid scan evidence shape')
        }
        return record
    } catch (error) {
        return { error: `Cannot read cache: ${error.message}` }
    }
}

function printSummary(summary, log) {
    log(`\ntechnology\tclaims\t${VERDICTS.join('\t')}\tsuspect rate\tlive companies\tweighted suspects`)
    for (const item of summary) {
        log([
            item.technology, item.claims, ...VERDICTS.map((verdict) => item.counts[verdict]),
            item.suspectRate === null ? 'n/a' : `${(100 * item.suspectRate).toFixed(1)}%`,
            item.liveCompanies ?? 'unknown', item.weightedSuspects,
        ].join('\t'))
    }
}

/* eslint-disable no-console */
async function main(args = process.argv.slice(2), {
    root = ROOT, Driver, lookup, spawnWorker = forkWorker, killBrowsers = killProfileBrowsers,
    profileRoot = os.tmpdir(), log = console.log,
} = {}) {
    const options = parseArgs(args)
    if (options.help) {
        log('Usage: node scripts/stacklookup-audit.js [--check] [--force] [--retry] [--refresh-keys] [--limit N] [--concurrency N]\n' +
            '--check rebuilds the audit from cached scans without network.\n' +
            '--retry rescans hosts that timed out or whose browser failed to start, with a 30 s wait.\n' +
            '--refresh-keys rescans loaded hosts cached before detection keys were recorded.\n' +
            'Default concurrency: 6.')
        return null
    }
    const data = path.join(root, 'data')
    const localPath = (key) => path.join(root, path.relative(ROOT, PATHS[key]))
    const cacheDirectory = localPath('stacklookupScans')
    const output = localPath('stacklookupAudit')
    const files = fs.existsSync(data) ? fs.readdirSync(data).filter((file) => /^stacklookup-sample-part.*\.csv$/.test(file)).sort() : []
    if (!files.length) {
        log('No data/stacklookup-sample-part*.csv (local-only, untracked); restore the exports to run this audit.')
        return null
    }
    const inputs = []
    const inputErrors = []
    for (const file of files) {
        const { rows, errors } = parseSamples(fs.readFileSync(path.join(data, file), 'utf8'))
        inputs.push(...rows)
        errors.forEach((error) => inputErrors.push(`${file}: ${error}`))
    }
    inputErrors.forEach(log)
    const samples = dedupeSamples(inputs)
    const domains = [...new Set(samples.map(({ domain }) => domain))].slice(0, options.limit)
    const selected = new Set(domains)
    const { technologies: catalog } = loadCatalog(path.join(root, 'technologies'))
    const reviews = loadReviews(path.join(data, 'pattern-review'), log)
    const weights = loadWeights(data, log)

    if (!options.check) {
        fs.mkdirSync(cacheDirectory, { recursive: true })
        const cacheFile = (domain) => path.join(cacheDirectory, `${hostName(domain)}.json`)
        const keyless = (record) => record && !record.error && Object.values(record.patterns || {})
            .some((patterns) => patterns.some(({ type, key }) => KEYED.has(type) && key === undefined))
        const pending = domains.filter((domain) => options.retry
            ? RETRYABLE.test((readCache(cacheFile(domain)) || {}).error || '')
            : options.refreshKeys ? keyless(readCache(cacheFile(domain)))
                : options.force || !fs.existsSync(cacheFile(domain)))
        const scanOptions = options.retry ? RETRY_OPTIONS : SCAN_OPTIONS
        log(`${domains.length} hosts selected; ${pending.length} to scan, ${domains.length - pending.length} cached.`)
        if (pending.length) {
            // Only this branch scans; --check cannot launch a browser. An
            // injected Driver scans in-process (tests); otherwise each worker
            // is a child process with its own Chromium profile.
            const workers = []
            const dataDirs = []
            // SIGKILL: Puppeteer's SIGTERM handler can keep a worker alive.
            const killWorkers = () => {
                workers.forEach((worker) => worker.kill('SIGKILL'))
                dataDirs.forEach(killBrowsers)
            }
            const scanners = Array.from({ length: Math.min(options.concurrency, pending.length) }, (_, index) => {
                if (Driver) {
                    return (domain) => scanDomain(domain, Driver, lookup, scanOptions)
                }
                const dataDir = path.join(profileRoot, `stacklookup-chromium-${index}`)
                // A kept profile would answer rescans from Chromium's HTTP cache (304).
                fs.rmSync(dataDir, { recursive: true, force: true })
                dataDirs.push(dataDir)
                const worker = spawnWorker(index, { ...process.env, CHROMIUM_DATA_DIR: dataDir })
                workers.push(worker)
                return workerScanner(worker, scanOptions)
            })
            process.once('exit', killWorkers)
            try {
                let next = 0
                await Promise.all(scanners.map(async (scan) => {
                    while (next < pending.length) {
                        const domain = pending[next++]
                        const record = await scan(domain)
                        if (options.refreshKeys && record.error) {
                            log(`${domain}: kept previous scan (${record.error})`)
                            continue
                        }
                        const target = path.join(cacheDirectory, `${hostName(domain)}.json`)
                        fs.writeFileSync(`${target}.tmp`, `${JSON.stringify(record, null, 2)}\n`)
                        fs.renameSync(`${target}.tmp`, target)
                        log(`${domain}: ${record.error || `HTTP ${record.status}`}${record.partial && record.partial.length ? ` (partial: ${record.partial.join(', ')})` : ''}`)
                    }
                }))
            } finally {
                killWorkers()
                process.removeListener('exit', killWorkers)
            }
        }
    }

    const samplesByDomain = new Map(domains.map((domain) => [domain, []]))
    for (const sample of samples.filter(({ domain }) => selected.has(domain))) {
        samplesByDomain.get(sample.domain).push(sample)
    }
    const claims = new Map()
    const missingCache = []
    // One cache at a time: each holds a full page, and 1,261 of them (2.5 GB)
    // exhausted the heap when read together.
    for (const [domain, domainSamples] of samplesByDomain) {
        const scan = readCache(path.join(cacheDirectory, `${hostName(domain)}.json`))
        if (!scan) {
            missingCache.push(domain)
        }
        for (const sample of domainSamples) {
            for (const { claimed, technology } of mapNames(sample.technologies, catalog)) {
                const key = JSON.stringify([sample.domain, claimed])
                if (!claims.has(key)) {
                    claims.set(key, {
                        domain: sample.domain, rootDomains: [], claimed, technology,
                        ...verdictForClaim(technology || claimed, scan, catalog, reviews),
                    })
                }
                const roots = claims.get(key).rootDomains
                if (!roots.includes(sample.root_domain)) {
                    roots.push(sample.root_domain)
                }
            }
        }
    }
    const rows = [...claims.values()]
    const result = {
        generatedAt: new Date().toISOString(), sources: files, inputErrors,
        hosts: domains.length, missingCache,
        rows, summary: summarize(rows, weights),
    }
    fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`)
    printSummary(result.summary, log)
    log(`\nWrote ${path.relative(root, output)} (${domains.length} hosts, ${rows.length} claims, ${result.missingCache.length} missing caches).`)
    return result
}

if (require.main === module && process.argv[2] === '--worker') {
    runWorker()
} else if (require.main === module) {
    main().catch((error) => {
        console.error(error.message || String(error))
        process.exitCode = 1
    })
}
/* eslint-enable no-console */

module.exports = { main, parseArgs, readReviewData }
