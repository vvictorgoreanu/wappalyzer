'use strict'

/** Pure parsing and evidence classification. No file access or network here. */
const Wappalyzer = require('../../wappalyzer')
const { extractPatterns } = require('./pattern-triage')

const VERDICTS = [
    'confirmed', 'suspect-pattern', 'unreviewed', 'implied-only', 'not-detected',
    'not-in-catalog', 'unverifiable',
]

/** RFC-style quoted CSV, including embedded newlines and escaped quotes.
 * Only a structurally incomplete final record may be dropped. A cut in the
 * middle of an unquoted final cell is indistinguishable from a complete cell.
 */
function parseCsv(text) {
    const input = String(text).replace(/^\uFEFF/, '')
    const records = []
    const errors = []
    let cells = []
    let cell = ''
    let quoted = false
    let closed = false
    let line = 1
    let startLine = 1
    const finish = () => {
        cells.push(cell)
        if (cells.length > 1 || cells[0] !== '') {
            records.push({ cells, line: startLine })
        }
        cells = []
        cell = ''
        closed = false
    }

    for (let index = 0; index < input.length; index++) {
        const char = input[index]

        if (quoted) {
            if (char === '"') {
                if (input[index + 1] === '"') {
                    cell += '"'
                    index++
                } else {
                    quoted = false
                    closed = true
                }
            } else {
                cell += char
                if (char === '\n') {
                    line++
                }
            }
        } else if (char === ',') {
            cells.push(cell)
            cell = ''
            closed = false
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && input[index + 1] === '\n') {
                index++
            }
            finish()
            line++
            startLine = line
        } else if (char === '"' && !cell && !closed) {
            quoted = true
        } else {
            if (closed || char === '"') {
                throw new Error(`CSV line ${line}: invalid quote`)
            }
            cell += char
        }
    }

    if (quoted) {
        errors.push(`CSV line ${startLine}: truncated last row (unclosed quote), dropped`)
    } else if (cell || cells.length || closed) {
        finish()
    }

    const header = records.shift()
    if (!header) {
        throw new Error('CSV has no header')
    }
    const columns = header.cells.map((value) => value.trim())
    if (new Set(columns).size !== columns.length) {
        throw new Error('CSV has duplicate columns')
    }
    const rows = []

    for (const [index, record] of records.entries()) {
        if (record.cells.length !== columns.length) {
            if (index === records.length - 1 && !errors.length && record.cells.length < columns.length) {
                errors.push(`CSV line ${record.line}: truncated last row (wrong column count), dropped`)
                continue
            }
            throw new Error(`CSV line ${record.line}: expected ${columns.length} columns, got ${record.cells.length}`)
        }
        rows.push(Object.fromEntries(columns.map((column, at) => [column, record.cells[at]])))
    }

    return { columns, rows, errors }
}

/** Restrict both URL targets and cache filenames to plain DNS hostnames. */
function hostName(value) {
    const host = String(value).trim().toLowerCase()
    if (host.length > 253 || !host || !host.split('.').every((label) =>
        label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
    )) {
        throw new Error(`Invalid hostname: ${JSON.stringify(value)}`)
    }
    return host
}

const names = (values) => [...new Set(values.map((name) => String(name).trim().toLowerCase()))]

function parseSamples(text) {
    const parsed = parseCsv(text)
    for (const required of ['root_domain', 'domain', 'time', 'crawls', 'technologies']) {
        if (!parsed.columns.includes(required)) {
            throw new Error(`CSV missing required column ${required}`)
        }
    }
    return {
        ...parsed,
        rows: parsed.rows.map((row) => ({
            ...row,
            root_domain: hostName(row.root_domain),
            domain: hostName(row.domain),
            technologies: names(row.technologies.split('|')),
        })),
    }
}

function dedupeSamples(rows) {
    const byPair = new Map()
    const timestamp = (row) => {
        const value = /^\d{13}$/.test(row.time) ? Number(row.time) : Date.parse(row.time)
        if (!Number.isFinite(value)) {
            throw new Error(`Invalid sample time for ${row.domain}: ${row.time}`)
        }
        return value
    }
    for (const row of rows) {
        const time = timestamp(row)
        const key = JSON.stringify([row.root_domain, row.domain])
        const previous = byPair.get(key)
        if (!previous || time >= previous.time) {
            byPair.set(key, { row, time })
        }
    }
    return [...byPair.values()].map(({ row }) => row)
}

function mapNames(values, catalog) {
    const lookup = new Map(Object.keys(catalog).map((name) => [name.toLowerCase(), name]))
    return names(values).map((claimed) => ({ claimed, technology: lookup.get(claimed) || null }))
}

const reviewKey = (technology, channel, regex) => JSON.stringify([technology.toLowerCase(), channel, regex])

/** Keyed rules with the same regex remain separate. Driver extended output
 * omits the key, so all candidates must be credible before confirming it.
 */
function buildReviews(patterns, secondPass = []) {
    const answers = new Map()
    for (const answer of secondPass) {
        if (!Number.isInteger(answer.id) || !['confirm', 'overturn', 'needs-evidence'].includes(answer.verdict)) {
            throw new Error('Invalid second-pass answer')
        }
        answers.set(answer.id, answer.verdict)
    }
    const reviews = new Map()
    for (const item of patterns) {
        let verdict = item.review ? item.review.verdict : item.verdict
        const answer = answers.get(item.id)
        if (answer === 'overturn') {
            verdict = 'credible'
        } else if (answer === 'needs-evidence') {
            verdict = 'needs-evidence'
        }
        // Selector-only DOM rules become an empty regex in the engine.
        const regex = item.channel === 'dom' && !item.key
            ? '(?:)' : Wappalyzer.parsePattern(item.pattern).regex.source
        const key = reviewKey(item.technology, item.channel, regex)
        const bucket = reviews.get(key) || []
        bucket.push({ ...item, verdict })
        reviews.set(key, bucket)
    }
    return reviews
}

function contextFor(pattern, record) {
    const match = String(pattern.match ?? '')
    const value = String(pattern.value ?? '')
    if (['headers', 'cookies', 'scriptSrc', 'url', 'xhr', 'xhrUrl', 'dns'].includes(pattern.type)) {
        return value || match
    }
    const html = String(record.html || '')
    const source = pattern.type === 'html' && html.includes(match || value) ? html : value || match
    const at = source.indexOf(match || value)
    const start = Math.max(0, at - 100)
    return source.slice(start, start + Math.max(200, match.length + 100)) || value || match
}

function evidenceFor(technology, pattern, record, reviews) {
    let candidates = reviews.get(reviewKey(technology, pattern.type, pattern.regex)) || []
    if (pattern.key !== undefined && pattern.key !== null) {
        // The engine lowercases header, cookie, meta and DNS keys; reviews keep
        // the catalog's case. DOM reviews hold the selector, the engine's key.
        const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()
        candidates = candidates.filter((candidate) => candidate.key != null
            ? same(candidate.key, pattern.key)
            : pattern.type !== 'dom' || candidate.pattern === pattern.key)
    }
    const credible = candidates.length > 0 && candidates.every(({ verdict }) => verdict === 'credible')
    const vendorMatch = pattern.vendorMatch !== false
    return {
        channel: pattern.type,
        key: pattern.key ?? null,
        regex: pattern.regex,
        matchedText: pattern.match ?? pattern.value ?? '',
        context: contextFor(pattern, record),
        credible: credible && vendorMatch,
        // Neither confirmed nor suspect: nothing yet says whether it is sound.
        unreviewed: !candidates.length && vendorMatch,
        reason: !vendorMatch ? 'Matched text is not the vendor' :
            candidates.length ? candidates.map(({ verdict }) => verdict).join(', ') : 'No pattern review; needs evidence',
    }
}

/** Find transitive implications, bounded by a visited set (catalogs can cycle). */
function implicationChain(target, record, catalog) {
    const pending = Object.entries(record.patterns || {})
        .filter(([, patterns]) => patterns.length)
        .map(([name]) => [name])
    const seen = new Set()
    while (pending.length) {
        const chain = pending.shift()
        const name = chain[chain.length - 1]
        if (name === target && chain.length > 1) {
            return chain
        }
        if (seen.has(name)) {
            continue
        }
        seen.add(name)
        const raw = (catalog[name] || {}).implies || []
        const implied = (Array.isArray(raw) ? raw : [raw]).map((item) => String(item).split('\\;')[0])
        const edges = [...new Set([
            ...implied,
            ...(record.patterns[name] || []).flatMap((pattern) => pattern.implies || []),
        ])]
        edges.forEach((edge) => pending.push([...chain, edge]))
    }
    return null
}

/** Offline source search explains missed detections; a source hit alone never
 * promotes a claim to confirmed. Only channels actually cached are searched.
 */
function searchSources(technology, record, catalog) {
    const matches = []
    for (const unit of extractPatterns(technology, catalog[technology])) {
        const { channel, key, value } = unit
        let sources = []
        if (['html', 'text', 'url'].includes(channel)) {
            sources = [channel === 'url' ? record.finalUrl : record[channel]]
        } else if (['scriptSrc', 'scripts'].includes(channel)) {
            sources = record[channel] || []
        } else if (['headers', 'cookies', 'meta'].includes(channel)) {
            const source = record[channel] || {}
            const found = Object.keys(source).find((name) => name.toLowerCase() === String(key).toLowerCase())
            sources = found === undefined ? [] : [source[found]].flat()
        }
        if (!sources.length) {
            continue
        }
        const regex = Wappalyzer.parsePattern(value).regex
        for (const source of sources.filter((item) => item !== undefined && item !== null)) {
            const match = regex.exec(String(source))
            if (match) {
                const pattern = { type: channel, regex: regex.source, match: match[0], value: String(source) }
                matches.push({ channel, key, regex: regex.source, matchedText: match[0], context: contextFor(pattern, record) })
            }
        }
    }
    return matches
}

/** Splits driver errors into secondary probe failures and the analysis
 * channels that timed out (`Timeout (js)` and the like). Neither means the
 * page itself failed; fatal errors are recorded separately as `error`.
 */
function scanHealth(errors = []) {
    const probeErrors = []
    const partial = []
    for (const message of errors.map(String)) {
        const timeout = /^(?:Error: )?Timeout \(([a-z]+)\)$/.exec(message)
        if (/^Probe failed \(/.test(message)) {
            probeErrors.push(message)
        } else if (timeout && !partial.includes(timeout[1])) {
            partial.push(timeout[1])
        }
    }
    return { probeErrors, partial }
}

function verdictForClaim(claimed, record, catalog, reviews = new Map()) {
    const { technology } = mapNames([claimed], catalog)[0]
    if (!technology) {
        return { verdict: 'not-in-catalog' }
    }
    // Deliberately narrow parking heuristic; arbitrary page copy is not proof
    // of parking. A manually annotated cached `parked` flag is also supported.
    const parked = record && (record.parked || /<title[^>]*>\s*(?:this domain is for sale|domain (?:is )?for sale|buy this domain)[^<]*<\/title>/i.test(record.html || ''))
    if (!record || record.error || parked || !(record.status >= 200 && record.status < 300)) {
        return { verdict: 'unverifiable', reason: !record ? 'No cached scan' : record.error || (parked ? 'Parked page' : `HTTP ${record.status}`) }
    }
    const detected = (record.technologies || []).some((item) => (typeof item === 'string' ? item : item.name) === technology)
    const patterns = (record.patterns || {})[technology] || []
    if (detected && patterns.length) {
        const evidence = patterns.map((pattern) => evidenceFor(technology, pattern, record, reviews))
        const verdict = evidence.some(({ credible }) => credible) ? 'confirmed'
            : evidence.every(({ unreviewed }) => unreviewed) ? 'unreviewed' : 'suspect-pattern'
        return { verdict, evidence }
    }
    if (detected) {
        const chain = implicationChain(technology, record, catalog)
        return chain ? { verdict: 'implied-only', impliesChain: chain } :
            { verdict: 'unverifiable', reason: 'Detection has no direct evidence or implication chain' }
    }
    // A channel that timed out could have held the only evidence.
    const missed = (record.partial || []).filter((channel) =>
        extractPatterns(technology, catalog[technology]).some((unit) => unit.channel === channel))
    if (missed.length) {
        return { verdict: 'unverifiable', reason: `Partial scan: ${missed.join(', ')} timed out` }
    }
    return { verdict: 'not-detected', sourceMatches: searchSources(technology, record, catalog) }
}

function summarize(rows, weights = new Map()) {
    const summary = new Map()
    for (const row of rows) {
        const technology = row.technology || row.claimed
        if (!summary.has(technology)) {
            summary.set(technology, { technology, claims: 0, counts: Object.fromEntries(VERDICTS.map((name) => [name, 0])) })
        }
        const item = summary.get(technology)
        item.claims++
        item.counts[row.verdict]++
    }
    return [...summary.values()].map((item) => {
        const suspects = item.counts['suspect-pattern'] + item.counts['not-detected']
        const verifiable = item.claims - item.counts.unverifiable - item.counts.unreviewed - item.counts['not-in-catalog']
        const liveCompanies = weights.get(String(item.technology).toLowerCase()) ?? null
        return {
            ...item, suspects, verifiable, liveCompanies,
            suspectRate: verifiable ? suspects / verifiable : null,
            weightedSuspects: suspects * (liveCompanies ?? 1),
        }
    }).sort((a, b) => b.weightedSuspects - a.weightedSuspects || a.technology.localeCompare(b.technology))
}

module.exports = { VERDICTS, parseCsv, parseSamples, dedupeSamples, mapNames, hostName, buildReviews, scanHealth, verdictForClaim, summarize }
