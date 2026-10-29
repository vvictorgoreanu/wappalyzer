#!/usr/bin/env node

'use strict'

/**
 * Replay edited technology patterns over the cached StackLookup audit scans.
 *
 *   npm run replay:stacklookup                  # working tree vs HEAD
 *   npm run replay:stacklookup -- --base main   # working tree vs main
 *
 * Every technology whose definition differs from the base is matched against
 * each cached page that loaded, old rules and new, and the hosts it loses or
 * gains are written to the gitignored data/stacklookup-replay.md.
 */

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { loadCatalog } = require('./lib/catalog')
const { hostName } = require('./lib/stacklookup')
const { changedTechnologies, replayHost, rescanChannels, summarizeReplay, renderReplay } = require('./lib/stacklookup-replay')

const ROOT = path.resolve(__dirname, '..')

function parseArgs(args) {
    const options = { base: 'HEAD' }
    for (let index = 0; index < args.length; index++) {
        if (args[index] === '--base' && args[index + 1]) {
            options.base = args[++index]
        } else {
            throw new Error(`Unknown argument: ${args[index]}`)
        }
    }
    // Passed to git as a revision, never as an option.
    if (!/^[\w][\w./~^-]*$/.test(options.base)) {
        throw new Error(`Invalid --base revision: ${options.base}`)
    }
    return options
}

function git(root, args) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
    if (result.status !== 0) {
        throw new Error(`git ${args.join(' ')}: ${(result.stderr || '').trim()}`)
    }
    return result.stdout
}

/** The catalog as committed at a revision, flattened like loadCatalog(). */
function catalogAt(root, revision) {
    const technologies = {}
    const files = git(root, ['ls-tree', '--name-only', `${revision}:technologies`]).split('\n')
        .filter((file) => file.endsWith('.json')).sort()
    for (const file of files) {
        Object.assign(technologies, JSON.parse(git(root, ['show', `${revision}:technologies/${file}`])))
    }
    return technologies
}

const loaded = (record) => !record.error && record.status >= 200 && record.status < 300 &&
    !/^chrome-error:/.test(record.finalUrl || '')

function main(args = process.argv.slice(2), { root = ROOT, log = console.log, readBase = catalogAt } = {}) {
    const options = parseArgs(args)
    const before = readBase(root, options.base)
    const after = loadCatalog(path.join(root, 'technologies')).technologies
    const names = changedTechnologies(before, after)
    if (!names.length) {
        log(`No technology differs from ${options.base}; nothing to replay.`)
        return []
    }
    const claims = new Map()
    const audit = path.join(root, 'data/stacklookup-audit.json')
    if (fs.existsSync(audit)) {
        for (const row of JSON.parse(fs.readFileSync(audit, 'utf8')).rows) {
            claims.set(JSON.stringify([hostName(row.domain), row.technology]), row.verdict)
        }
    } else {
        log('No data/stacklookup-audit.json; hosts are listed without their StackLookup claim.')
    }
    const entries = new Map(names.map((name) => [name, []]))
    const directory = path.join(root, 'data/stacklookup-scans')
    // One cache at a time; together they do not fit in memory.
    for (const file of fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort()) {
        const record = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'))
        if (!loaded(record)) {
            continue
        }
        const host = file.slice(0, -'.json'.length)
        for (const name of names) {
            const { before: old, after: now } = replayHost(record, name, before[name], after[name])
            if (old.length || now.length) {
                entries.get(name).push({ host, claim: claims.get(JSON.stringify([host, name])) ?? null, before: old, after: now })
            }
        }
    }
    const summaries = names.map((name) => summarizeReplay(name, entries.get(name), rescanChannels(before[name], after[name])))
    const output = path.join(root, 'data/stacklookup-replay.md')
    fs.writeFileSync(output, renderReplay(summaries))
    for (const summary of summaries) {
        log(`${summary.technology}: ${summary.hostsBefore} → ${summary.hostsAfter} hosts ` +
            `(${summary.lost.length} lost, ${summary.lostConfirmed} of them confirmed claims; ${summary.added.length} added)` +
            `${summary.rescan.length ? `; rescan for ${summary.rescan.join(', ')}` : ''}`)
    }
    log(`Wrote ${path.relative(root, output)}.`)
    return summaries
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
