'use strict'

/** Turns audit verdicts into a readable report. Pure; the CLI does file access. */

const norm = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, '')

/** StackLookup marks web basics (HTML, CSS, HSTS, …) as not countable. */
function basicsFrom(catalogRows) {
    const keys = new Set()
    for (const row of catalogRows.filter(({ is_countable: countable }) => countable === 'False')) {
        [row.name, row.key_norm].map(norm).filter(Boolean).forEach((key) => keys.add(key))
    }
    return { size: keys.size, has: (name) => keys.has(norm(name)) }
}

const byCount = (a, b) => b.claims - a.claims || a.technology.localeCompare(b.technology)

function tally(rows) {
    const counts = new Map()
    rows.forEach(({ technology }) => counts.set(technology, (counts.get(technology) || 0) + 1))
    return {
        claims: rows.length,
        technologies: [...counts].map(([technology, claims]) => ({ technology, claims })).sort(byCount),
    }
}

function buildReport(audit, { basics = null, examples = 3 } = {}) {
    const rowsOf = new Map()
    for (const row of audit.rows) {
        if (!rowsOf.has(row.technology)) {
            rowsOf.set(row.technology, [])
        }
        rowsOf.get(row.technology).push(row)
    }
    const technologies = audit.summary.filter(({ suspects }) => suspects > 0).map((item) => {
        const rows = rowsOf.get(item.technology) || []
        // One entry per regex: the fix is made to a pattern, not to a host.
        const patterns = new Map()
        for (const row of rows.filter(({ verdict }) => verdict === 'suspect-pattern')) {
            for (const found of (row.evidence || []).filter(({ credible }) => !credible)) {
                const id = JSON.stringify([found.channel, found.key, found.regex])
                if (!patterns.has(id)) {
                    patterns.set(id, { channel: found.channel, key: found.key, regex: found.regex, reason: found.reason, hosts: 0, examples: [] })
                }
                const pattern = patterns.get(id)
                pattern.hosts++
                if (pattern.examples.length < examples) {
                    pattern.examples.push({ domain: row.domain, matchedText: found.matchedText, context: found.context })
                }
            }
        }
        const missed = rows.filter(({ verdict }) => verdict === 'not-detected')
            .slice(0, examples)
            .map(({ domain, sourceMatches = [] }) => ({ domain, sourceMatches }))
        return {
            ...item,
            patterns: [...patterns.values()].sort((a, b) => b.hosts - a.hosts),
            missed,
        }
    }).sort((a, b) => b.weightedSuspects - a.weightedSuspects || a.technology.localeCompare(b.technology))

    const unreviewedRows = audit.rows.filter(({ verdict }) => verdict === 'unreviewed')
    const isBasic = ({ technology }) => Boolean(basics) && basics.has(norm(technology))
    return {
        technologies,
        unreviewed: {
            basicsKnown: Boolean(basics),
            basics: tally(unreviewedRows.filter(isBasic)),
            real: tally(unreviewedRows.filter((row) => !isBasic(row))),
        },
    }
}

const MAX_TEXT = 200

/** Table-safe text: one line, pipes escaped, long page text shortened. */
function cell(value) {
    let text = String(value ?? '').replace(/\s+/g, ' ').trim()
    if (text.length > MAX_TEXT) {
        text = `${text.slice(0, MAX_TEXT)}…`
    }
    return text.replace(/\|/g, '\\|')
}

/** A code span whose fence is longer than any backtick run inside it. */
function code(value) {
    const text = cell(value)
    if (!text) {
        return '(empty)'
    }
    const fence = '`'.repeat(Math.max(0, ...(text.match(/`+/g) || []).map((run) => run.length)) + 1)
    const pad = /^`|`$/.test(text) || fence.length > 1 ? ' ' : ''
    return `${fence}${pad}${text}${pad}${fence}`
}

const percent = (rate) => (rate === null || rate === undefined ? 'n/a' : `${(100 * rate).toFixed(1)}%`)

function renderMarkdown(report) {
    const lines = ['# StackLookup claims that our scans do not support', '']
    lines.push(
        'Ranked by weighted suspects: (suspect-pattern + not-detected) × live companies.',
        'A suspect pattern matched, but only through patterns reviewed as unsound.',
        'Not detected means the page loaded and nothing matched.', '',
        '| # | Technology | Claims | Suspect pattern | Not detected | Confirmed | Suspect rate | Live companies | Weighted |',
        '|---|---|---|---|---|---|---|---|---|',
    )
    report.technologies.forEach((item, index) => {
        lines.push(`| ${index + 1} | ${cell(item.technology)} | ${item.claims} | ${item.counts['suspect-pattern']} | ` +
            `${item.counts['not-detected']} | ${item.counts.confirmed ?? 0} | ${percent(item.suspectRate)} | ` +
            `${item.liveCompanies ?? 'unknown'} | ${item.weightedSuspects} |`)
    })

    lines.push('', '## Patterns behind each suspect', '')
    for (const item of report.technologies) {
        lines.push(`### ${cell(item.technology)}`, '')
        if (item.patterns.length) {
            lines.push('| Channel | Key | Regex | Hosts | Review | Example host | Matched text |', '|---|---|---|---|---|---|---|')
            for (const pattern of item.patterns) {
                pattern.examples.forEach((example, index) => {
                    lines.push(index === 0
                        ? `| ${cell(pattern.channel)} | ${pattern.key === null ? '' : code(pattern.key)} | ${code(pattern.regex)} | ` +
                            `${pattern.hosts} | ${cell(pattern.reason)} | ${cell(example.domain)} | ${code(example.matchedText)} |`
                        : `| | | | | | ${cell(example.domain)} | ${code(example.matchedText)} |`)
                })
            }
            lines.push('')
        }
        if (item.missed.length) {
            lines.push(`Not detected on: ${item.missed.map(({ domain, sourceMatches }) =>
                `${cell(domain)}${sourceMatches.length ? ` (${sourceMatches.length} source match${sourceMatches.length > 1 ? 'es' : ''})` : ''}`).join(', ')}`, '')
        }
    }

    const { unreviewed } = report
    lines.push('## Unreviewed claims', '')
    if (!unreviewed.basicsKnown) {
        lines.push('No StackLookup catalog was given, so web basics are not split out.', '')
    } else {
        lines.push(`Web basics StackLookup does not count (HTML, CSS, HSTS, …): ${unreviewed.basics.claims} claims.`, '')
        unreviewed.basics.technologies.forEach(({ technology, claims }) => lines.push(`- ${cell(technology)}: ${claims}`))
        lines.push('')
    }
    lines.push(`Technologies whose patterns have no review yet: ${unreviewed.real.claims} claims.`, '')
    unreviewed.real.technologies.forEach(({ technology, claims }) => lines.push(`- ${cell(technology)}: ${claims}`))
    lines.push('')
    return lines.join('\n')
}

module.exports = { basicsFrom, buildReport, renderMarkdown }
