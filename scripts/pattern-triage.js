#!/usr/bin/env node

'use strict'

/**
 * Mechanical triage of the catalog's patterns, so only the doubtful ones need a
 * reviewer. See scripts/lib/pattern-triage.js for the rules.
 *
 * Scope is the technologies in the newest StackLookup top-500 export
 * (data/stacklookup-top-500-technologies-*.csv), ranked by live companies, or
 * the whole catalog with --all.
 *
 * Usage:
 *   node scripts/pattern-triage.js            # top-500 technologies
 *   node scripts/pattern-triage.js --all      # every technology
 *   node scripts/pattern-triage.js --batch=150
 *   node scripts/pattern-triage.js --force    # rewrite batches despite answers
 *
 * Writes (local-only, gitignored):
 *   data/pattern-triage.json             every pattern with its verdict
 *   data/pattern-review/batch-NNN.jsonl  suspect + unclear patterns, one
 *                                        compact line each, for a reviewer
 */

const fs = require('fs')
const path = require('path')

const { loadCatalog } = require('./lib/catalog')
const { buildTokenOwners, extractPatterns, triagePattern } = require('./lib/pattern-triage')

const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'data')
const RESULTS = path.join(DATA, 'pattern-triage.json')
const REVIEW_DIR = path.join(DATA, 'pattern-review')

const args = process.argv.slice(2)
const ALL = args.includes('--all')
const FORCE = args.includes('--force')
const batchArg = args.find((value) => value.startsWith('--batch='))
const BATCH = batchArg ? Number(batchArg.split('=')[1]) : 150

/** Top-500 rows as {rank, name, liveCompanies}, from the newest export. */
function loadTopList() {
    const files = fs
        .readdirSync(DATA)
        .filter((file) => /^stacklookup-top-500-technologies-.*\.csv$/.test(file))
        .sort()

    if (!files.length) {
        throw new Error(
            'No data/stacklookup-top-500-technologies-*.csv (local-only); ' +
                'restore it or run with --all'
        )
    }

    const [header, ...lines] = fs
        .readFileSync(path.join(DATA, files[files.length - 1]), 'utf8')
        .replace(/^﻿/, '')
        .trim()
        .split(/\r?\n/)
    const columns = header.split(',')
    const at = (cells, column) => cells[columns.indexOf(column)]

    return {
        file: files[files.length - 1],
        rows: lines.map((line) => {
            const cells = line.split(',')

            return {
                rank: Number(at(cells, 'rank')),
                name: at(cells, 'technology'),
                liveCompanies: Number(at(cells, 'live_companies')),
            }
        }),
    }
}

function main() {
    const { technologies } = loadCatalog(path.join(ROOT, 'technologies'))
    // Counted over the whole catalog, so a token shared with a technology
    // outside the scope still counts as shared.
    const tokenOwners = buildTokenOwners(technologies)
    const byLowerName = new Map(
        Object.keys(technologies).map((name) => [name.toLowerCase(), name])
    )

    let scope
    let source

    if (ALL) {
        scope = Object.keys(technologies).map((name) => ({ name, rank: null, liveCompanies: null }))
        source = 'whole catalog'
    } else {
        const top = loadTopList()

        scope = top.rows
        source = top.file
    }

    const missing = []
    const patterns = []

    for (const row of scope) {
        const name = byLowerName.get(String(row.name).toLowerCase())

        if (!name) {
            missing.push(row.name)
            continue
        }

        for (const unit of extractPatterns(name, technologies[name])) {
            const { verdict, reasons, literal } = triagePattern({ ...unit, tokenOwners })

            patterns.push({
                id: patterns.length + 1,
                technology: name,
                rank: row.rank,
                liveCompanies: row.liveCompanies,
                website: technologies[name].website || null,
                channel: unit.channel,
                key: unit.key,
                pattern: unit.value,
                literal,
                verdict,
                reasons,
            })
        }
    }

    const counts = {}

    for (const { channel, verdict } of patterns) {
        counts[channel] = counts[channel] || { credible: 0, suspect: 0, unclear: 0 }
        counts[channel][verdict]++
    }

    fs.writeFileSync(
        RESULTS,
        `${JSON.stringify({ source, generatedAt: new Date().toISOString(), missing, counts, patterns }, null, 2)}\n`
    )

    // Review batches: suspects first (they need a decision), then unclear, each
    // ordered by how many companies the technology covers.
    const review = patterns
        .filter(({ verdict }) => verdict !== 'credible')
        .sort((a, b) =>
            (a.verdict === b.verdict ? 0 : a.verdict === 'suspect' ? -1 : 1) ||
            (b.liveCompanies || 0) - (a.liveCompanies || 0) ||
            a.id - b.id
        )

    fs.mkdirSync(REVIEW_DIR, { recursive: true })

    // Answers refer to pattern ids, which shift when the catalog changes, so
    // rewriting the batches under existing answers would misattribute them.
    const answered = fs.readdirSync(REVIEW_DIR).filter((file) => /^answers-\d+\.jsonl$/.test(file))

    if (answered.length && !FORCE) {
        throw new Error(
            `data/pattern-review/ holds reviewer answers (${answered.join(', ')}); ` +
                'move them aside or rerun with --force to rewrite the batches'
        )
    }

    fs.readdirSync(REVIEW_DIR)
        .filter((file) => /^batch-\d+\.jsonl$/.test(file))
        .forEach((file) => fs.rmSync(path.join(REVIEW_DIR, file)))

    for (let start = 0; start < review.length; start += BATCH) {
        const lines = review.slice(start, start + BATCH).map((item) =>
            JSON.stringify({
                id: item.id,
                technology: item.technology,
                website: item.website,
                channel: item.channel,
                key: item.key,
                pattern: item.pattern,
                triage: item.verdict,
                reason: item.reasons.join('; '),
            })
        )
        const file = `batch-${String(start / BATCH + 1).padStart(3, '0')}.jsonl`

        fs.writeFileSync(path.join(REVIEW_DIR, file), `${lines.join('\n')}\n`)
    }

    const total = (verdict) => patterns.filter((item) => item.verdict === verdict).length

    /* eslint-disable no-console */
    console.log(`Scope: ${source} (${scope.length} technologies, ${missing.length} not in catalog)`)

    if (missing.length) {
        console.log(`  not in catalog: ${missing.join(', ')}`)
    }

    console.log(
        `Patterns: ${patterns.length} — credible ${total('credible')}, ` +
            `suspect ${total('suspect')}, unclear ${total('unclear')}`
    )
    console.log('\nchannel        credible  suspect  unclear')

    for (const [channel, row] of Object.entries(counts).sort((a, b) =>
        b[1].credible + b[1].suspect + b[1].unclear - (a[1].credible + a[1].suspect + a[1].unclear)
    )) {
        console.log(
            `${channel.padEnd(14)} ${String(row.credible).padStart(8)} ` +
                `${String(row.suspect).padStart(8)} ${String(row.unclear).padStart(8)}`
        )
    }

    console.log(
        `\nWrote ${path.relative(ROOT, RESULTS)} and ` +
            `${Math.ceil(review.length / BATCH)} review batch(es) in ${path.relative(ROOT, REVIEW_DIR)}/`
    )
    /* eslint-enable no-console */
}

main()
