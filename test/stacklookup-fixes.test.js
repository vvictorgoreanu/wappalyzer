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
