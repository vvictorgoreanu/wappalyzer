'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { main, parseArgs } = require('../scripts/stacklookup-audit')

const ROOT = path.resolve(__dirname, '..')

function fixture(t) {
    const root = fs.mkdtempSync(path.join(ROOT, 'test/.stacklookup-'))
    t.after(() => fs.rmSync(root, { recursive: true, force: true }))
    fs.mkdirSync(path.join(root, 'data/stacklookup-scans'), { recursive: true })
    fs.mkdirSync(path.join(root, 'technologies'))
    fs.writeFileSync(path.join(root, 'technologies/v.json'), JSON.stringify({ Vendor: { html: 'vendor-marker' } }))
    fs.writeFileSync(path.join(root, 'data/stacklookup-sample-part1.csv'),
        'root_domain,domain,time,crawls,technologies\na.com,a.com,2026-10-29,1,vendor\nb.com,b.com,2026-10-29,1,vendor\n')
    return root
}

test('audit flags accept spaced and equals values and reject invalid options before scanning', () => {
    assert.deepEqual(parseArgs(['--check', '--limit', '5', '--concurrency=2']),
        { check: true, force: false, retry: false, limit: 5, concurrency: 2, help: false })
    assert.equal(parseArgs(['--retry']).retry, true)
    assert.throws(() => parseArgs(['--retry', '--check']), /retry/i)
    assert.equal(parseArgs([]).concurrency, 6)
    for (const args of [['--limit', '0'], ['--concurrency=-1'], ['--limit=NaN'], ['--unknown'], ['--limit=1.5']]) {
        assert.throws(() => parseArgs(args), /option|positive integer/i)
    }
})

test('--check rebuilds from cache, loads optional reviews and weights, never constructs a driver', async (t) => {
    const root = fixture(t)
    fs.mkdirSync(path.join(root, 'data/pattern-review'))
    fs.writeFileSync(path.join(root, 'data/pattern-review/merged.json'), JSON.stringify([
        { id: 1, technology: 'Vendor', channel: 'html', key: null, pattern: 'vendor-marker', review: { verdict: 'wrong' } },
    ]))
    fs.writeFileSync(path.join(root, 'data/pattern-review/second-pass-answers-001.jsonl'),
        '{"id":1,"verdict":"overturn","action":"retain"}\n')
    fs.writeFileSync(path.join(root, 'data/stacklookup-top-500-technologies-2026.csv'),
        '\uFEFFrank,technology,live_companies\n1,"vendor",1000\n')
    fs.writeFileSync(path.join(root, 'data/stacklookup-scans/a.com.json'), JSON.stringify({
        status: 200, finalUrl: 'https://a.com/', headers: {}, html: 'vendor-marker',
        technologies: [{ name: 'Vendor' }],
        patterns: { Vendor: [{ type: 'html', regex: 'vendor-marker', match: 'vendor-marker', value: 'vendor-marker' }] },
    }))
    const output = []
    const result = await main(['--check', '--force'], {
        root, Driver: class { constructor() { throw new Error('Network forbidden') } }, log: (line) => output.push(line),
    })

    assert.equal(result.rows[0].verdict, 'confirmed')
    assert.equal(result.rows[1].verdict, 'unverifiable')
    assert.equal(result.summary[0].liveCompanies, 1000)
    assert.ok(output.join('\n').includes('weighted'))
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'data/stacklookup-audit.json'))).rows, result.rows)
})

test('scanner retains page evidence, limits hosts, reuses cache and rescans only with --force', async (t) => {
    const root = fixture(t)
    let opened = 0
    let destroyed = 0
    class Driver {
        constructor(options) {
            assert.equal(options.extended, true)
            assert.equal(options.probe, 'full')
            assert.equal(options.noRedirect, true)
            assert.equal(options.maxWait, 15000)
            assert.equal(options.maxUrls, 1)
            assert.equal(options.recursive, false)
            // Probes start together; each is still bounded by its own 3 s timeout.
            assert.equal(options.delay, 0)
        }
        async init() {}
        async open(url) {
            opened++
            const listeners = {}
            return {
                on(event, listener) { listeners[event] = listener },
                detections: [{ technology: { name: 'Vendor', implies: [] }, pattern: {
                    type: 'html', regex: /vendor-marker/i, value: `${'a'.repeat(300)}vendor-marker`, match: 'vendor-marker',
                } }],
                async analyze() {
                    await listeners.response({ response: { url: () => url, status: () => 200, headers: () => ({ server: 'vendor' }) } })
                    await listeners.goto({ page: { url: () => `${url}final` }, url: new URL(url), html: 'vendor-marker', scriptSrc: ['https://cdn.a.com/v.js'], scripts: [], cookies: {}, meta: {} })
                    return { urls: [{ url, status: 200 }], technologies: [{ name: 'Vendor' }], patterns: {} }
                },
            }
        }
        async destroy() { destroyed++ }
    }
    const options = { root, Driver, log() {} }
    await main(['--limit', '1'], options)
    assert.equal(opened, 1)
    const cached = JSON.parse(fs.readFileSync(path.join(root, 'data/stacklookup-scans/a.com.json')))

    assert.equal(cached.error, null)
    assert.equal(cached.finalUrl, 'https://a.com/final')
    assert.equal(cached.status, 200)
    assert.equal(cached.headers.server, 'vendor')
    assert.equal(cached.html, 'vendor-marker')
    assert.ok(cached.patterns.Vendor[0].value.length > 250)
    await main(['--limit=1'], options)
    assert.equal(opened, 1)
    await main(['--limit=1', '--force'], options)
    assert.equal(opened, 2)
    assert.equal(destroyed, 2)
})

test('scan failures are cached and reported without losing other hosts', async (t) => {
    const root = fixture(t)
    class Driver {
        async init() { throw new Error('browser unavailable') }
        async destroy() {}
    }
    const result = await main([], { root, Driver, log() {} })

    assert.equal(result.rows.length, 2)
    assert.ok(result.rows.every(({ verdict }) => verdict === 'unverifiable'))
    assert.match(JSON.parse(fs.readFileSync(path.join(root, 'data/stacklookup-scans/a.com.json'))).error, /browser unavailable/)
})

test('missing local sample files are reported without attempting any scan', async (t) => {
    const root = fixture(t)
    fs.unlinkSync(path.join(root, 'data/stacklookup-sample-part1.csv'))
    const output = []
    const result = await main(['--check'], { root, log: (line) => output.push(line) })

    assert.equal(result, null)
    assert.match(output.join('\n'), /untracked|local-only/)
})

test('--check reports malformed caches as unverifiable and never refreshes them', async (t) => {
    const root = fixture(t)
    fs.writeFileSync(path.join(root, 'data/stacklookup-scans/a.com.json'), '{not json')
    fs.writeFileSync(path.join(root, 'data/stacklookup-scans/b.com.json'), JSON.stringify({
        status: 200, technologies: {}, patterns: {},
    }))
    const result = await main(['--check'], { root, log() {} })

    assert.ok(result.rows.every(({ verdict }) => verdict === 'unverifiable'))
    assert.ok(result.rows.every(({ reason }) => /cache/i.test(reason)))
})

test('concurrency is bounded and duplicate hosts across sample parts scan once', async (t) => {
    const root = fixture(t)
    fs.writeFileSync(path.join(root, 'data/stacklookup-sample-part2.csv'),
        'root_domain,domain,time,crawls,technologies\na.com,a.com,2026-10-28,1,vendor\nc.com,c.com,2026-10-29,1,vendor\n')
    let active = 0
    let peak = 0
    const opened = []
    class Driver {
        async init() { active++; peak = Math.max(peak, active) }
        async open(url) {
            opened.push(url)
            return {
                on() {},
                async analyze() {
                    await new Promise((resolve) => setImmediate(resolve))
                    return { technologies: [], patterns: {}, urls: [{ url, status: 200 }] }
                },
            }
        }
        async destroy() { active-- }
    }
    const result = await main(['--concurrency', '2'], { root, Driver, log() {} })

    assert.equal(opened.length, 3)
    assert.equal(new Set(opened).size, 3)
    assert.equal(peak, 2)
    assert.equal(result.rows.length, 3)
})

test('teardown watchdog can kill Chromium even after destroy clears the browser handle', async (t) => {
    const root = fixture(t)
    let killed = 0
    class Driver {
        constructor() { this.browser = { process: () => ({ kill() { killed++ } }) } }
        async init() { throw new Error('initialization failed') }
        async destroy() {
            this.browser = null
            return new Promise(() => {})
        }
    }
    await main(['--limit=1'], { root, Driver, log() {} })
    assert.equal(killed, 1)
})

test('secondary probe failures and js timeouts are recorded without failing the page', async (t) => {
    const root = fixture(t)
    class Driver {
        async init() {}
        async open(url) {
            const listeners = {}
            return {
                on(event, listener) { listeners[event] = listener },
                async analyze() {
                    listeners.error({ message: 'Probe failed (/api/v1/clusters): Timeout (https://a.com/api/v1/clusters, 3000ms)' })
                    listeners.error({ message: 'Error: Timeout (js)' })
                    await listeners.response({ response: { url: () => url, status: () => 200, headers: () => ({}) } })
                    return { urls: [{ url, status: 200 }], technologies: [], patterns: {} }
                },
            }
        }
        async destroy() {}
    }
    await main(['--limit=1'], { root, Driver, log() {} })
    const cached = JSON.parse(fs.readFileSync(path.join(root, 'data/stacklookup-scans/a.com.json')))

    assert.equal(cached.error, null)
    assert.deepEqual(cached.partial, ['js'])
    assert.equal(cached.probeErrors.length, 1)
    assert.equal(typeof cached.elapsedMs, 'number')
})

test('without an injected driver each worker is a separate process with its own Chromium profile', async (t) => {
    const root = fixture(t)
    fs.writeFileSync(path.join(root, 'data/stacklookup-sample-part2.csv'),
        'root_domain,domain,time,crawls,technologies\nc.com,c.com,2026-10-29,1,vendor\n')
    const spawned = []
    const scanned = []
    const spawnWorker = (index, env) => {
        const handlers = {}
        const worker = {
            index, env, killed: false,
            on(event, handler) { handlers[event] = handler },
            send({ domain }) {
                scanned.push([index, domain])
                setImmediate(() => handlers.message({ domain, record: {
                    domain, finalUrl: `https://${domain}/`, status: 200, html: 'vendor-marker',
                    technologies: [], patterns: {}, errors: [], error: null,
                } }))
            },
            kill(signal) { worker.killed = signal },
        }
        spawned.push(worker)
        return worker
    }
    const swept = []
    const killBrowsers = (dataDir) => swept.push(dataDir)
    // A profile kept from an earlier run answers rescans from Chromium's HTTP
    // cache (304), which the audit cannot verify.
    const stale = path.join(root, 'stacklookup-chromium-0/Default')
    fs.mkdirSync(stale, { recursive: true })
    const result = await main(['--concurrency', '2'], { root, spawnWorker, killBrowsers, profileRoot: root, log() {} })

    assert.equal(spawned.length, 2)
    assert.equal(new Set(spawned.map(({ env }) => env.CHROMIUM_DATA_DIR)).size, 2)
    assert.equal(spawned[0].env.CHROMIUM_DATA_DIR, path.join(root, 'stacklookup-chromium-0'))
    assert.equal(fs.existsSync(stale), false)
    assert.deepEqual(scanned.map(([, domain]) => domain).sort(), ['a.com', 'b.com', 'c.com'])
    // A worker whose Chromium launch failed can ignore SIGTERM and leave that
    // browser running, so workers are killed outright and their profiles swept.
    assert.ok(spawned.every(({ killed }) => killed === 'SIGKILL'))
    assert.deepEqual(swept.sort(), spawned.map(({ env }) => env.CHROMIUM_DATA_DIR).sort())
    assert.equal(result.rows.length, 3)
})

test('a worker that exits mid-scan fails only its host', async (t) => {
    const root = fixture(t)
    const spawnWorker = () => {
        const handlers = {}
        return {
            on(event, handler) { handlers[event] = handler },
            send({ domain }) {
                setImmediate(() => domain === 'a.com'
                    ? handlers.exit(1, null)
                    : handlers.message({ domain, record: {
                        domain, finalUrl: `https://${domain}/`, status: 200, html: '',
                        technologies: [], patterns: {}, errors: [], error: null,
                    } }))
            },
            kill() {},
        }
    }
    await main(['--concurrency', '1'], { root, spawnWorker, killBrowsers() {}, log() {} })
    const read = (host) => JSON.parse(fs.readFileSync(path.join(root, `data/stacklookup-scans/${host}.json`)))

    assert.match(read('a.com').error, /worker exited/i)
    assert.equal(read('b.com').error, null)
})

test('a host that does not resolve is recorded without launching a browser', async (t) => {
    const root = fixture(t)
    let constructed = 0
    class Driver {
        constructor() { constructed++ }
        async init() {}
        async open(url) {
            return { on() {}, async analyze() { return { urls: [{ url, status: 200 }], technologies: [], patterns: {} } } }
        }
        async destroy() {}
    }
    const lookup = async (host) => {
        if (host === 'a.com') {
            throw Object.assign(new Error(`getaddrinfo ENOTFOUND ${host}`), { code: 'ENOTFOUND' })
        }
        if (host === 'b.com') {
            throw Object.assign(new Error(`getaddrinfo EAI_AGAIN ${host}`), { code: 'EAI_AGAIN' })
        }
        return { address: '192.0.2.1' }
    }
    const result = await main(['--concurrency', '1'], { root, Driver, lookup, log() {} })
    const read = (host) => JSON.parse(fs.readFileSync(path.join(root, `data/stacklookup-scans/${host}.json`)))

    assert.match(read('a.com').error, /could not be resolved/i)
    // A transient resolver failure is not proof the host is gone, so it is scanned.
    assert.equal(read('b.com').error, null)
    assert.equal(constructed, 1)
    assert.equal(result.rows.find(({ domain }) => domain === 'a.com').verdict, 'unverifiable')
})

test('--retry rescans only hosts that failed to load in time, with a longer wait', async (t) => {
    const root = fixture(t)
    fs.writeFileSync(path.join(root, 'data/stacklookup-sample-part2.csv'),
        'root_domain,domain,time,crawls,technologies\nc.com,c.com,2026-10-29,1,vendor\nd.com,d.com,2026-10-29,1,vendor\n')
    const cache = (host, fields) => fs.writeFileSync(path.join(root, `data/stacklookup-scans/${host}.json`), JSON.stringify({
        domain: host, finalUrl: `https://${host}/`, status: null, html: '', technologies: [], patterns: {}, errors: [], ...fields,
    }))
    cache('a.com', { error: 'Navigation timeout of 15000 ms exceeded (https://a.com/)' })
    cache('b.com', { error: 'Timed out after 15000 ms while waiting for the WS endpoint URL to appear in stdout!' })
    cache('c.com', { error: null, status: 404 })
    cache('d.com', { error: 'Hostname could not be resolved (d.com)' })
    const opened = []
    class Driver {
        constructor(options) { assert.equal(options.maxWait, 30000) }
        async init() {}
        async open(url) {
            opened.push(url)
            return { on() {}, async analyze() { return { urls: [{ url, status: 200 }], technologies: [], patterns: {} } } }
        }
        async destroy() {}
    }
    await main(['--retry'], { root, Driver, log() {} })

    assert.deepEqual(opened.sort(), ['https://a.com/', 'https://b.com/'])
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'data/stacklookup-scans/a.com.json'))).options.maxWait, 30000)
})
