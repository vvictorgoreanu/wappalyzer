'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const {
    parseCsv,
    parseSamples,
    dedupeSamples,
    mapNames,
    buildReviews,
    verdictForClaim,
    summarize,
    hostName,
    scanHealth,
} = require('../scripts/lib/stacklookup')

const shortHeader = 'root_domain,domain,time,crawls,technologies\n'
const catalog = { Vendor: { html: 'vendor-marker' }, Parent: {}, Database: {} }
const review = (verdict, extra = {}) => ({
    id: 1, technology: 'Vendor', channel: 'html', key: null,
    pattern: 'vendor-marker', review: { verdict }, ...extra,
})
const detection = (extra = {}) => ({
    type: 'html', regex: 'vendor-marker', match: 'vendor-marker',
    value: 'vendor-marker', implies: [], ...extra,
})
const scan = (extra = {}) => ({
    status: 200, finalUrl: 'https://example.com/',
    html: `${'a'.repeat(120)}vendor-marker${'b'.repeat(120)}`,
    headers: {}, technologies: [{ name: 'Vendor' }],
    patterns: { Vendor: [detection()] }, ...extra,
})
const judge = (record = scan(), patterns = [review('credible')], name = 'Vendor', answers = []) =>
    verdictForClaim(name, record, catalog, buildReviews(patterns, answers))

test('parses the seven-column BOM export, quoted commas, escaped quotes and multiline cells', () => {
    const parsed = parseSamples('\uFEFFroot_domain,domain,time,crawls,crawler_domain,technologies,categories\r\n' +
        'example.com,www.example.com,2026-10-28,1,example.com,"vendor|vendor|parent","a, ""b""\nc"\r\n')

    assert.equal(parsed.rows.length, 1)
    assert.deepEqual(parsed.rows[0].technologies, ['vendor', 'parent'])
    assert.equal(parsed.rows[0].categories, 'a, "b"\nc')
    assert.deepEqual(parsed.errors, [])
})

test('parses five-column BOM exports and a complete last row without a newline', () => {
    const { rows, errors } = parseSamples(`\uFEFF${shortHeader}example.com,example.com,2026-10-28,2,"vendor|PARENT|vendor|"`)

    assert.deepEqual(rows[0].technologies, ['vendor', 'parent', ''])
    assert.deepEqual(errors, [])
})

test('drops and reports an unterminated quoted last row or short last row', () => {
    for (const tail of ['bad.com,bad.com,2026-10-29', 'bad.com,bad.com,2026-10-29,1,"vendor']) {
        const { rows, errors } = parseSamples(`${shortHeader}ok.com,ok.com,2026-10-28,1,vendor\n${tail}`)

        assert.equal(rows.length, 1)
        assert.equal(errors.length, 1)
        assert.match(errors[0], /line 3.*truncated/i)
    }
})

test('rejects malformed interior CSV rows and missing required headers', () => {
    assert.throws(() => parseSamples(`${shortHeader}bad.com,x\nok.com,ok.com,2026-10-28,1,vendor\n`), /line 2/)
    assert.throws(() => parseSamples('domain,technology\nx,vendor\n'), /root_domain/)
    assert.throws(() => parseCsv('a,b\n"x"junk,y\n'), /quote/i)
})

test('dedupes overlapping parts by root and host using latest time, without merging stale claims', () => {
    const rows = [
        { root_domain: 'a.com', domain: 'www.a.com', time: '2026-10-29', technologies: ['parent'] },
        { root_domain: 'a.com', domain: 'www.a.com', time: '2026-10-28', technologies: ['vendor'] },
        { root_domain: 'other.com', domain: 'www.a.com', time: '2026-10-27', technologies: ['vendor'] },
    ]
    const result = dedupeSamples(rows)

    assert.equal(result.length, 2)
    assert.deepEqual(result[0].technologies, ['parent'])
    assert.throws(() => dedupeSamples([{ ...rows[0], time: 'invalid' }]), /time/i)
})

test('maps names case-insensitively, dedupes them and retains unknown and empty claims', () => {
    assert.deepEqual(mapNames(['VENDOR', 'vendor', 'parent', 'missing', ''], catalog), [
        { claimed: 'vendor', technology: 'Vendor' },
        { claimed: 'parent', technology: 'Parent' },
        { claimed: 'missing', technology: null },
        { claimed: '', technology: null },
    ])
})

test('only accepts plain hostnames for scan targets and cache paths', () => {
    assert.equal(hostName('WWW.Example.com'), 'www.example.com')
    for (const value of ['../escape', 'https://example.com', 'a.com/path', 'a.com:443', 'user@a.com', '', '-bad.com']) {
        assert.throws(() => hostName(value), /host/i)
    }
})

test('confirmed requires a credible reviewed direct match', () => {
    assert.equal(judge().verdict, 'confirmed')
    assert.equal(judge(scan(), [review('suspect', { review: undefined, verdict: 'credible' })]).verdict, 'confirmed')
})

test('suspect-pattern includes regex, matched text and about 200 characters of context', () => {
    for (const verdict of ['too-broad', 'wrong', 'needs-evidence']) {
        const result = judge(scan(), [review(verdict)])

        assert.equal(result.verdict, 'suspect-pattern')
        assert.equal(result.evidence[0].regex, 'vendor-marker')
        assert.equal(result.evidence[0].matchedText, 'vendor-marker')
        assert.ok(result.evidence[0].context.includes('vendor-marker'))
        assert.ok(result.evidence[0].context.length >= 190)
        assert.ok(result.evidence[0].context.length <= 240)
    }
})

test('missing reviews cannot confirm a repeated match, nor can an explicit vendor mismatch', () => {
    assert.equal(judge(scan(), []).verdict, 'unreviewed')
    assert.match(judge(scan(), []).evidence[0].reason, /review|evidence/i)
    assert.equal(judge(scan({ patterns: { Vendor: [detection({ vendorMatch: false })] } })).verdict, 'suspect-pattern')
    assert.equal(judge(scan({ patterns: { Vendor: [detection({ vendorMatch: false })] } }), []).verdict, 'suspect-pattern')
})

test('a reviewed bad pattern makes the claim suspect even beside an unreviewed one', () => {
    const record = scan({ patterns: { Vendor: [detection(), detection({ regex: 'other-marker', match: 'other-marker' })] } })

    assert.equal(judge(record, [review('too-broad')]).verdict, 'suspect-pattern')
    assert.equal(judge(record, [review('credible')]).verdict, 'confirmed')
    assert.equal(judge(record, []).verdict, 'unreviewed')
})

test('second-pass overturn is credible; confirm retains bad verdict; needs-evidence remains pending', () => {
    for (const [verdict, expected] of [
        ['overturn', 'confirmed'], ['confirm', 'suspect-pattern'], ['needs-evidence', 'suspect-pattern'],
    ]) {
        assert.equal(judge(scan(), [review('wrong')], 'Vendor', [{ id: 1, verdict, action: 'data only' }]).verdict, expected)
    }
    assert.equal(judge(scan(), [review('wrong')], 'Vendor', [{ id: 99, verdict: 'overturn' }]).verdict, 'suspect-pattern')
})

test('review keys prevent identical regexes on different headers from borrowing credibility', () => {
    const patterns = [
        review('credible', { channel: 'headers', key: 'x-vendor', pattern: '' }),
        review('wrong', { id: 2, channel: 'headers', key: 'server', pattern: '' }),
    ]
    const record = scan({ patterns: { Vendor: [detection({ type: 'headers', regex: '(?:)', key: 'server', match: '', value: 'nginx' })] } })

    assert.equal(judge(record, patterns).verdict, 'suspect-pattern')
    // Extended output omits keys: ambiguity must not choose the credible key.
    delete record.patterns.Vendor[0].key
    assert.equal(judge(record, patterns).verdict, 'suspect-pattern')
})

test('a detection key selects its own review, ignoring the case the engine lowercases', () => {
    const patterns = [
        review('credible', { channel: 'js', key: 'Vendor_shared', pattern: '' }),
        review('too-broad', { id: 2, channel: 'js', key: 'core', pattern: '' }),
        review('credible', { id: 3, channel: 'headers', key: 'X-Vendor', pattern: '' }),
    ]
    const js = (key) => scan({ patterns: { Vendor: [detection({ type: 'js', regex: '(?:)', key, match: '', value: 'true' })] } })
    const header = scan({ patterns: { Vendor: [detection({ type: 'headers', regex: '(?:)', key: 'x-vendor', match: '', value: '1' })] } })

    assert.equal(judge(js('Vendor_shared'), patterns).verdict, 'confirmed')
    assert.equal(judge(js('core'), patterns).verdict, 'suspect-pattern')
    assert.equal(judge(header, patterns).verdict, 'confirmed')
})

test('DOM reviews are matched by selector, which the engine reports as the key', () => {
    const record = scan({ patterns: { Vendor: [detection({ type: 'dom', regex: '(?:)', key: '.vendor-app', match: '', value: '' })] } })
    const patterns = [
        review('credible', { channel: 'dom', key: null, pattern: '.vendor-app' }),
        review('too-broad', { id: 2, channel: 'dom', key: null, pattern: '.slider' }),
    ]

    assert.equal(judge(record, patterns).verdict, 'confirmed')
    // Without a key (older caches) every selector stays a candidate.
    delete record.patterns.Vendor[0].key
    assert.equal(judge(record, patterns).verdict, 'suspect-pattern')
})

test('regex attributes are stripped using the engine parser when matching reviews', () => {
    assert.equal(judge(scan(), [review('credible', { pattern: 'vendor-marker\\;confidence:50' })]).verdict, 'confirmed')
})

test('header and script URL evidence retains the complete value', () => {
    for (const type of ['headers', 'cookies', 'scriptSrc']) {
        const value = `https://example.com/${'a'.repeat(300)}/vendor-marker.js`
        const result = judge(scan({ patterns: { Vendor: [detection({ type, value })] } }), [])

        assert.equal(result.evidence[0].context, value)
    }
})

test('short external script evidence uses the script text rather than unrelated HTML', () => {
    const value = '/* vendor-marker initialized */'
    const result = judge(scan({ html: '<p>Unrelated page copy</p>', patterns: {
        Vendor: [detection({ type: 'scripts', value })],
    } }), [])

    assert.equal(result.evidence[0].context, value)
})

test('implied-only retains the implication chain, including transitive catalog implications', () => {
    const impliedCatalog = { ...catalog, Parent: { implies: 'Database' } }
    const record = scan({
        technologies: [{ name: 'Vendor' }, { name: 'Parent' }, { name: 'Database' }],
        patterns: { Vendor: [detection({ implies: ['Parent'] })] },
    })
    const result = verdictForClaim('Database', record, impliedCatalog, buildReviews([]))

    assert.equal(result.verdict, 'implied-only')
    assert.deepEqual(result.impliesChain, ['Vendor', 'Parent', 'Database'])
    assert.equal(judge(scan({ technologies: [{ name: 'Vendor' }], patterns: {} })).verdict, 'unverifiable')
})

test('not-detected searches cached HTML, headers and script URLs without treating a search hit as confirmation', () => {
    const result = judge(scan({ technologies: [], patterns: {}, scriptSrc: ['https://example.com/vendor.js'] }))

    assert.equal(result.verdict, 'not-detected')
    assert.equal(result.sourceMatches[0].channel, 'html')
    assert.equal(result.sourceMatches[0].matchedText, 'vendor-marker')
})

test('offline source search skips DOM selectors rather than compiling them as regexes', () => {
    const result = verdictForClaim('Vendor', scan({ technologies: [], patterns: {} }),
        { Vendor: { dom: '*' } }, buildReviews([]))

    assert.equal(result.verdict, 'not-detected')
    assert.deepEqual(result.sourceMatches, [])
})

test('not-in-catalog applies even when the scan is unavailable', () => {
    assert.equal(judge(null, [], 'missing').verdict, 'not-in-catalog')
})

test('errors, timeouts, parked pages, non-2xx and missing cache are unverifiable', () => {
    for (const record of [null, scan({ error: 'timeout' }), scan({ status: 404 }), scan({ status: 302 }),
        scan({ status: null }), scan({ parked: true }), scan({ html: '<title>This domain is for sale</title>' })]) {
        assert.equal(judge(record).verdict, 'unverifiable')
    }
})

test("Chromium's own error page is not the site, even when it reports HTTP 200", () => {
    const record = scan({ finalUrl: 'chrome-error://chromewebdata/' })
    assert.deepEqual(judge(record), { verdict: 'unverifiable', reason: 'Browser error page (chrome-error://chromewebdata/)' })
})

test('summaries exclude unverifiable, unreviewed and unknown claims from rates and rank suspects by live companies', () => {
    const rows = [
        { technology: 'Vendor', verdict: 'confirmed' },
        { technology: 'Vendor', verdict: 'suspect-pattern' },
        { technology: 'Vendor', verdict: 'unverifiable' },
        { technology: 'Vendor', verdict: 'unreviewed' },
        { technology: 'Parent', verdict: 'not-detected' },
        { technology: null, claimed: 'missing', verdict: 'not-in-catalog' },
    ]
    const result = summarize(rows, new Map([['vendor', 100], ['parent', 1000]]))

    assert.equal(result[0].technology, 'Parent')
    assert.equal(result[0].weightedSuspects, 1000)
    const vendor = result.find(({ technology }) => technology === 'Vendor')

    assert.equal(vendor.claims, 4)
    assert.equal(vendor.counts.unreviewed, 1)
    assert.equal(vendor.verifiable, 2)
    assert.equal(vendor.suspectRate, 0.5)
    assert.equal(result.find(({ technology }) => technology === 'missing').suspectRate, null)
})

test('probe failures and channel timeouts are separated from fatal scan errors', () => {
    assert.deepEqual(scanHealth([
        'Probe failed (/api/v1/clusters): Timeout (https://example.com/api/v1/clusters, 3000ms)',
        'Probe failed (/robots.txt): 404 Not Found',
        'Error: Timeout (js)',
        'Error: Timeout (dom)',
        'Error: Timeout (js)',
        'Something else broke',
    ]), {
        probeErrors: [
            'Probe failed (/api/v1/clusters): Timeout (https://example.com/api/v1/clusters, 3000ms)',
            'Probe failed (/robots.txt): 404 Not Found',
        ],
        partial: ['js', 'dom'],
    })
})

test('a partial scan is unverifiable only for undetected technologies with patterns on the timed-out channel', () => {
    const partialCatalog = { ...catalog, Scripted: { js: { 'Scripted.version': '' } } }
    const record = scan({ partial: ['js'], technologies: [], patterns: {} })
    const judgeIn = (name) => verdictForClaim(name, record, partialCatalog, buildReviews([]))

    assert.equal(judgeIn('Vendor').verdict, 'not-detected')
    const scripted = judgeIn('Scripted')
    assert.equal(scripted.verdict, 'unverifiable')
    assert.match(scripted.reason, /js/)
    // A detection on a partial scan still counts.
    assert.equal(judge(scan({ partial: ['js'] })).verdict, 'confirmed')
})
