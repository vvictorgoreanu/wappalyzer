'use strict'

/**
 * Tests for the mechanical pattern triage.
 *
 * The triage only decides the easy cases: a pattern is `credible` when its
 * decisive text names the vendor, `suspect` when it rests on a short or generic
 * literal or fires on the control corpus, and `unclear` otherwise. Unclear is the
 * safe default — a rule that wrongly calls a pattern credible hides a false
 * positive, so most cases below pin down when the triage must NOT say credible.
 */

const test = require('node:test')
const assert = require('node:assert/strict')

const {
    buildTokenOwners,
    extractPatterns,
    literalStrength,
    triagePattern,
    vendorTokens,
} = require('../scripts/lib/pattern-triage')

const triage = (technology, channel, key, value, entry = {}) =>
    triagePattern({ technology, entry, channel, key, value })

test('literalStrength reads escaped literals and drops pattern attributes', () => {
    assert.equal(literalStrength('cdn\\.shopify\\.com').longest, 'cdn.shopify.com')
    assert.equal(literalStrength('foo\\.js\\;version:\\1\\;confidence:50').longest, 'foo.js')
})

test('literalStrength takes the weakest top-level alternative', () => {
    // `x` alone is enough to match, so the pattern is only as strong as `x`.
    assert.equal(literalStrength('longvendorname|x').longest, 'x')
    assert.equal(literalStrength('(?:alpha|beta)gamma').longest, 'gamma')
})

test('literalStrength does not count character classes or metacharacters', () => {
    assert.equal(literalStrength('[a-z]+\\d*').longest, '')
    assert.equal(literalStrength('^/ab(?:c)?$').longest, '/ab')
})

test('vendorTokens come from the name and the website, minus generic words', () => {
    const tokens = vendorTokens('Google Tag Manager', {
        website: 'https://tagmanager.google.com',
    })

    assert.ok(tokens.includes('googletagmanager'))
    assert.ok(tokens.includes('google'))
    assert.ok(tokens.includes('tagmanager'))
    assert.ok(!tokens.includes('manager'))
    assert.ok(!tokens.includes('tag'))
})

test('a vendor hostname in scriptSrc is credible', () => {
    const result = triage('Shopify', 'scriptSrc', null, 'cdn\\.shopify\\.com')

    assert.equal(result.verdict, 'credible')
})

test('a vendor-named js global is credible', () => {
    const result = triage('Elementor', 'js', 'elementorFrontendConfig.version', '([\\d\\.]+)\\;version:\\1')

    assert.equal(result.verdict, 'credible')
})

test('meta generator naming the product is credible', () => {
    assert.equal(triage('WordPress', 'meta', 'generator', '^WordPress ?([\\d.]+)?\\;version:\\1').verdict, 'credible')
})

test('a generic header name alone is suspect, with the vendor in the value it is credible', () => {
    assert.equal(triage('Express', 'headers', 'x-powered-by', '').verdict, 'suspect')
    assert.equal(triage('Nginx', 'headers', 'server', 'nginx(?:/([\\d.]+))?\\;version:\\1').verdict, 'credible')
})

test('a generic js global is suspect even though it is long enough', () => {
    const result = triage('Acme Shop', 'js', 'config', '')

    assert.equal(result.verdict, 'suspect')
    assert.match(result.reasons.join(' '), /generic/)
})

test('a short html literal is suspect', () => {
    const result = triage('Acme Shop', 'html', null, '<b')

    assert.equal(result.verdict, 'suspect')
    assert.match(result.reasons.join(' '), /short/)
})

test('a weak alternative makes the whole pattern suspect', () => {
    assert.equal(triage('Shopify', 'html', null, 'shopify-section|cart').verdict, 'suspect')
})

test('a url pattern that fires on the control corpus is suspect', () => {
    const result = triage('Acme Analytics', 'url', null, '/api/v1/')

    assert.equal(result.verdict, 'suspect')
    assert.match(result.reasons.join(' '), /control/)
})

test('dom: generic selector is suspect, vendor attribute selector is credible', () => {
    assert.equal(triage('Acme Shop', 'dom', null, '.cart').verdict, 'suspect')
    assert.equal(triage('Elementor', 'dom', null, '[data-elementor-type]').verdict, 'credible')
})

test('a distinctive literal without the vendor name is left unclear', () => {
    const result = triage('Acme Chat', 'scriptSrc', null, '/static/js/livewidget-loader\\.min\\.js')

    assert.equal(result.verdict, 'unclear')
})

test('a low-confidence pattern is never credible on its own', () => {
    const result = triage('Shopify', 'js', 'Shopify', '\\;confidence:25')

    assert.equal(result.verdict, 'unclear')
    assert.match(result.reasons.join(' '), /confidence 25/)
})

test('a vendor name that is itself a generic word does not make a pattern credible', () => {
    // "Cart Functionality" yields no vendor token, so `.cart` cannot vouch for it.
    assert.equal(triage('Cart Functionality', 'dom', null, '.cart').verdict, 'suspect')
})

test('a vendor hostname is distinctive even when its words are generic', () => {
    // `hs-scripts.com` is HubSpot's own domain; `scripts` and `com` alone are not.
    assert.notEqual(triage('HubSpot', 'scriptSrc', null, '\\.hs-scripts\\.com/').verdict, 'suspect')
    assert.notEqual(triage('Bunny', 'dom', null, "[src*='.b-cdn.net']").verdict, 'suspect')
})

test('every required literal counts, not only the longest one', () => {
    const result = triage('PrestaShop', 'html', null, 'Powered by <a\\s+[^>]+>PrestaShop')

    assert.equal(result.verdict, 'credible')
})

test('a short vendor name counts as a whole word in a key', () => {
    assert.equal(triage('Vue.js', 'js', 'Vue.version', '^(.+)$\\;version:\\1').verdict, 'credible')
    assert.equal(triage('AMP', 'js', 'AMP_CONFIG', '').verdict, 'credible')
    assert.equal(triage('IIS', 'headers', 'Server', '^(?:Microsoft-)?IIS(?:/([\\d.]+))?\\;version:\\1').verdict, 'credible')
    // ...but not as a fragment of a longer word.
    assert.notEqual(triage('Vue.js', 'js', 'revue', '').verdict, 'credible')
})

test('a short vendor name alone is still too short for a flat pattern', () => {
    assert.equal(triage('WOW', 'scriptSrc', null, 'wow(?:\\.min)?\\.js').verdict, 'suspect')
})

test('naming only a vendor shared with other technologies is not credible', () => {
    // "Shopify" names the platform, not the Basic plan: the pattern cannot tell
    // Shopify Basic from Shopify Plus.
    const tokenOwners = new Map([['shopify', 4], ['shopifybasic', 1], ['basic', 1]])
    const result = triagePattern({
        technology: 'Shopify Basic',
        entry: {},
        channel: 'js',
        key: 'Shopify',
        value: '',
        tokenOwners,
    })

    assert.equal(result.verdict, 'unclear')
    assert.match(result.reasons.join(' '), /shared with 4 technologies/)
})

test('a shared token is credible for the technology it exactly names', () => {
    // Webflow shares "webflow" with its add-ons, but a pattern naming Webflow
    // is evidence of Webflow itself.
    const result = triagePattern({
        technology: 'Webflow',
        entry: {},
        channel: 'js',
        key: 'Webflow',
        value: '',
        tokenOwners: new Map([['webflow', 4]]),
    })

    assert.equal(result.verdict, 'credible')
})

test('a pattern wholly wrapped in a group is read inside the group', () => {
    assert.equal(literalStrength('(flvplayer|flvplayer\\.swf)').longest, 'flvplayer')
    assert.equal(literalStrength('(?:<link href="x\\.css|<a class="lightbox)').longest, '<link href="x.css')
    // A group followed by a quantifier is optional and stays unread.
    assert.equal(literalStrength('(?:abcd)?').longest, '')
})

test('a token unique to the technology stays credible next to shared ones', () => {
    const tokenOwners = new Map([['google', 40], ['googlemaps', 1], ['maps', 2]])
    const result = triagePattern({
        technology: 'Google Maps',
        entry: {},
        channel: 'scriptSrc',
        key: null,
        value: 'maps\\.google(?:apis)?\\.com/maps/api/js',
        tokenOwners,
    })

    assert.equal(result.verdict, 'unclear')

    const specific = triagePattern({
        technology: 'Google Maps',
        entry: {},
        channel: 'js',
        key: 'googleMapsLoader',
        value: '',
        tokenOwners,
    })

    assert.equal(specific.verdict, 'credible')
})

test('buildTokenOwners counts how many technologies claim each token', () => {
    const owners = buildTokenOwners({
        Shopify: { website: 'https://www.shopify.com' },
        'Shopify Plus': { website: 'https://www.shopify.com/plus' },
        Elementor: {},
    })

    assert.equal(owners.get('shopify'), 2)
    assert.equal(owners.get('shopifyplus'), 1)
    assert.equal(owners.get('elementor'), 1)
})

test('extractPatterns flattens every channel shape into one unit per pattern', () => {
    const units = extractPatterns('Shopify', {
        scriptSrc: ['cdn\\.shopify\\.com', 'sdks\\.shopifycdn\\.com'],
        html: 'shopify-section',
        js: { Shopify: '\\;confidence:25', ShopifyAnalytics: '' },
        headers: { 'x-shopify-stage': '' },
        meta: { 'shopify-digital-wallet': ['', 'x'] },
        dom: {
            "link[href*='shopify.com']": {
                attributes: { href: '(?:cdn\\.|\\.my)shopify\\.com' },
            },
        },
        cats: [6],
        implies: ['React'],
    })

    const summary = units.map(({ channel, key, value }) => `${channel}|${key ?? ''}|${value}`)

    assert.deepEqual(summary.sort(), [
        "dom|link[href*='shopify.com']|(?:cdn\\.|\\.my)shopify\\.com",
        'headers|x-shopify-stage|',
        'html||shopify-section',
        'js|ShopifyAnalytics|',
        'js|Shopify|\\;confidence:25',
        'meta|shopify-digital-wallet|',
        'meta|shopify-digital-wallet|x',
        'scriptSrc||cdn\\.shopify\\.com',
        'scriptSrc||sdks\\.shopifycdn\\.com',
    ])
})

test('extractPatterns handles dom selector lists and selector-only rules', () => {
    const units = extractPatterns('Elementor', {
        dom: ["link[href*='/wp-content/plugins/elementor/']", '[data-elementor-type]'],
    })

    assert.deepEqual(units.map(({ key, value }) => [key, value]), [
        [null, "link[href*='/wp-content/plugins/elementor/']"],
        [null, '[data-elementor-type]'],
    ])
})
