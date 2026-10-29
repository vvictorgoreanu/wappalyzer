'use strict'

/**
 * Mechanical triage of catalog patterns: is each one credible evidence of its
 * technology?
 *
 * Only the easy cases are decided here, so a person (or a model) reviews the
 * rest instead of all of them:
 *
 *   credible  the decisive text names the vendor and nothing marks it weak
 *   suspect   it rests on a short or generic literal, or fires on the control
 *             corpus — a false-positive candidate
 *   unclear   everything else, including any pattern below full confidence
 *
 * The rules lean towards `unclear`. Calling a weak pattern credible hides a
 * false positive; calling a good one unclear only costs a review.
 */

const Wappalyzer = require('../../wappalyzer')

const { CHANNELS, isPlainObject, toArray } = require('./channels')
const { matchesControl } = require('./control-corpus')

/** Shorter literals than this match too much ordinary text to vouch for anything. */
const MIN_LITERAL = 4

/**
 * Words that say nothing about a vendor. A pattern whose decisive text is only
 * these can fire on any site; a vendor name made only of these yields no token.
 */
const GENERIC_WORDS = new Set([
    'admin', 'ajax', 'analytics', 'api', 'app', 'apps', 'assets', 'banner',
    'bundle', 'button', 'cart', 'chat', 'checkout', 'class', 'cloud', 'common',
    'config', 'consent', 'content', 'cookie', 'cookies', 'core', 'data',
    'default', 'document', 'element', 'embed', 'footer', 'form', 'forms',
    'framework', 'frontend', 'functionality', 'global', 'header', 'html', 'http',
    'https', 'icon', 'icons', 'image', 'images', 'index', 'init', 'json',
    'layout', 'library', 'link', 'loader', 'login', 'main', 'manager', 'menu',
    'meta', 'modal', 'module', 'name', 'page', 'pixel', 'platform', 'player',
    'plugin', 'plugins', 'popup', 'powered', 'script', 'scripts', 'search',
    'server', 'service', 'session', 'settings', 'shop', 'site', 'slider',
    'static', 'store', 'style', 'styles', 'tag', 'tags', 'theme', 'themes',
    'track', 'tracking', 'type', 'user', 'users', 'util', 'utils', 'value',
    'vendor', 'version', 'video', 'web', 'website', 'widget', 'widgets',
    'window', 'wrapper', 'www',
])

/** Hostname labels that are not part of a vendor's name. */
const HOST_NOISE = new Set(['www', 'com', 'net', 'org', 'io', 'co', 'app', 'dev'])

/** Channels whose patterns are tested against URLs. */
const URL_CHANNELS = ['scriptSrc', 'url', 'xhr', 'xhrUrl']

const compile = (pattern) => Wappalyzer.parsePattern(pattern).regex

/** The regex part of a pattern, without `\;confidence:`/`\;version:` attributes. */
const regexPart = (pattern) => String(pattern).split('\\;')[0]

/** The `\;confidence:N` attribute, or 100. */
const confidenceOf = (pattern) => {
    const match = /\\;confidence:(\d+)/.exec(String(pattern))

    return match ? parseInt(match[1], 10) : 100
}

/** Split on `|` at group depth 0, outside character classes. */
function topLevelBranches(regex) {
    const branches = []
    let depth = 0
    let inClass = false
    let start = 0

    for (let index = 0; index < regex.length; index++) {
        const char = regex[index]

        if (char === '\\') {
            index++
        } else if (inClass) {
            inClass = char !== ']'
        } else if (char === '[') {
            inClass = true
        } else if (char === '(') {
            depth++
        } else if (char === ')') {
            depth--
        } else if (char === '|' && depth === 0) {
            branches.push(regex.slice(start, index))
            start = index + 1
        }
    }

    return [...branches, regex.slice(start)]
}

/**
 * The literal runs a branch must contain, read at group depth 0 only. Text
 * inside groups is skipped because it may be optional or one of several
 * alternatives, so this understates strength rather than overstating it.
 */
function requiredRuns(branch) {
    const runs = []
    let run = ''
    let depth = 0
    let inClass = false

    const flush = () => {
        if (run) {
            runs.push(run)
        }

        run = ''
    }

    for (let index = 0; index < branch.length; index++) {
        const char = branch[index]

        if (inClass) {
            inClass = char !== ']'
        } else if (char === '\\') {
            const next = branch[++index]

            if (depth === 0 && next !== undefined && !/[a-zA-Z0-9]/.test(next)) {
                run += next
            } else {
                flush()
            }
        } else if (char === '[') {
            flush()
            inClass = true
        } else if (char === '(') {
            flush()
            depth++
        } else if (char === ')') {
            depth--
        } else if (depth > 0) {
            continue
        } else if (char === '?' || char === '*' || char === '{') {
            // The previous character is optional or repeated zero times.
            run = run.slice(0, -1)
            flush()

            if (char === '{') {
                index = branch.indexOf('}', index)
            }
        } else if ('.+^$'.includes(char)) {
            flush()
        } else {
            run += char
        }
    }

    flush()

    return runs
}

/**
 * `(a|b)` or `(?:a|b)` spanning the whole pattern matches exactly what `a|b`
 * does, so read it without the group. Anything after the closing parenthesis
 * (a quantifier, more text) leaves the pattern as it is.
 */
function unwrapGroup(regex) {
    const open = /^\((?:\?:)?/.exec(regex)

    if (!open) {
        return regex
    }

    let depth = 0
    let inClass = false

    for (let index = 0; index < regex.length; index++) {
        const char = regex[index]

        if (char === '\\') {
            index++
        } else if (inClass) {
            inClass = char !== ']'
        } else if (char === '[') {
            inClass = true
        } else if (char === '(') {
            depth++
        } else if (char === ')' && --depth === 0) {
            return index === regex.length - 1
                ? unwrapGroup(regex.slice(open[0].length, index))
                : regex
        }
    }

    return regex
}

const longestOf = (runs) =>
    runs.reduce((longest, run) => (run.length > longest.length ? run : longest), '')

/**
 * How much literal text a pattern is guaranteed to need, read from its weakest
 * top-level alternative, since any one alternative is enough to match.
 * `longest` is that alternative's longest required literal, `runs` all of them.
 *
 * @param {string} pattern
 * @returns {{longest: string, runs: string[]}}
 */
function literalStrength(pattern) {
    return topLevelBranches(unwrapGroup(regexPart(pattern)))
        .map((branch) => {
            const runs = requiredRuns(branch)

            return { longest: longestOf(runs), runs }
        })
        .reduce((weakest, branch) =>
            branch.longest.length < weakest.longest.length ? branch : weakest
        )
}

const words = (text) => String(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

/** Lowercase text with separators removed, for matching joined tokens. */
const squash = (text) => String(text).toLowerCase().replace(/[^a-z0-9]/g, '')

const isGeneric = (text) => {
    const parts = words(text)

    return parts.every((part) => part.length < MIN_LITERAL || GENERIC_WORDS.has(part))
}

/**
 * Strings that identify a vendor: the joined name, its distinctive words and
 * the distinctive labels of its website's hostname.
 *
 * @param {string} name
 * @param {object} entry the catalog entry, for `website`
 * @returns {string[]}
 */
function vendorTokens(name, entry = {}) {
    const tokens = new Set()
    const nameWords = words(name)

    if (!isGeneric(name)) {
        tokens.add(nameWords.join(''))
    }

    nameWords
        .filter((word) => word.length >= MIN_LITERAL && !GENERIC_WORDS.has(word))
        .forEach((word) => tokens.add(word))

    let hostname = ''

    try {
        hostname = new URL(entry.website).hostname
    } catch (error) {
        // No usable website; the name alone has to do.
    }

    hostname
        .toLowerCase()
        .split('.')
        .filter((label) => !HOST_NOISE.has(label))
        .filter((label) => label.length >= MIN_LITERAL && !isGeneric(label))
        .forEach((label) => tokens.add(label.replace(/[^a-z0-9]/g, '')))

    return [...tokens].filter((token) => token.length >= MIN_LITERAL)
}

/**
 * Three-letter words of the name (`Vue`, `AMP`, `IIS`). Too short to match as
 * a substring, so they only count as a whole word of the pattern.
 */
const shortVendorWords = (name) =>
    words(name).filter((word) => word.length === 3 && !GENERIC_WORDS.has(word) && !HOST_NOISE.has(word))

/**
 * How many technologies claim each vendor token. A token claimed by several
 * (`shopify` for Shopify, Shopify Plus, Shopify Basic…) names the parent vendor,
 * not the technology, so a pattern naming only it cannot tell them apart.
 *
 * @param {object} technologies name -> catalog entry
 * @returns {Map<string, number>}
 */
function buildTokenOwners(technologies) {
    const owners = new Map()

    for (const [name, entry] of Object.entries(technologies)) {
        for (const token of new Set([...vendorTokens(name, entry), ...shortVendorWords(name)])) {
            owners.set(token, (owners.get(token) || 0) + 1)
        }
    }

    return owners
}

/** The vendor tokens a text contains: long ones as substrings, short ones as whole words. */
const namedTokens = (text, technology, entry) => {
    const squashed = squash(text)
    const textWords = words(text)

    return [
        ...vendorTokens(technology, entry).filter((token) => squashed.includes(token)),
        ...shortVendorWords(technology).filter((word) => textWords.includes(word)),
    ]
}

/**
 * Does the text contain a hostname with a distinctive label (`hs-scripts.com`,
 * `b-cdn.net`)? A vendor's own domain is specific even when its words are not.
 */
const hasDistinctiveHostname = (text) =>
    (String(text).toLowerCase().match(/[a-z0-9-]{3,}(?=\.[a-z]{2,})/g) || []).some(
        (label) => !GENERIC_WORDS.has(label) && !HOST_NOISE.has(label)
    )

/**
 * The text a match is guaranteed to rest on: the key plus the weakest
 * alternative's required literals. A dom selector is not a regex, so it is
 * read as written.
 */
const decisiveText = ({ channel, key, value }) =>
    channel === 'dom'
        ? `${key || ''} ${regexPart(value).replace(/\\(.)/g, '$1')}`
        : `${key || ''} ${literalStrength(value).runs.join(' ')}`

/** Selector identifiers (classes, ids, attribute names and values), minus bare tags. */
const selectorIdentifiers = (selector) =>
    (String(selector).match(/[.#][\w-]+|\[[^\]]+\]/g) || []).flatMap((part) =>
        part.replace(/[[\]'"=*^$~|.#]/g, ' ').split(/\s+/).filter(Boolean)
    )

/**
 * Every pattern of one catalog entry as a flat unit. Keyed channels and dom
 * rules carry the key (header, global, selector) the pattern is matched under.
 *
 * @param {string} technology
 * @param {object} entry
 * @returns {Array<{technology: string, entry: object, channel: string, key: string|null, value: string}>}
 */
function extractPatterns(technology, entry) {
    const units = []
    const add = (channel, key, value) =>
        units.push({ technology, entry, channel, key, value: String(value) })

    for (const [channel, shape] of Object.entries(CHANNELS)) {
        const patterns = entry[channel]

        if (patterns === undefined) {
            continue
        }

        if (shape === 'oo' || shape === 'om') {
            toArray(patterns).forEach((value) => add(channel, null, value))
        } else if (shape === 'mm' || shape === 'probe') {
            for (const [key, values] of Object.entries(patterns)) {
                toArray(values).forEach((value) => add(channel, key, value))
            }
        } else if (isPlainObject(patterns)) {
            for (const [selector, rule] of Object.entries(patterns)) {
                const regexes = [
                    ...Object.values(rule.attributes || {}),
                    ...Object.values(rule.properties || {}),
                    ...(rule.text !== undefined ? [rule.text] : []),
                ]

                if (regexes.length) {
                    regexes.forEach((value) => add(channel, selector, value))
                } else {
                    add(channel, null, selector)
                }
            }
        } else {
            toArray(patterns).forEach((selector) => add(channel, null, selector))
        }
    }

    return units
}

/**
 * Why a pattern is weak, or an empty list. The decisive text is the key plus
 * the value's required literal for keyed channels, the selector plus its rule
 * for dom, and the required literal for everything else.
 */
function weaknesses(unit) {
    const { technology, entry, channel, key, value } = unit
    const reasons = []
    const { longest, runs } = literalStrength(value)
    const text = decisiveText(unit)
    // Naming the vendor or its domain outweighs generic surrounding words.
    const specific = namedTokens(text, technology, entry).length > 0 || hasDistinctiveHostname(text)

    if (URL_CHANNELS.includes(channel)) {
        const control = matchesControl(regexPart(value), compile)

        if (control) {
            reasons.push(`fires on control URL ${control}`)
        }
    }

    if (specific && channel !== 'dom' && key === null && longest.length < MIN_LITERAL) {
        // A three-letter name is still three letters: `wow.js` is not WOW's alone.
        reasons.push(`short literal "${longest}"`)
    } else if (specific) {
        return reasons
    } else if (channel === 'dom') {
        const identifiers = key === null
            ? selectorIdentifiers(value)
            : [...selectorIdentifiers(key), ...runs]

        if (!identifiers.length || isGeneric(identifiers.join(' '))) {
            reasons.push('generic or short selector')
        }
    } else if (key !== null) {
        if (isGeneric(runs.join(' ')) && isGeneric(key)) {
            reasons.push(`generic ${channel} key "${key}" with no distinctive value`)
        }
    } else if (longest.length < MIN_LITERAL) {
        reasons.push(`short literal "${longest}"`)
    } else if (isGeneric(runs.join(' '))) {
        reasons.push(`generic literal "${longest}"`)
    }

    return reasons
}

/**
 * Triage one pattern unit from `extractPatterns`.
 *
 * @returns {{verdict: 'credible'|'suspect'|'unclear', reasons: string[], literal: string}}
 */
function triagePattern(unit) {
    const { technology, entry, key, value } = unit
    const literal = literalStrength(value).longest
    const reasons = weaknesses(unit)

    if (reasons.length) {
        return { verdict: 'suspect', reasons, literal }
    }

    const confidence = confidenceOf(value)

    if (confidence < 100) {
        return {
            verdict: 'unclear',
            reasons: [`confidence ${confidence}: only meant to count alongside other evidence`],
            literal,
        }
    }

    const named = namedTokens(decisiveText(unit), technology, entry)
    const owners = (token) => (unit.tokenOwners ? unit.tokenOwners.get(token) || 1 : 1)
    // A token shared with add-ons or plans still identifies the technology whose
    // name it is exactly (`webflow` for Webflow, not for Webflow Ecommerce).
    const ownName = squash(technology)
    const unique = named.find((token) => owners(token) <= 1 || token === ownName)

    if (unique) {
        return { verdict: 'credible', reasons: [`names the vendor ("${unique}")`], literal }
    }

    if (named.length) {
        return {
            verdict: 'unclear',
            reasons: named.map((token) =>
                `names only "${token}", shared with ${owners(token)} technologies`
            ),
            literal,
        }
    }

    return { verdict: 'unclear', reasons: ['distinctive but does not name the vendor'], literal }
}

module.exports = {
    GENERIC_WORDS,
    buildTokenOwners,
    extractPatterns,
    literalStrength,
    triagePattern,
    vendorTokens,
}
