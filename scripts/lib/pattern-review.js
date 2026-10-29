'use strict'

/**
 * Merging a reviewer's verdicts into the pattern triage.
 *
 * The answers are pasted from a model by hand, so nothing in them is trusted:
 * every line must parse, every verdict must be one of the four the prompt
 * allows, and every id must be one that was sent. Whatever fails is reported,
 * never dropped silently.
 */

const VERDICTS = ['credible', 'too-broad', 'wrong', 'needs-evidence']

/**
 * Parse a reply of JSON lines. Markdown code fences and blank lines are
 * ignored; anything else that is not a valid answer becomes an error.
 *
 * @param {string} text
 * @returns {{answers: Array<{id: number, verdict: string, why?: string, fix?: string|null}>, errors: string[]}}
 */
function parseAnswers(text) {
    const answers = []
    const errors = []

    String(text)
        .split(/\r?\n/)
        .forEach((raw, index) => {
            const line = raw.trim()

            if (!line || line.startsWith('```')) {
                return
            }

            let answer

            try {
                answer = JSON.parse(line)
            } catch (error) {
                errors.push(`line ${index + 1}: not JSON`)

                return
            }

            if (!Number.isInteger(answer.id)) {
                errors.push(`line ${index + 1}: missing numeric id`)
            } else if (!VERDICTS.includes(answer.verdict)) {
                errors.push(`line ${index + 1}: verdict "${answer.verdict}" is not one of ${VERDICTS.join(', ')}`)
            } else {
                answers.push(answer)
            }
        })

    return { answers, errors }
}

/**
 * Attach each answer to its pattern as `review`. The first answer for an id
 * wins; later ones are reported as duplicates.
 *
 * @param {object[]} patterns from data/pattern-triage.json
 * @param {object[]} answers from parseAnswers
 * @param {Set<number>} sent ids that were sent for review
 */
function mergeAnswers(patterns, answers, sent) {
    const byId = new Map()
    const duplicates = []
    const unknown = []
    const known = new Set(patterns.map(({ id }) => id))

    for (const answer of answers) {
        if (!known.has(answer.id) || !sent.has(answer.id)) {
            unknown.push(answer.id)
        } else if (byId.has(answer.id)) {
            duplicates.push(answer.id)
        } else {
            byId.set(answer.id, {
                verdict: answer.verdict,
                why: answer.why || '',
                fix: answer.fix || null,
            })
        }
    }

    const merged = patterns.map((item) =>
        byId.has(item.id) ? { ...item, review: byId.get(item.id) } : item
    )
    const missing = [...sent].filter((id) => !byId.has(id)).sort((a, b) => a - b)

    return { merged, missing, unknown, duplicates }
}

/**
 * A fixed, spread-out sample of the patterns triaged `credible`, for a person
 * to confirm the triage did not wave a weak one through. Deterministic, so a
 * rerun asks about the same patterns.
 *
 * @param {object[]} patterns
 * @param {number} share fraction to sample, e.g. 0.05
 */
function spotCheckSample(patterns, share) {
    const credible = patterns.filter(({ verdict }) => verdict === 'credible')
    const size = Math.ceil(credible.length * share)

    if (!size) {
        return []
    }

    const step = credible.length / size

    return Array.from({ length: size }, (_, index) => credible[Math.floor(index * step)])
}

module.exports = {
    VERDICTS,
    mergeAnswers,
    parseAnswers,
    spotCheckSample,
}
