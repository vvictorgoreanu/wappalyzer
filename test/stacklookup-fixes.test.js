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

const NUNJUCKS = 'Nunjucks'

test('Nunjucks is detected from its browser bundle or precompiled templates', () => {
    const cases = [
        { scriptSrc: ['https://cdn.jsdelivr.net/npm/nunjucks@3.2.4/browser/nunjucks.min.js'] },
        { scriptSrc: ['https://cdnjs.cloudflare.com/ajax/libs/nunjucks/3.0.1/nunjucks-slim.js'] },
        { scriptSrc: ['/assets/nunjucks-slim.js'] },
        { scripts: ['/*! Browser bundle of nunjucks 3.2.4 (slim, only works with precompiled templates) */'] },
        { scripts: ['(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["item.html"] = (function() {'] },
    ]
    for (const items of cases) {
        assert.ok(detect(items).includes(NUNJUCKS), JSON.stringify(items))
    }
})

test('Nunjucks is not inferred from {{ }} or {% %} syntax of other template engines', () => {
    const pages = [
        // Handlebars template on a Weebly site
        '<li {{#id}}id="{{id}}"{{/id}}><a href="{{url}}">{{title}}</a></li>',
        // Shopify money format
        '<script>var theme = { moneyFormat: "{{amount_no_decimals}} yen" }</script>',
        // WooCommerce variation template
        '<div class="woocommerce-variation-availability">{{{ data.variation.availability_html }}}</div>',
        // Jinja, Twig and Django tags shown in documentation
        '<pre>{% extends "base.html" %}{% block content %}{% for user in users %}{{ user.name }}{% endfor %}{% endblock %}</pre>',
        // A link to the download, not a loaded script
        '<a href="files/nunjucks.min.js">nunjucks.min.js</a>',
    ]
    for (const html of pages) {
        assert.ok(!detect({ html }).includes(NUNJUCKS), html)
    }
})

const CLOUDFLARE_BOT_MANAGEMENT = 'Cloudflare Bot Management'

// __cf_bm is set by Bot Management, Bot Fight Mode and Super Bot Fight Mode
// alike, so it identifies Cloudflare's bot protection, not one of its tiers.
test('Cloudflare Bot Management is detected from the __cf_bm cookie and implies Cloudflare', () => {
    const names = detect({ cookies: { __cf_bm: ['X1bOd7LrTy0-1793281535-1.0.1.1-uoMEUF8DiVkiEDWAPT'] } })
    assert.ok(names.includes(CLOUDFLARE_BOT_MANAGEMENT))
    assert.ok(names.includes('Cloudflare'))
})

test('Cloudflare Bot Management is not inferred from Cloudflare alone', () => {
    const names = detect({
        headers: { server: ['cloudflare'], 'cf-ray': ['a5229f1f5f8270d1-OTP'] },
        cookies: { _cfuvid: ['2nyF1sQbN4Hk-1793281535-0.0.1.1-604800000'] },
    })
    assert.ok(names.includes('Cloudflare'))
    assert.ok(!names.includes(CLOUDFLARE_BOT_MANAGEMENT))
})

const FLOODLIGHT = 'DoubleClick Floodlight'

test('DoubleClick Floodlight is detected from a Floodlight tag or DC- configuration', () => {
    const cases = [
        { html: '<iframe height="0" width="0" src="https://1762894.fls.doubleclick.net/activityi;src=1762894;type=Heart;cat=HSubarHP;ord=1"></iframe>' },
        // gtag.js for a DC- ID, as GTM or Adobe Launch insert it at runtime
        { scriptSrc: ['https://www.googletagmanager.com/gtag/js?id=DC-3924042&cx=c&gtm=4e6as1'] },
        { scripts: ['{"function":"__googtag","vtp_tagId":"DC-5756351","tag_id":12}'] },
        { scripts: ['{"function":"__fls","metadata":["map"],"once_per_event":true}'] },
        { scripts: ["gtag('config', 'DC-2906542');"] },
    ]
    for (const items of cases) {
        assert.ok(detect(items).includes(FLOODLIGHT), JSON.stringify(items))
    }
})

test('DoubleClick Floodlight is not inferred from gtag.js, GTM or other doubleclick.net products', () => {
    for (const script of [
        GTAG_FLOODLIGHT_TEMPLATE,
        "gtag('config', 'G-ABC1234567'); gtag('config', 'AW-123456789');",
    ]) {
        assert.ok(!detect({ scripts: [script] }).includes(FLOODLIGHT), script)
    }
    for (const src of [
        // Google Publisher Tag: the site sells ads
        'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
        'https://securepubads.g.doubleclick.net/pagead/managed/js/gpt/m202610230101/pubads_impl.js',
        // Google Ads remarketing and Universal Analytics
        'https://googleads.g.doubleclick.net/pagead/viewthroughconversion/1065529365/?random=1',
        'https://stats.g.doubleclick.net/dc.js',
    ]) {
        assert.ok(!detect({ scriptSrc: [src] }).includes(FLOODLIGHT), src)
    }
})

const AZURE_APP_SERVICE = 'Azure App Service'

test('Azure App Service is detected from its default hostname or affinity cookie and implies Azure', () => {
    const cases = [
        // Custom domains point a CNAME at the app's default hostname, in either documented shape
        { dns: { cname: ['contoso.azurewebsites.net.'] } },
        { dns: { cname: ['contoso-a6gqaeashthkhkeu.eastus-01.azurewebsites.net.'] } },
        { dns: { cname: ['contoso.appserviceenvironment.net.'] } },
        { url: 'https://contoso.azurewebsites.net/' },
        { url: 'https://contoso-a6gqaeashthkhkeu.eastus-01.azurewebsites.net/login' },
        // Set by the App Service front ends with ARRAffinity when session affinity is on
        { cookies: { arraffinitysamesite: ['6cab9c152fca1337b55c609f536c15b1ddfff2d856539758b2ef39407cdb57ad'] } },
    ]
    for (const items of cases) {
        const names = detect(items)
        assert.ok(names.includes(AZURE_APP_SERVICE), JSON.stringify(items))
        assert.ok(names.includes('Azure'), JSON.stringify(items))
    }
})

test('Azure App Service is not inferred from IIS, Kestrel or ARR banners or from Static Web Apps', () => {
    const cases = [
        { headers: { server: ['Microsoft-IIS/10.0'], 'x-powered-by': ['ASP.NET'] } },
        // On-premises Application Request Routing
        { headers: { server: ['Microsoft-IIS/8.5'], 'x-powered-by': ['ASP.NET, ARR/3.0, ASP.NET'] } },
        { headers: { server: ['Kestrel'] } },
        // The plain ARRAffinity name is also used outside App Service; it maps to Azure only
        { cookies: { arraffinity: ['6cab9c152fca1337b55c609f536c15b1ddfff2d856539758b2ef39407cdb57ad'] } },
        // Azure Static Web Apps resolve through an internal App Service hop
        { dns: { cname: ['msha-slice-0-am2-1.msha-slice-0-am2-1-ase.p.azurewebsites.net.'] } },
        { dns: { cname: ['waws-prod-am2-9472da61.sip.p.azurewebsites.windows.net.'] } },
        { url: 'https://ambitious-hill-079be3203.azurestaticapps.net/' },
    ]
    for (const items of cases) {
        assert.ok(!detect(items).includes(AZURE_APP_SERVICE), JSON.stringify(items))
    }
})

const GTM = 'Google Tag Manager'

test('Google Tag Manager is detected from a GTM- container id in its snippet URLs', () => {
    for (const src of [
        'https://www.googletagmanager.com/gtm.js?id=GTM-NVPKZD4',
        // Renamed data layer, and first-party serving through Google tag gateway
        'https://www.googletagmanager.com/gtm.js?l=gtmDataLayer&id=GTM-52P6DN',
        'https://www.example.com/metrics/gtm.js?id=GTM-MZV8B6LH',
    ]) {
        assert.ok(detect({ scriptSrc: [src] }).includes(GTM), src)
    }
    // The noscript part stays in the page when a consent banner holds gtm.js back
    const html =
        '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PVTN7BBB" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>'
    assert.ok(detect({ html }).includes(GTM))
})

test('Google Tag Manager is not inferred from the Google tag, its globals or broken snippets', () => {
    for (const src of [
        // gtag.js for GA4, Google Ads, a Google tag, Universal Analytics and Floodlight
        'https://www.googletagmanager.com/gtag/js?id=G-98NR8EVBH7',
        'https://www.googletagmanager.com/gtag/js?id=AW-17804902379',
        'https://www.googletagmanager.com/gtag/js?id=GT-5R7GQ2X',
        'https://www.googletagmanager.com/gtag/js?id=UA-169155316-1&cx=c&gtm=4e6as1',
        'https://www.googletagmanager.com/gtag/js?id=DC-3924042',
        // The GTM loader given a GA4 id or a placeholder, not a container
        'https://www.googletagmanager.com/gtm.js?id=G-1F4FGQ87T7',
        'https://www.googletagmanager.com/gtm.js?id=XXX',
    ]) {
        assert.ok(!detect({ scriptSrc: [src] }).includes(GTM), src)
    }
    for (const html of [
        // A commented-out snippet keeps its comment
        "<!-- Google Tag Manager --> <!--<script>(function(w,d,s,l,i){w[l]=w[l]||[];--> <!-- End Google Tag Manager -->",
        // Google Optimize containers also use GTM- ids
        "<script>ga('create', 'UA-39467830-1', 'auto'); ga('require', 'GTM-KL7BC3L');</script>",
    ]) {
        assert.ok(!detect({ html }).includes(GTM), html)
    }
    // Globals the Google tag and Google Publisher Tag define without a container
    for (const chain of ['google_tag_data', 'google_tag_manager', 'googletag']) {
        const names = Wappalyzer.resolve(
            Wappalyzer.analyzeJs([{ name: GTM, chain, value: true }])
        ).map(({ name }) => name)
        assert.ok(!names.includes(GTM), chain)
    }
})

const LODASH = 'Lodash'

/**
 * Names resolved from JS chains, fed the way driver.js does: one item per
 * technology whose js rules read the chain (Lodash and Underscore.js both
 * read _.VERSION).
 */
function detectJs(chains) {
    const items = []
    for (const [chain, value] of Object.entries(chains)) {
        for (const technology of Wappalyzer.technologies) {
            if (Object.keys(technology.js || {}).includes(chain)) {
                items.push({ name: technology.name, chain, value })
            }
        }
    }
    return Wappalyzer.resolve(Wappalyzer.analyzeJs(items))
}

test('Lodash is detected from a 2.x-4.x _.VERSION or its own methods', () => {
    const cases = [
        // Full build (unpkg, cdnjs, WordPress, Wix)
        { '_.VERSION': '4.18.1', '_.differenceBy': true },
        // lodash.core.js has no differenceBy; only its version tells it apart
        { '_.VERSION': '4.17.21' },
        { '_.VERSION': '3.10.1' },
        { '_.VERSION': '2.4.2' },
    ]
    for (const chains of cases) {
        const lodash = detectJs(chains).find(({ name }) => name === LODASH)
        assert.ok(lodash, JSON.stringify(chains))
        assert.equal(lodash.version, chains['_.VERSION'])
    }
})

test('Lodash is not inferred from Underscore.js, which also sets _.VERSION', () => {
    const cases = [
        // Weebly and WordPress pages: Underscore.js 1.8.3 and 1.13.8
        { '_.VERSION': '1.8.3' },
        { '_.VERSION': '1.13.8', '_.restArguments': true },
    ]
    for (const chains of cases) {
        const names = detectJs(chains).map(({ name }) => name)
        assert.ok(!names.includes(LODASH), JSON.stringify(chains))
        assert.ok(names.includes('Underscore.js'), JSON.stringify(chains))
    }
})

const GA = 'Google Analytics'

test('Google Analytics is detected from a Google tag loaded with a GA4 or Universal Analytics id', () => {
    for (const [src, version] of [
        ['https://www.googletagmanager.com/gtag/js?id=G-98NR8EVBH7', 'GA4'],
        // Loaded by a Tag Manager container, and first-party through Google tag gateway
        ['https://www.googletagmanager.com/gtag/js?id=G-7LSBWW632J&cx=c&gtm=4e6ar1h1', 'GA4'],
        ['https://www.example.com/gateway/gtag/js?id=G-3ZQW7GJN96&cx=c&gtm=4e6ar1', 'GA4'],
        ['https://www.googletagmanager.com/gtag/js?id=UA-176929883-1', 'UA'],
    ]) {
        const ga = Wappalyzer.resolve(Wappalyzer.analyze({ scriptSrc: [src] })).find(({ name }) => name === GA)
        assert.ok(ga, src)
        assert.equal(ga.version, version, src)
    }
})

test('Google Analytics is not inferred from a Google tag loaded for Google Ads, Floodlight or an unknown tag', () => {
    for (const src of [
        // Google Ads and Floodlight
        'https://www.googletagmanager.com/gtag/js?id=AW-17804902379',
        'https://www.googletagmanager.com/gtag/js?id=AW-17610753647&cx=c&gtm=4e6ar1',
        'https://www.googletagmanager.com/gtag/js?id=DC-3924042',
        // A GT- Google tag may or may not have a GA4 destination; the URL cannot tell
        'https://www.googletagmanager.com/gtag/js?id=GT-NSL7KGS',
        // An empty id loads no tag
        'https://www.googletagmanager.com/gtag/js?id=',
    ]) {
        assert.ok(!detect({ scriptSrc: [src] }).includes(GA), src)
    }
})

const CORE_JS = 'core-js'

test('core-js is detected from its shared store, its 0.x-2.x core global or babel-polyfill', () => {
    const cases = [
        // core-js 3.x: only the shared store
        [{ '__core-js_shared__': true, '__core-js_shared__.versions.0.version': '3.51.0' }, '3.51.0'],
        // core-js 2.6 client build: store and window.core
        [{ '__core-js_shared__': true, '__core-js_shared__.versions.0.version': '2.6.12', core: true, 'core.version': '2.6.12' }, '2.6.12'],
        // core-js 1.x-2.5 builds have no versions list; core.version carries it
        [{ '__core-js_shared__': true, core: true, 'core.version': '1.2.6' }, '1.2.6'],
        // babel-polyfill 6.26.0 (core-js 2.5.0)
        [{ '__core-js_shared__': true, _babelPolyfill: true, core: true, 'core.version': '2.5.0' }, '2.5.0'],
    ]
    for (const [chains, version] of cases) {
        const coreJs = detectJs(chains).find(({ name }) => name === CORE_JS)
        assert.ok(coreJs, JSON.stringify(chains))
        assert.equal(coreJs.version, version, JSON.stringify(chains))
    }
})

test('core-js is not inferred from an unrelated window.core', () => {
    // Cargo sites: the editor stub sets window.core = { markAsEditable }
    const names = detectJs({ core: true }).map(({ name }) => name)
    assert.ok(!names.includes(CORE_JS))
})

const SIRVOY = 'Sirvoy'

test('Sirvoy is detected from the SirvoyBookingWidget global its embed script defines', () => {
    // secured.sirvoy.com/widget/sirvoy.js sets window.SirvoyBookingWidget
    assert.ok(detectJs({ SirvoyBookingWidget: true }).some(({ name }) => name === SIRVOY))
})

test('Sirvoy is not inferred from the svSession cookie name in Wix runtime code', () => {
    for (const script of [
        // Wix inline bootstrap: the list of Wix's own session cookies
        '{cookie:P}=(e=new Set([T,"client-binding",k,"svSession","smSession","server-session-bind","wixSession2","wixSession3"]',
        // Wix Thunderbolt bundles: site member and visitor session accessors
        'return{get siteMemberId(){return n.getSiteMemberId()},get visitorId(){return n.getVisitorId()},get svSession(){return n.getUserSession()},viewerSessionId:o',
        'g=e=>{let{apps:t,siteMemberId:n,visitorId:r,svSession:o,smToken:s}=m,a=i().mapValues(t,"instance")',
    ]) {
        assert.ok(!detect({ scripts: [script] }).includes(SIRVOY), script)
    }
})
