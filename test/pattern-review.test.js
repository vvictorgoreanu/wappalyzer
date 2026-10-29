'use strict'

/**
 * Tests for merging a reviewer's answers back into the pattern triage.
 *
 * Answers come from a model pasted by hand, so the merge has to refuse what it
 * cannot trust — unknown ids, made-up verdicts, lines that are not JSON — and
 * say which batch lines are still unanswered, instead of quietly dropping them.
 */

const test = require('node:test')
const assert = require('node:assert/strict')

const { mergeAnswers, parseAnswers, spotCheckSample } = require('../scripts/lib/pattern-review')

const pattern = (id, verdict = 'unclear', liveCompanies = 100) => ({
    id,
    technology: `Tech ${id}`,
    liveCompanies,
    channel: 'js',
    key: `k${id}`,
    pattern: '',
    verdict,
    reasons: [],
})

test('parseAnswers reads JSON lines and tolerates a fenced code block', () => {
    const { answers, errors } = parseAnswers(
        '```json\n{"id": 1, "verdict": "credible", "why": "x", "fix": null}\n\n' +
            '{"id": 2, "verdict": "too-broad", "why": "y", "fix": "abc"}\n```\n'
    )

    assert.deepEqual(answers.map(({ id }) => id), [1, 2])
    assert.deepEqual(errors, [])
})

test('parseAnswers reports lines that are not JSON or carry an unknown verdict', () => {
    const { answers, errors } = parseAnswers(
        '{"id": 1, "verdict": "credible"}\nnot json\n{"id": 3, "verdict": "probably"}\n'
    )

    assert.deepEqual(answers.map(({ id }) => id), [1])
    assert.equal(errors.length, 2)
    assert.match(errors[0], /line 2/)
    assert.match(errors[1], /verdict "probably"/)
})

test('mergeAnswers attaches reviews and lists what is missing or unknown', () => {
    const patterns = [pattern(1), pattern(2, 'suspect'), pattern(3, 'credible')]
    const { merged, missing, unknown, duplicates } = mergeAnswers(
        patterns,
        [
            { id: 1, verdict: 'credible', why: 'vendor global', fix: null },
            { id: 2, verdict: 'too-broad', why: 'generic', fix: 'k2x' },
            { id: 2, verdict: 'credible', why: 'again', fix: null },
            { id: 99, verdict: 'wrong', why: 'stray', fix: null },
        ],
        new Set([1, 2])
    )

    assert.equal(merged.find(({ id }) => id === 1).review.verdict, 'credible')
    assert.equal(merged.find(({ id }) => id === 2).review.verdict, 'too-broad')
    assert.equal(merged.find(({ id }) => id === 3).review, undefined)
    assert.deepEqual(missing, [])
    assert.deepEqual(unknown, [99])
    assert.deepEqual(duplicates, [2])
})

test('mergeAnswers reports sent ids that got no answer', () => {
    const { missing } = mergeAnswers([pattern(1), pattern(2)], [{ id: 1, verdict: 'credible' }], new Set([1, 2]))

    assert.deepEqual(missing, [2])
})

test('spotCheckSample is deterministic and about 5 % of credible patterns', () => {
    const patterns = Array.from({ length: 200 }, (_, index) => pattern(index + 1, 'credible'))
    const first = spotCheckSample(patterns, 0.05)

    assert.equal(first.length, 10)
    assert.deepEqual(spotCheckSample(patterns, 0.05), first)
    assert.ok(first.every(({ verdict }) => verdict === 'credible'))
})
