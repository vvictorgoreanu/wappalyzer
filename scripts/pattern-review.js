#!/usr/bin/env node

'use strict'

/**
 * Merges reviewer answers into the pattern triage and lists what needs a
 * person's decision.
 *
 * Reads data/pattern-triage.json and, for each data/pattern-review/batch-NNN.jsonl,
 * the matching answers-NNN.jsonl (see docs/ai/stacklookup-compare/chatgpt-review-prompt.md).
 * A batch without an answers file is reported as pending.
 *
 * Writes (local-only, gitignored):
 *   data/pattern-review/merged.json       every pattern, with `review` where answered
 *   data/pattern-review/spot-check.jsonl  5 % of triage-credible patterns to confirm
 *
 * Usage: node scripts/pattern-review.js
 */

const fs = require('fs')
const path = require('path')

const { VERDICTS, mergeAnswers, parseAnswers, spotCheckSample } = require('./lib/pattern-review')

const ROOT = path.resolve(__dirname, '..')
const TRIAGE = path.join(ROOT, 'data/pattern-triage.json')
const REVIEW_DIR = path.join(ROOT, 'data/pattern-review')

/* eslint-disable no-console */
function main() {
    if (!fs.existsSync(TRIAGE)) {
        throw new Error('No data/pattern-triage.json; run `npm run triage:patterns` first')
    }

    const { patterns } = JSON.parse(fs.readFileSync(TRIAGE, 'utf8'))
    const batches = fs
        .readdirSync(REVIEW_DIR)
        .filter((file) => /^batch-\d+\.jsonl$/.test(file))
        .sort()

    const sent = new Set()
    const answers = []
    const pending = []

    for (const batch of batches) {
        const answersFile = batch.replace('batch-', 'answers-')
        const answersPath = path.join(REVIEW_DIR, answersFile)

        if (!fs.existsSync(answersPath)) {
            pending.push(batch)
            continue
        }

        fs.readFileSync(path.join(REVIEW_DIR, batch), 'utf8')
            .trim()
            .split(/\r?\n/)
            .forEach((line) => sent.add(JSON.parse(line).id))

        const parsed = parseAnswers(fs.readFileSync(answersPath, 'utf8'))

        parsed.errors.forEach((error) => console.log(`${answersFile} ${error}`))
        answers.push(...parsed.answers)
    }

    const { merged, missing, unknown, duplicates } = mergeAnswers(patterns, answers, sent)

    fs.writeFileSync(path.join(REVIEW_DIR, 'merged.json'), `${JSON.stringify(merged, null, 2)}\n`)

    const sample = spotCheckSample(patterns, 0.05)

    fs.writeFileSync(
        path.join(REVIEW_DIR, 'spot-check.jsonl'),
        `${sample.map(({ id, technology, channel, key, pattern }) =>
            JSON.stringify({ id, technology, channel, key, pattern })).join('\n')}\n`
    )

    const reviewed = merged.filter(({ review }) => review)

    console.log(`Answered: ${reviewed.length} of ${sent.size} sent (${batches.length - pending.length}/${batches.length} batches)`)

    if (pending.length) {
        console.log(`Pending batches: ${pending.join(', ')}`)
    }

    if (missing.length) {
        console.log(`Sent but unanswered ids (resend these): ${missing.join(', ')}`)
    }

    if (unknown.length) {
        console.log(`Answers for ids that were not sent (ignored): ${unknown.join(', ')}`)
    }

    if (duplicates.length) {
        console.log(`Duplicate answers (first kept): ${duplicates.join(', ')}`)
    }

    console.log('\nreview verdict      from suspect  from unclear')

    for (const verdict of VERDICTS) {
        const count = (triage) => reviewed.filter((item) => item.verdict === triage && item.review.verdict === verdict).length

        console.log(`${verdict.padEnd(18)} ${String(count('suspect')).padStart(13)} ${String(count('unclear')).padStart(13)}`)
    }

    const flagged = reviewed
        .filter(({ review }) => review.verdict === 'too-broad' || review.verdict === 'wrong')
        .sort((a, b) => (b.liveCompanies || 0) - (a.liveCompanies || 0) || a.id - b.id)

    console.log(`\nFor your decision — too-broad / wrong (${flagged.length}), most companies first:`)

    for (const item of flagged) {
        console.log(
            `#${item.id} ${item.technology} [${item.channel}${item.key ? ` ${item.key}` : ''}] ` +
                `${item.pattern} — ${item.review.verdict}: ${item.review.why}` +
                (item.review.fix ? ` | fix: ${item.review.fix}` : '')
        )
    }

    console.log(
        `\nWrote data/pattern-review/merged.json and spot-check.jsonl ` +
            `(${sample.length} credible patterns to confirm by hand)`
    )
}
/* eslint-enable no-console */

main()
