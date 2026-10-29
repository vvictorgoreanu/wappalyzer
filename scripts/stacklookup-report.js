#!/usr/bin/env node

'use strict'

/**
 * Write the StackLookup audit report from data/stacklookup-audit.json.
 *
 *   npm run report:stacklookup
 *   npm run report:stacklookup -- --catalog ../stack-lookup-app/data/technology_v0.csv
 *
 * The catalog's is_countable column separates web basics from real
 * technologies among unreviewed claims. The report lists customer domains,
 * so it is written to the gitignored data/ folder.
 */

const fs = require('fs')
const path = require('path')
const { parseCsv } = require('./lib/stacklookup')
const { basicsFrom, buildReport, renderMarkdown } = require('./lib/stacklookup-report')

const ROOT = path.resolve(__dirname, '..')

function parseArgs(args) {
    const options = { catalog: null }
    for (let index = 0; index < args.length; index++) {
        if (args[index] === '--catalog' && args[index + 1]) {
            options.catalog = args[++index]
        } else {
            throw new Error(`Unknown argument: ${args[index]}`)
        }
    }
    return options
}

function main(args = process.argv.slice(2), { root = ROOT, log = console.log } = {}) {
    const options = parseArgs(args)
    const auditFile = path.join(root, 'data/stacklookup-audit.json')
    if (!fs.existsSync(auditFile)) {
        throw new Error('No data/stacklookup-audit.json; run `npm run audit:stacklookup -- --check` first.')
    }
    const catalog = options.catalog
        ? path.resolve(options.catalog)
        : path.resolve(root, '../stack-lookup-app/data/technology_v0.csv')
    let basics = null
    if (fs.existsSync(catalog)) {
        const { columns, rows } = parseCsv(fs.readFileSync(catalog, 'utf8'))
        if (!columns.includes('is_countable') || !columns.includes('name')) {
            throw new Error(`${catalog}: expected name and is_countable columns`)
        }
        basics = basicsFrom(rows)
    } else if (options.catalog) {
        throw new Error(`${catalog}: not found`)
    } else {
        log(`No StackLookup catalog at ${catalog}; web basics are not split out.`)
    }
    const report = buildReport(JSON.parse(fs.readFileSync(auditFile, 'utf8')), { basics })
    const output = path.join(root, 'data/stacklookup-report.md')
    fs.writeFileSync(output, renderMarkdown(report))
    log(`Wrote ${path.relative(root, output)} (${report.technologies.length} technologies with suspects).`)
    return report
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
