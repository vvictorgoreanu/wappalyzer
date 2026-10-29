'use strict'

/**
 * Replays a technology's old and new patterns over cached audit scans, so a
 * regex fix shows which hosts it drops or gains before anything is rescanned.
 *
 * Two sources of evidence, used the same way for both definitions:
 *   - the page channels a cache holds in full (url, html, text, script URLs,
 *     inline scripts, headers, cookies, meta) are analyzed again;
 *   - values the scan kept only inside its detections (external script bodies,
 *     JavaScript globals) are matched again.
 * New matches in values the scan never kept cannot be found; rescanChannels()
 * names the channels where that applies.
 */

const Wappalyzer = require('../../wappalyzer')

const FULL = ['url', 'html', 'text', 'scriptSrc', 'scripts', 'headers', 'cookies', 'meta']
const CASE_SENSITIVE_KEYS = new Set(['js'])
const CLAIM_ORDER = ['confirmed', 'unreviewed', 'implied-only', 'suspect-pattern', 'not-detected', 'unverifiable', 'not-in-catalog', null]

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function changedTechnologies(before, after) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])]
        .filter((name) => !same(before[name], after[name]))
        .sort()
}

/** Detection rules only; requires and excludes would need the rest of the catalog. */
function compile(name, definition) {
    if (!definition) {
        return null
    }
    const { requires, requiresCategory, excludes, implies, ...rules } = definition
    Wappalyzer.setTechnologies({ [name]: rules })
    return Wappalyzer.technologies[0]
}

const asList = (value) => (Array.isArray(value) ? value : [value])

function pageItems(record) {
    const keyed = (source = {}) => Object.fromEntries(Object.entries(source)
        .map(([name, value]) => [name.toLowerCase(), asList(value).map(String)]))
    return {
        url: record.finalUrl, html: record.html, text: record.text,
        scriptSrc: record.scriptSrc, scripts: record.scripts,
        headers: keyed(record.headers), cookies: keyed(record.cookies), meta: keyed(record.meta),
    }
}

function rulesFor(technology, type, key) {
    const rules = technology[type]
    if (Array.isArray(rules)) {
        return rules
    }
    if (!rules || typeof rules !== 'object') {
        return []
    }
    const match = CASE_SENSITIVE_KEYS.has(type)
        ? (name) => name === key
        : (name) => name.toLowerCase() === String(key).toLowerCase()
    return Object.entries(rules).filter(([name]) => match(name)).flatMap(([, list]) => list)
}

const toDetection = (type, key, regex, value, match) => ({ type, key: key ?? null, regex: regex.source, value, match })

function detect(record, name, definition, keepDom) {
    const technology = compile(name, definition)
    if (!technology) {
        return []
    }
    const found = new Map()
    const add = (detection) => {
        const id = JSON.stringify([detection.type, detection.key, detection.regex, detection.match])
        if (!found.has(id)) {
            found.set(id, detection)
        }
    }
    for (const stored of (record.patterns || {})[name] || []) {
        if (stored.type === 'dom') {
            if (keepDom) {
                add({ ...stored, key: stored.key ?? null })
            }
            continue
        }
        for (const rule of rulesFor(technology, stored.type, stored.key)) {
            const match = rule.regex.exec(String(stored.value ?? ''))
            if (match) {
                add(toDetection(stored.type, stored.key, rule.regex, stored.value, match[0]))
            }
        }
    }
    const items = pageItems(record)
    for (const type of FULL) {
        if (items[type] !== undefined && items[type] !== null) {
            for (const { pattern } of Wappalyzer.analyze({ [type]: items[type] }, [technology])) {
                add(toDetection(pattern.type, pattern.key, pattern.regex, pattern.value, pattern.match))
            }
        }
    }
    return [...found.values()]
}

function replayHost(record, name, before, after) {
    const keepDom = same((before || {}).dom, (after || {}).dom)
    return {
        before: detect(record, name, before, true),
        after: detect(record, name, after, keepDom),
    }
}

/** Channels where the new definition could match values no cache kept. */
function rescanChannels(before = {}, after = {}) {
    const channels = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
    return [...channels].filter((channel) => {
        const [old, now] = [(before || {})[channel], (after || {})[channel]]
        if (same(old, now) || ['cats', 'description', 'icon', 'website', 'implies', 'excludes', 'requires', 'requiresCategory', 'cpe', 'oss', 'saas', 'pricing'].includes(channel)) {
            return false
        }
        if (FULL.includes(channel) && channel !== 'scripts') {
            return false
        }
        if (channel === 'js') {
            // Stored values cover the old keys; only a new key goes unseen.
            return Object.keys(now || {}).some((key) => !Object.prototype.hasOwnProperty.call(old || {}, key))
        }
        return true
    }).sort()
}

const byClaim = (a, b) => CLAIM_ORDER.indexOf(a.claim) - CLAIM_ORDER.indexOf(b.claim) || a.host.localeCompare(b.host)

function summarizeReplay(technology, entries, rescan = []) {
    const lost = []
    const kept = []
    const added = []
    for (const entry of entries) {
        if (entry.before.length && !entry.after.length) {
            lost.push(entry)
        } else if (entry.before.length) {
            kept.push(entry)
        } else if (entry.after.length) {
            added.push(entry)
        }
    }
    return {
        technology,
        hostsBefore: lost.length + kept.length,
        hostsAfter: kept.length + added.length,
        lost: lost.sort(byClaim), kept: kept.sort(byClaim), added: added.sort(byClaim),
        lostConfirmed: lost.filter(({ claim }) => claim === 'confirmed').length,
        rescan,
    }
}

const MAX_TEXT = 120
function cell(value) {
    let text = String(value ?? '').replace(/\s+/g, ' ').trim()
    if (text.length > MAX_TEXT) {
        text = `${text.slice(0, MAX_TEXT)}…`
    }
    return text.replace(/\|/g, '\\|').replace(/`/g, 'ˋ')
}

function evidence(detections) {
    return detections.map(({ type, key, match }) =>
        `${type}${key ? ` ${cell(key)}` : ''}: \`${cell(match) || '(empty)'}\``).join('; ')
}

function renderReplay(summaries, { limit = 25 } = {}) {
    const lines = ['# Pattern replay over cached StackLookup scans', '',
        'Lost on a confirmed claim: check it, the fix may drop a real detection.',
        'Lost on a suspect claim: usually the false positive the fix is for.', '']
    for (const summary of summaries) {
        lines.push(`## ${summary.technology}`, '',
            `Detected on ${summary.hostsBefore} hosts before, ${summary.hostsAfter} after: ` +
            `${summary.lost.length} lost, ${summary.added.length} added, ${summary.kept.length} kept.`)
        if (summary.lostConfirmed) {
            lines.push('', `**${summary.lostConfirmed} confirmed claim${summary.lostConfirmed > 1 ? 's' : ''} lost.**`)
        }
        if (summary.rescan.length) {
            lines.push('', `Rescan needed for new matches in: ${summary.rescan.join(', ')}.`)
        }
        for (const [title, entries, side] of [['Lost', summary.lost, 'before'], ['Added', summary.added, 'after'], ['Kept', summary.kept, 'after']]) {
            if (!entries.length) {
                continue
            }
            lines.push('', `### ${title}`, '', '| Host | StackLookup claim | Evidence |', '|---|---|---|')
            entries.slice(0, limit).forEach((entry) =>
                lines.push(`| ${cell(entry.host)} | ${entry.claim || 'not claimed'} | ${evidence(entry[side])} |`))
            if (entries.length > limit) {
                lines.push(`| … ${entries.length - limit} more | | |`)
            }
        }
        lines.push('')
    }
    return lines.join('\n')
}

module.exports = { changedTechnologies, replayHost, rescanChannels, summarizeReplay, renderReplay, cell, evidence }
