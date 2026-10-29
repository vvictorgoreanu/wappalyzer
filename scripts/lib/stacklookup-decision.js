'use strict'

/**
 * A decision record per technology: why its patterns change (or stay), with
 * the evidence in one place. Gathers the rules, Codex's pattern reviews, what
 * each rule matched in the StackLookup audit, the claims it missed, and a
 * replay of the proposed definition over the cached scans. The argument is
 * written by hand between two markers and survives regeneration.
 */

const Wappalyzer = require('../../wappalyzer')
const { extractPatterns } = require('./pattern-triage')
const { VERDICTS, hostName, summarize } = require('./stacklookup')
const { cell, evidence } = require('./stacklookup-replay')

const START = '<!-- decision:start -->'
const END = '<!-- decision:end -->'
const PLACEHOLDER = [
    START,
    '## Decision',
    '',
    '**Decision:** To be written (change / keep / remove / needs evidence).',
    '',
    '### Cause',
    '',
    '### Proof',
    '',
    '### Alternatives considered',
    '',
    '### Risk',
    '',
    '### Tests to add',
    END,
].join('\n')

const slug = (name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const sameKey = (a, b) => (a ?? null) === null
    ? (b ?? null) === null
    : (b ?? null) !== null && String(a).toLowerCase() === String(b).toLowerCase()

// Selector-only DOM rules become an empty regex in the engine, keyed by the selector.
const regexOf = ({ channel, key, value }) => (channel === 'dom' && key === null
    ? '(?:)' : Wappalyzer.parsePattern(value).regex.source)

const sameRule = (review, unit) => review.channel === unit.channel &&
    sameKey(review.key, unit.key) && review.pattern === unit.value

function matchesRule(rule, found) {
    if (found.channel !== rule.channel || found.regex !== rule.regex) {
        return false
    }
    if (rule.channel === 'dom' && rule.key === null) {
        return found.key === rule.pattern
    }
    // Extended driver output can omit the key; the regex then decides.
    return (found.key ?? null) === null || sameKey(rule.key, found.key)
}

/** Replace or drop one pattern in a channel value (a string or a list). */
function edit(value, from, to) {
    const list = (Array.isArray(value) ? value : [value]).flatMap((item) =>
        item === from ? (to === null ? [] : [to]) : [item])
    return !list.length ? undefined : Array.isArray(value) ? list : list[0]
}

/**
 * The definition with Codex's confirmed second-pass actions applied: remove
 * drops the rule; narrow and lower-confidence replace it with the fix. DOM
 * rules with attributes are left alone (their regexes sit inside objects).
 */
function proposeFromSecondPass(definition, reviews, answers) {
    const byId = new Map(answers.map((answer) => [answer.id, answer]))
    const next = JSON.parse(JSON.stringify(definition))
    for (const review of reviews) {
        const answer = byId.get(review.id)
        if (!answer || answer.verdict !== 'confirm' || !['remove', 'narrow', 'lower-confidence'].includes(answer.action)) {
            continue
        }
        const to = answer.action === 'remove' ? null : answer.fix || null
        if (to === null && answer.action !== 'remove') {
            continue
        }
        const { channel, key, pattern } = review
        if (key === null || key === undefined) {
            if (next[channel] === undefined) {
                continue
            }
            const value = edit(next[channel], pattern, to)
            value === undefined ? delete next[channel] : next[channel] = value
        } else if (channel !== 'dom' && next[channel] && typeof next[channel] === 'object') {
            const name = Object.keys(next[channel]).find((item) => sameKey(item, key))
            if (name === undefined) {
                continue
            }
            const value = edit(next[channel][name], pattern, to)
            value === undefined ? delete next[channel][name] : next[channel][name] = value
            if (!Object.keys(next[channel]).length) {
                delete next[channel]
            }
        }
    }
    return next
}

const unitId = ({ channel, key, value }) => JSON.stringify([channel, key === null ? null : String(key).toLowerCase(), value])

function ruleChanges(technology, before, after) {
    const old = extractPatterns(technology, before || {})
    const now = extractPatterns(technology, after || {})
    const ids = (units) => new Set(units.map(unitId))
    const [oldIds, nowIds] = [ids(old), ids(now)]
    const shape = ({ channel, key, value }) => ({ channel, key, pattern: value })
    return {
        removed: old.filter((unit) => !nowIds.has(unitId(unit))).map(shape),
        added: now.filter((unit) => !oldIds.has(unitId(unit))).map(shape),
    }
}

const VERDICT_ORDER = ['confirmed', 'suspect-pattern', 'unreviewed', 'implied-only']

/** Examples with distinct matched text first, confirmed claims ahead of suspect ones. */
function pickExamples(found, limit) {
    const sorted = [...found].sort((a, b) =>
        VERDICT_ORDER.indexOf(a.verdict) - VERDICT_ORDER.indexOf(b.verdict) || a.host.localeCompare(b.host))
    const seen = new Set()
    const distinct = sorted.filter(({ matchedText }) => !seen.has(matchedText) && seen.add(matchedText))
    return [...distinct, ...sorted.filter((item) => !distinct.includes(item))].slice(0, limit)
}

function buildRecord({ technology, definition, proposed, source, rows, reviews, answers, replay, examples = 5 }) {
    const own = reviews.filter((review) => review.technology.toLowerCase() === technology.toLowerCase())
    const byId = new Map(answers.map((answer) => [answer.id, answer]))
    const liveCompanies = own.find(({ liveCompanies: live }) => live != null)?.liveCompanies ?? null
    const [summary] = summarize(rows, new Map(liveCompanies === null ? [] : [[technology.toLowerCase(), liveCompanies]]))
    const rules = extractPatterns(technology, definition || {}).map((unit) => {
        const review = own.find((item) => sameRule(item, unit)) || null
        return {
            channel: unit.channel, key: unit.key, pattern: unit.value, regex: regexOf(unit),
            triage: review ? { verdict: review.verdict, reasons: review.reasons || [] } : null,
            review: review && review.review ? review.review : null,
            secondPass: review ? byId.get(review.id) || null : null,
            hosts: {}, found: [],
        }
    })
    const unmatched = []
    for (const row of rows) {
        for (const found of row.evidence || []) {
            const item = { host: hostName(row.domain), verdict: row.verdict, ...found }
            const rule = rules.find((candidate) => matchesRule(candidate, found))
            if (!rule) {
                unmatched.push(item)
                continue
            }
            // A host counts once per rule, however often the rule matched there.
            if (!rule.found.some(({ host }) => host === item.host)) {
                rule.hosts[row.verdict] = (rule.hosts[row.verdict] || 0) + 1
            }
            rule.found.push(item)
        }
    }
    const reasons = new Map()
    for (const row of rows.filter(({ verdict }) => verdict === 'unverifiable')) {
        // "Navigation timeout (https://a.com/)" and the like group without the host.
        const reason = String(row.reason || 'unknown').replace(/\s*\([^)]*\)$/, '')
        reasons.set(reason, (reasons.get(reason) || 0) + 1)
    }
    return {
        technology,
        source,
        claims: summary ? summary.claims : 0,
        counts: summary ? summary.counts : Object.fromEntries(VERDICTS.map((name) => [name, 0])),
        suspectRate: summary ? summary.suspectRate : null,
        liveCompanies,
        definition,
        rules: rules.map(({ found, ...rule }) => ({ ...rule, examples: pickExamples(found, examples) })),
        unmatched: pickExamples(unmatched, examples),
        missed: rows.filter(({ verdict }) => verdict === 'not-detected')
            .map((row) => ({ host: hostName(row.domain), sourceMatches: row.sourceMatches || [] })),
        unverifiable: [...reasons].map(([reason, hosts]) => ({ reason, hosts })).sort((a, b) => b.hosts - a.hosts),
        changes: ruleChanges(technology, definition, proposed),
        proposed,
        replay,
    }
}

const MAX_TEXT = 200
function text(value) {
    const flat = String(value ?? '').replace(/\s+/g, ' ').trim()
    return flat.length > MAX_TEXT ? `${flat.slice(0, MAX_TEXT)}…` : flat
}

/** Inline code that survives backticks inside the value. */
function code(value) {
    const body = text(value)
    if (!body) {
        return '(empty)'
    }
    const longest = Math.max(0, ...(body.match(/`+/g) || []).map((run) => run.length))
    const fence = '`'.repeat(longest + 1)
    return `${fence}${/^`|`$/.test(body) ? ` ${body} ` : body}${fence}`
}

const ruleName = ({ channel, key }) => `${channel}${key === null || key === undefined ? '' : ` ${key}`}`
const percent = (rate) => (rate === null ? 'n/a' : `${(rate * 100).toFixed(1)} %`)

function keptArgument(markdown) {
    const start = String(markdown || '').indexOf(START)
    const end = String(markdown || '').indexOf(END, start)
    return start === -1 || end === -1 ? null : markdown.slice(start, end + END.length)
}

function renderRecord(record, argument = null) {
    const lines = [`# Decision record: ${record.technology}`, '']
    const counts = VERDICTS.filter((name) => record.counts[name]).map((name) => `${name} ${record.counts[name]}`)
    lines.push(
        `- StackLookup claims in the audit: ${record.claims} (${counts.join(', ') || 'none'})`,
        `- Suspect rate: ${percent(record.suspectRate)} of verifiable claims`,
        `- Live companies (StackLookup): ${record.liveCompanies === null ? 'unknown' : record.liveCompanies.toLocaleString('en-US')}`,
        `- Proposed change from: ${record.source}`,
        '', 'Generated by `npm run decision:stacklookup`; the evidence below is rewritten on each run,',
        'the Decision section is not.', '', argument || PLACEHOLDER, '')

    lines.push('## Current definition', '', '```json', JSON.stringify(record.definition, null, 2), '```', '')

    lines.push('## Rules and their evidence', '')
    record.rules.forEach((rule, index) => {
        lines.push(`### ${index + 1}. ${ruleName(rule)}: ${code(rule.pattern)}`, '')
        if (rule.triage) {
            lines.push(`- Triage: ${rule.triage.verdict}${rule.triage.reasons.length ? ` (${rule.triage.reasons.map(cell).join('; ')})` : ''}`)
        }
        lines.push(rule.review
            ? `- Codex review: **${rule.review.verdict}**. ${text(rule.review.why)}${rule.review.fix ? ` Fix: ${code(rule.review.fix)}` : ''}`
            : '- Codex review: none')
        if (rule.secondPass) {
            const pass = rule.secondPass
            lines.push(`- Second pass: **${pass.verdict}**, action ${pass.action || 'none'}. ${text(pass.why)}`)
            if (pass.fix) {
                lines.push(`  - fix: ${code(pass.fix)}`)
            }
            if (pass.shouldMatch) {
                lines.push(`  - shouldMatch: ${code(pass.shouldMatch)}`)
            }
            if (pass.shouldNotMatch) {
                lines.push(`  - shouldNotMatch: ${code(pass.shouldNotMatch)}`)
            }
        }
        const hosts = Object.entries(rule.hosts).map(([verdict, count]) => `${verdict} ${count}`)
        lines.push(`- Matched on audited hosts: ${hosts.join(', ') || 'none'}`, '')
        if (rule.examples.length) {
            lines.push('| Host | Claim | Matched text | Context |', '|---|---|---|---|')
            rule.examples.forEach((example) => lines.push(
                `| ${cell(example.host)} | ${example.verdict} | ${code(example.matchedText).replace(/\|/g, '\\|')} | ${cell(example.context)} |`))
            lines.push('')
        }
    })
    if (record.unmatched.length) {
        lines.push('### Matches from rules no longer in the definition', '',
            '| Host | Claim | Rule | Matched text |', '|---|---|---|---|')
        record.unmatched.forEach((item) => lines.push(
            `| ${cell(item.host)} | ${item.verdict} | ${cell(ruleName(item))} ${code(item.regex).replace(/\|/g, '\\|')} | ${code(item.matchedText).replace(/\|/g, '\\|')} |`))
        lines.push('')
    }
    const example = record.rules.flatMap((rule) => rule.examples)[0]
    lines.push('### Check a match yourself', '',
        'Prints what the current rules match on one cached page, with context:', '',
        '```bash',
        `npm run -s decision:stacklookup -- "${record.technology}" --show ${example ? example.host : '<host>'}`,
        '```', '')

    lines.push('## Claims we did not detect', '')
    if (record.missed.length) {
        lines.push('| Host | Rule matches in the cached sources |', '|---|---|')
        record.missed.forEach((item) => lines.push(`| ${cell(item.host)} | ${item.sourceMatches.length
            ? item.sourceMatches.map((match) => `${cell(ruleName(match))}: ${code(match.matchedText).replace(/\|/g, '\\|')}`).join('; ')
            : 'none'} |`))
    } else {
        lines.push('None.')
    }
    lines.push('')
    if (record.unverifiable.length) {
        lines.push('Unverifiable claims, by reason:', '')
        record.unverifiable.slice(0, 10).forEach(({ reason, hosts }) => lines.push(`- ${cell(reason)}: ${hosts}`))
        if (record.unverifiable.length > 10) {
            lines.push(`- … ${record.unverifiable.length - 10} more reasons`)
        }
        lines.push('')
    }

    lines.push('## Proposed change and its replay', '', `Source: ${record.source}.`, '')
    const { removed, added } = record.changes
    if (!removed.length && !added.length) {
        lines.push('No rule changes.', '')
    } else {
        removed.forEach((rule) => lines.push(`- Remove ${ruleName(rule)}: ${code(rule.pattern)}`))
        added.forEach((rule) => lines.push(`- Add ${ruleName(rule)}: ${code(rule.pattern)}`))
        lines.push('')
    }
    const replay = record.replay
    if (replay) {
        lines.push(`Detected on ${replay.hostsBefore} hosts before, ${replay.hostsAfter} after: ` +
            `${replay.lost.length} lost, ${replay.added.length} added, ${replay.kept.length} kept.`)
        if (replay.lostConfirmed) {
            lines.push('', `**${replay.lostConfirmed} confirmed claim${replay.lostConfirmed > 1 ? 's' : ''} lost.**`)
        }
        if (replay.rescan.length) {
            lines.push('', `Rescan needed for new matches in: ${replay.rescan.join(', ')}.`)
        }
        const byClaim = (entries) => {
            const counts = new Map()
            entries.forEach(({ claim }) => counts.set(claim || 'not claimed', (counts.get(claim || 'not claimed') || 0) + 1))
            return [...counts].map(([claim, count]) => `${claim} ${count}`).join(', ')
        }
        for (const [title, entries, side] of [['Lost', replay.lost, 'before'], ['Added', replay.added, 'after'], ['Kept', replay.kept, 'after']]) {
            if (!entries.length) {
                continue
            }
            lines.push('', `### ${title} (${byClaim(entries)})`, '', '| Host | StackLookup claim | Evidence |', '|---|---|---|')
            entries.slice(0, 15).forEach((entry) =>
                lines.push(`| ${cell(entry.host)} | ${entry.claim || 'not claimed'} | ${evidence(entry[side])} |`))
            if (entries.length > 15) {
                lines.push(`| … ${entries.length - 15} more | | |`)
            }
        }
        lines.push('')
    }
    return lines.join('\n')
}

module.exports = { slug, proposeFromSecondPass, buildRecord, renderRecord, keptArgument }
