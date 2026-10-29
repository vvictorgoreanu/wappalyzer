#!/usr/bin/env node

'use strict'

/**
 * Write or refresh the decision record for one technology.
 *
 *   npm run decision:stacklookup -- "IBM WebSphere Application Server"
 *   npm run decision:stacklookup -- "IBM WebSphere Application Server" --show <host>
 *
 * The proposed change is the working-tree definition when it differs from
 * the base revision (default HEAD), otherwise Codex's second-pass fix applied
 * in memory. Records name customer hosts, so they go to the gitignored
 * data/decisions/ folder. The hand-written Decision section is kept.
 */

const fs = require('fs')
const path = require('path')
const { loadCatalog } = require('./lib/catalog')
const { hostName } = require('./lib/stacklookup')
const { replayHost } = require('./lib/stacklookup-replay')
const { slug, proposeFromSecondPass, buildRecord, renderRecord, keptArgument } = require('./lib/stacklookup-decision')
const { readReviewData } = require('./stacklookup-audit')
const { catalogAt, loadClaims, replayCaches } = require('./stacklookup-replay')

const ROOT = path.resolve(__dirname, '..')

function parseArgs(args) {
    const options = { technology: null, base: 'HEAD', show: null }
    for (let index = 0; index < args.length; index++) {
        if (['--base', '--show'].includes(args[index]) && args[index + 1]) {
            options[args[index].slice(2)] = args[++index]
        } else if (!args[index].startsWith('--') && options.technology === null) {
            options.technology = args[index]
        } else {
            throw new Error(`Unknown argument: ${args[index]}`)
        }
    }
    if (!options.technology) {
        throw new Error('Usage: decision:stacklookup -- "<technology>" [--base <rev>] [--show <host>]')
    }
    // Passed to git as a revision, never as an option.
    if (!/^[\w][\w./~^-]*$/.test(options.base)) {
        throw new Error(`Invalid --base revision: ${options.base}`)
    }
    // Becomes a file name under data/stacklookup-scans/.
    if (options.show !== null && !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(options.show)) {
        throw new Error(`Invalid host: ${options.show}`)
    }
    return options
}

/** The record's own words around a match, so the reader sees what it hit. */
function around(detection) {
    const value = String(detection.value ?? '')
    const at = value.indexOf(detection.match)
    if (at === -1 || value.length <= 200) {
        return value.slice(0, 200)
    }
    const start = Math.max(0, at - 80)
    return value.slice(start, start + 200)
}

function show(root, technology, definition, host, log) {
    const file = path.join(root, 'data/stacklookup-scans', `${hostName(host)}.json`)
    if (!fs.existsSync(file)) {
        throw new Error(`No cached scan for ${host}`)
    }
    const record = JSON.parse(fs.readFileSync(file, 'utf8'))
    const page = { ...record, value: undefined }
    const { before } = replayHost(record, technology, definition, definition)
    log(`${host} (${record.finalUrl}, HTTP ${record.status}): ${before.length} match${before.length === 1 ? '' : 'es'} for ${technology}`)
    for (const detection of before) {
        // Page channels carry no value of their own; html matches are shown in the page.
        const source = detection.value === undefined && detection.type === 'html' ? { ...detection, value: page.html } : detection
        log(`- ${detection.type}${detection.key ? ` ${detection.key}` : ''}: ${detection.match}`)
        log(`  regex: ${detection.regex}`)
        log(`  context: ${around(source).replace(/\s+/g, ' ')}`)
    }
    return before
}

function main(args = process.argv.slice(2), { root = ROOT, log = console.log, readBase = catalogAt } = {}) {
    const options = parseArgs(args)
    const current = loadCatalog(path.join(root, 'technologies')).technologies
    const base = readBase(root, options.base)
    const technology = [...new Set([...Object.keys(base), ...Object.keys(current)])]
        .find((name) => name.toLowerCase() === options.technology.toLowerCase())
    if (!technology) {
        throw new Error(`${options.technology} is not in the catalog`)
    }
    if (options.show) {
        return show(root, technology, current[technology], options.show, log)
    }
    const auditFile = path.join(root, 'data/stacklookup-audit.json')
    if (!fs.existsSync(auditFile)) {
        throw new Error('No data/stacklookup-audit.json; run `npm run audit:stacklookup -- --check` first.')
    }
    const rows = JSON.parse(fs.readFileSync(auditFile, 'utf8')).rows.filter((row) => row.technology === technology)
    const { patterns: reviews, answers } = readReviewData(path.join(root, 'data/pattern-review')) || { patterns: [], answers: [] }

    const definition = base[technology]
    const edited = JSON.stringify(current[technology]) !== JSON.stringify(definition)
    const proposed = edited ? current[technology] : proposeFromSecondPass(definition || {}, reviews
        .filter((review) => review.technology.toLowerCase() === technology.toLowerCase()), answers)
    const source = edited ? `working tree vs ${options.base}` : "Codex's second pass, applied in memory (catalog unchanged)"
    const [replay] = replayCaches(root, [technology], { [technology]: definition }, { [technology]: proposed }, loadClaims(root, log))

    const record = buildRecord({ technology, definition, proposed, source, rows, reviews, answers, replay })
    const output = path.join(root, 'data/decisions', `${slug(technology)}.md`)
    const previous = fs.existsSync(output) ? keptArgument(fs.readFileSync(output, 'utf8')) : null
    fs.mkdirSync(path.dirname(output), { recursive: true })
    fs.writeFileSync(output, renderRecord(record, previous))
    log(`${technology}: ${rows.length} claims; replay ${replay.hostsBefore} → ${replay.hostsAfter} hosts ` +
        `(${replay.lost.length} lost, ${replay.lostConfirmed} confirmed). Wrote ${path.relative(root, output)}` +
        `${previous ? ' (Decision section kept)' : ''}.`)
    return record
}

if (require.main === module) {
    try {
        main()
    } catch (error) {
        console.error(error.message || String(error)) // eslint-disable-line no-console
        process.exitCode = 1
    }
}

module.exports = { main, parseArgs }
