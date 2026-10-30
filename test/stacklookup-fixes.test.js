'use strict'

/**
 * False positives found by the StackLookup audit, one block per technology.
 *
 * Each negative case is text a rule matched on a real audited page (shortened)
 * or a counterexample from the pattern review; each positive case is the
 * signal the narrowed rule is meant to keep. The evidence behind every change
 * is in the local decision record, data/decisions/<technology>.md.
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const Wappalyzer = require('../wappalyzer')
const { loadCatalog } = require('../scripts/lib/catalog')

const ROOT = path.resolve(__dirname, '..')

Wappalyzer.setCategories(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'categories.json'), 'utf8'))
)
Wappalyzer.setTechnologies(loadCatalog(path.join(ROOT, 'technologies')).technologies)

/** Names detected from a set of collected items. */
function detect(items) {
    return Wappalyzer.resolve(Wappalyzer.analyze(items)).map(({ name }) => name)
}

const WEBSPHERE = 'IBM WebSphere Application Server'

test('IBM WebSphere Application Server is detected from its full product name or generator', () => {
    assert.ok(detect({ html: '<title>IBM WebSphere Application Server</title>' }).includes(WEBSPHERE))
    assert.ok(detect({ meta: { generator: ['IBM WebSphere Application Server'] } }).includes(WEBSPHERE))
})

test('IBM WebSphere Application Server does not fire on "ibm" inside unrelated text', () => {
    const pages = [
        // base64 of `<g fill="none"`, in an inline SVG data URI
        '<span style="background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxnIGZpbGw9Im5vbmUiPg==)"></span>',
        '<link rel="prefetch" as="script" href="/_nuxt/BoIBmhlW.js">',
        '<style>:root{--wp--preset--font-family--ibm-plex-serif: IBM Plex Serif, sans-serif;}</style>',
        '<script>//  Licensed Materials - Property of IBM\n//  5724I83\n</script>',
        '<p>Our company partners with IBM</p>',
    ]
    for (const html of pages) {
        assert.ok(!detect({ html }).includes(WEBSPHERE), html)
    }
})

test('IBM WebSphere Application Server is not inferred from PHP or HTTP server banners', () => {
    assert.ok(!detect({ headers: { 'x-powered-by': ['PHP/8.3.12'] } }).includes(WEBSPHERE))
    assert.ok(!detect({ headers: { server: ['IBM HTTP Server/9.0.5'] } }).includes(WEBSPHERE))
    assert.ok(!detect({ headers: { server: ['HTTP Server/1.0'] } }).includes(WEBSPHERE))
})

const SCHANNEL = 'Schannel'

test('Schannel is detected from IIS and HTTP.sys server banners', () => {
    for (const server of ['Microsoft-IIS/10.0', 'Microsoft-IIS/8.5', 'Microsoft-HTTPAPI/2.0']) {
        assert.ok(detect({ headers: { server: [server] } }).includes(SCHANNEL), server)
    }
})

test('Schannel is not inferred from X-Powered-By or non-Windows server banners', () => {
    for (const value of ['PHP/8.3.12', 'Next.js', 'ASP.NET', 'Express']) {
        assert.ok(!detect({ headers: { 'x-powered-by': [value] } }).includes(SCHANNEL), value)
    }
    // Apache on Windows ships with OpenSSL, not Schannel.
    for (const server of ['nginx', 'Apache/2.4.58 (Win64) OpenSSL/3.1.3', 'cloudflare']) {
        assert.ok(!detect({ headers: { server: [server] } }).includes(SCHANNEL), server)
    }
})

const CM360 = 'Google Campaign Manager 360'

// The Floodlight URL builder that every gtag.js and GTM build carries.
const GTAG_FLOODLIGHT_TEMPLATE =
    'nk[3]=function(a){return"https://"+a.cq+".fls.doubleclick.net/activityi"+(P(467)?";":"/")}'

test('Google Campaign Manager 360 is detected from a Floodlight tag or DC- configuration', () => {
    const cases = [
        { html: '<iframe height="0" width="0" src="https://8941176.fls.doubleclick.net/activityi;src=8941176;type=invmedia;cat=z3xkn0;ord=1"></iframe>' },
        { scriptSrc: ['https://www.googletagmanager.com/gtag/js?id=DC-1234567'] },
        { scripts: ['{"function":"__googtag","vtp_tagId":"DC-14970414","tag_id":161}'] },
        { scripts: ['{"function":"__fls","metadata":["map"],"once_per_event":true}'] },
        { scripts: ["gtag('config', 'DC-1234567');"] },
    ]
    for (const items of cases) {
        assert.ok(detect(items).includes(CM360), JSON.stringify(items))
    }
})

test('Google Campaign Manager 360 is not inferred from the Floodlight template in gtag.js or GTM', () => {
    for (const script of [
        GTAG_FLOODLIGHT_TEMPLATE,
        "gtag('config', 'G-ABC1234567'); gtag('config', 'AW-123456789');",
    ]) {
        assert.ok(!detect({ scripts: [script] }).includes(CM360), script)
    }
})

const BLUEKAI = 'BlueKai'

test('BlueKai is detected from its tag hosts and tag API', () => {
    const cases = [
        { scriptSrc: ['https://tags.bluekai.com/site/12345?ret=js&limit=1'] },
        { scriptSrc: ['https://tags.bkrtx.com/js/bk-coretag.js'] },
        { html: '<img height="1" width="1" src="//stags.bluekai.com/site/12345?ret=html">' },
        { scripts: ["bk_addPageCtx('category', 'shoes'); BKTAG.doTag(12345, 4);"] },
        // Async loader that injects bk-coretag.js from an inline script
        { scripts: ['window.bk_async=function(){bk_allow_multiple_calls=true;bk_use_multiple_iframes=true;BKTAG.doTag(49075,1)};(function(){var s=document.createElement("script");s.async=true;s.src="https://tags.bkrtx.com/js/bk-coretag.js"})();'] },
        { scripts: ['BKTAG.doTag(49075,1)'] },
    ]
    for (const items of cases) {
        assert.ok(detect(items).includes(BLUEKAI), JSON.stringify(items))
    }
})

test('BlueKai does not fire on "bk" fragments in unrelated code', () => {
    const scripts = [
        String.raw`/(?:kr|Kr|TL|zł|Kč)\.?\s?\d|\bKR\s?\d[\d ,.]*[.,]\d{2}/`,
        '["y29UzMLN","DxbKyxrLu2vZC2LVBKrHDge","mtiXndK1mdrbBKrcBuu"]',
        'ds=mz+"img/te_bk.gif";',
        'import"./chunk.windoid_BkiqS_xQ.esm.js";',
        '<option value="bdt_bkash">BKASH</option>',
        // A consent manager's list of tracking hosts to block
        '[["bidswitch.net",78,4,46,"script","URL"],["bluekai.com",79,4,47,"script","URL"]]',
    ]
    for (const script of scripts) {
        assert.ok(!detect({ scripts: [script] }).includes(BLUEKAI), script)
    }
})
