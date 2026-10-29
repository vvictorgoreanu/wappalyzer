'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { basicsFrom, buildReport, renderMarkdown } = require('../scripts/lib/stacklookup-report')

const evidence = (extra = {}) => ({
    channel: 'scripts', key: null, regex: 'bkr', matchedText: 'BkR', context: 'xxBkRxx',
    credible: false, unreviewed: false, reason: 'too-broad', ...extra,
})
const summaryItem = (technology, weightedSuspects, counts = {}) => ({
    technology, claims: 1, counts: { 'suspect-pattern': 0, 'not-detected': 0, ...counts },
    suspects: (counts['suspect-pattern'] || 0) + (counts['not-detected'] || 0),
    verifiable: 1, liveCompanies: 10, suspectRate: 1, weightedSuspects,
})

test('only catalog rows marked not countable are basics, matched by name or key', () => {
    const basics = basicsFrom([
        { name: 'HSTS', key_norm: 'hsts', is_countable: 'False' },
        { name: 'HTTP/2', key_norm: 'http2', is_countable: 'False' },
        { name: 'React', key_norm: 'react', is_countable: 'True' },
        { name: 'Unknown', key_norm: 'unknown', is_countable: '' },
    ])
    assert.equal(basics.has('HSTS'), true)
    assert.equal(basics.has('http/2'), true)
    assert.equal(basics.has('HTTP-2'), true)
    assert.equal(basics.has('React'), false)
    assert.equal(basics.has('Unknown'), false)
})

test('suspect evidence is grouped by the pattern that matched, credible evidence left out', () => {
    const rows = ['a.com', 'b.com', 'c.com', 'd.com'].map((domain) => ({
        domain, technology: 'BlueKai', verdict: 'suspect-pattern',
        evidence: [evidence({ matchedText: `BkR-${domain}` })],
    }))
    rows.push({
        domain: 'e.com', technology: 'BlueKai', verdict: 'suspect-pattern',
        evidence: [evidence({ channel: 'js', key: 'bk_core', regex: '', credible: false, reason: 'unclear' }),
            evidence({ channel: 'html', regex: 'bluekai', credible: true, reason: 'credible' })],
    })
    rows.push({ domain: 'f.com', technology: 'BlueKai', verdict: 'confirmed', evidence: [evidence({ credible: true })] })
    const report = buildReport({ rows, summary: [summaryItem('BlueKai', 50, { 'suspect-pattern': 5 })] }, { examples: 3 })

    const [blueKai] = report.technologies
    assert.deepEqual(blueKai.patterns.map(({ channel, key, regex, hosts }) => [channel, key, regex, hosts]),
        [['scripts', null, 'bkr', 4], ['js', 'bk_core', '', 1]])
    assert.deepEqual(blueKai.patterns[0].examples.map(({ domain }) => domain), ['a.com', 'b.com', 'c.com'])
    assert.equal(blueKai.patterns[0].examples[0].matchedText, 'BkR-a.com')
    assert.equal(blueKai.patterns[0].reason, 'too-broad')
})

test('technologies are ordered by weighted suspects and those without suspects are dropped', () => {
    const report = buildReport({
        rows: [],
        summary: [
            summaryItem('Small', 5, { 'suspect-pattern': 1 }),
            summaryItem('Clean', 0),
            summaryItem('Big', 900, { 'not-detected': 2 }),
        ],
    })
    assert.deepEqual(report.technologies.map(({ technology }) => technology), ['Big', 'Small'])
})

test('missed detections keep their examples and how many source matches explain them', () => {
    const rows = [
        { domain: 'a.com', technology: 'Apache', verdict: 'not-detected', sourceMatches: [] },
        { domain: 'b.com', technology: 'Apache', verdict: 'not-detected',
            sourceMatches: [{ channel: 'headers', key: 'server', regex: 'apache', matchedText: 'Apache' }] },
    ]
    const [apache] = buildReport({ rows, summary: [summaryItem('Apache', 2, { 'not-detected': 2 })] }).technologies
    assert.deepEqual(apache.missed.map(({ domain, sourceMatches }) => [domain, sourceMatches.length]),
        [['a.com', 0], ['b.com', 1]])
})

test('unreviewed claims split into basics and real technologies, largest first', () => {
    const rows = [
        { domain: 'a.com', technology: 'HSTS', verdict: 'unreviewed', evidence: [] },
        { domain: 'b.com', technology: 'HSTS', verdict: 'unreviewed', evidence: [] },
        { domain: 'a.com', technology: 'Niche CMS', verdict: 'unreviewed', evidence: [evidence({ unreviewed: true, reason: 'No pattern review; needs evidence' })] },
        { domain: 'a.com', technology: 'Other', verdict: 'unreviewed', evidence: [] },
        { domain: 'b.com', technology: 'Other', verdict: 'unreviewed', evidence: [] },
        { domain: 'c.com', technology: 'Other', verdict: 'unreviewed', evidence: [] },
        { domain: 'a.com', technology: 'React', verdict: 'confirmed', evidence: [] },
    ]
    const { unreviewed } = buildReport({ rows, summary: [] }, { basics: new Set(['hsts']) })
    assert.equal(unreviewed.basics.claims, 2)
    assert.deepEqual(unreviewed.basics.technologies, [{ technology: 'HSTS', claims: 2 }])
    assert.equal(unreviewed.real.claims, 4)
    assert.deepEqual(unreviewed.real.technologies, [{ technology: 'Other', claims: 3 }, { technology: 'Niche CMS', claims: 1 }])
})

test('without a basics list every unreviewed claim is reported as real, and says so', () => {
    const rows = [{ domain: 'a.com', technology: 'HSTS', verdict: 'unreviewed', evidence: [] }]
    const report = buildReport({ rows, summary: [] })
    assert.equal(report.unreviewed.basicsKnown, false)
    assert.equal(report.unreviewed.real.claims, 1)
    assert.match(renderMarkdown(report), /No StackLookup catalog/)
})

test('markdown keeps table cells and code spans intact and shortens long page text', () => {
    const rows = [{
        domain: 'a.com', technology: 'Od|d', verdict: 'suspect-pattern',
        evidence: [evidence({ regex: 'a`b|c', matchedText: `x|y\n${'z'.repeat(500)}` })],
    }]
    const markdown = renderMarkdown(buildReport({ rows, summary: [summaryItem('Od|d', 1, { 'suspect-pattern': 1 })] }))
    assert.match(markdown, /\| Od\\\|d \|/)
    assert.match(markdown, /`` a`b\\\|c ``/)
    assert.doesNotMatch(markdown, /z{201}/)
    assert.doesNotMatch(markdown, /x\|y\n/)
})

test('the CLI writes the report into data/ and splits basics with the given catalog', () => {
    const fs = require('fs')
    const os = require('os')
    const path = require('path')
    const { main } = require('../scripts/stacklookup-report')
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stacklookup-report-'))
    fs.mkdirSync(path.join(root, 'data'))
    fs.writeFileSync(path.join(root, 'data/stacklookup-audit.json'), JSON.stringify({
        rows: [{ domain: 'a.com', technology: 'HSTS', verdict: 'unreviewed', evidence: [] }], summary: [],
    }))
    const catalog = path.join(root, 'technology_v0.csv')
    fs.writeFileSync(catalog, 'name,key_norm,is_countable\nHSTS,hsts,False\n')
    const logs = []
    const report = main(['--catalog', catalog], { root, log: (line) => logs.push(line) })
    assert.equal(report.unreviewed.basics.claims, 1)
    assert.match(fs.readFileSync(path.join(root, 'data/stacklookup-report.md'), 'utf8'), /- HSTS: 1/)
    assert.throws(() => main(['--catalog', path.join(root, 'missing.csv')], { root, log() {} }), /not found/)
    fs.rmSync(root, { recursive: true, force: true })
})
