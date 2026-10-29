'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { slug, proposeFromSecondPass, buildRecord, renderRecord, keptArgument } = require('../scripts/lib/stacklookup-decision')
const { summarizeReplay } = require('../scripts/lib/stacklookup-replay')

const NAME = 'IBM WebSphere Application Server'
const definition = {
    cats: [22],
    headers: { 'X-Powered-By': '^Servlet/\\d{2}\\.\\d{2}$|PHP/?', Server: '^(?:IBM )?HTTP Server/\\d+' },
    meta: { generator: '^(?:IBM )?WebSphere Application Server$' },
    html: '<!-- Created by IBM -->|[\\w\\s]+IBM',
}
const reviews = [
    { id: 78, technology: NAME, liveCompanies: 13169943, channel: 'headers', key: 'X-Powered-By', pattern: definition.headers['X-Powered-By'], verdict: 'suspect', reasons: ['generic key'], review: { verdict: 'wrong', why: 'PHP is not WebSphere.', fix: null } },
    { id: 79, technology: NAME, liveCompanies: 13169943, channel: 'headers', key: 'Server', pattern: definition.headers.Server, verdict: 'suspect', reasons: [], review: { verdict: 'wrong', why: 'IBM HTTP Server is another product.', fix: null } },
    { id: 80, technology: NAME, liveCompanies: 13169943, channel: 'html', key: null, pattern: definition.html, verdict: 'suspect', reasons: ['short literal "IBM"'], review: { verdict: 'too-broad', why: 'Any IBM mention matches.', fix: null } },
    { id: 81, technology: NAME, liveCompanies: 13169943, channel: 'meta', key: 'generator', pattern: definition.meta.generator, verdict: 'unclear', reasons: [], review: { verdict: 'credible', why: 'Names the product.', fix: null } },
]
const answers = [
    { id: 78, verdict: 'confirm', why: 'PHP banner.', action: 'remove', fix: '', shouldMatch: '', shouldNotMatch: 'PHP/8.3.12' },
    { id: 79, verdict: 'confirm', why: 'Separate product.', action: 'remove', fix: '', shouldMatch: '', shouldNotMatch: 'IBM HTTP Server/9.0.5' },
    { id: 80, verdict: 'confirm', why: 'Require the full name.', action: 'narrow', fix: '\\bIBM\\s+WebSphere\\s+Application\\s+Server\\b', shouldMatch: '<title>IBM WebSphere Application Server</title>', shouldNotMatch: '<p>Our company partners with IBM</p>' },
]
const htmlEvidence = (matchedText) => ({ channel: 'html', key: null, regex: '<!-- Created by IBM -->|[\\w\\s]{1,250}IBM', matchedText, context: `data:image/png;base64,${matchedText}`, credible: false, reason: 'too-broad' })
const rows = [
    { domain: 'a.com', technology: NAME, verdict: 'suspect-pattern', evidence: [htmlEvidence('AAibm')] },
    { domain: 'b.com', technology: NAME, verdict: 'suspect-pattern', evidence: [htmlEvidence('BBibm'), { channel: 'headers', key: 'x-powered-by', regex: '^Servlet\\/\\d{2}\\.\\d{2}$|PHP\\/?', matchedText: 'PHP/', context: 'PHP/8.1', credible: false, reason: 'wrong' }] },
    // Extended driver output can omit the header name.
    { domain: 'f.com', technology: NAME, verdict: 'suspect-pattern', evidence: [{ channel: 'headers', key: null, regex: '^Servlet\\/\\d{2}\\.\\d{2}$|PHP\\/?', matchedText: 'PHP/', context: 'PHP/7.4', credible: false, reason: 'wrong' }] },
    { domain: 'c.com', technology: NAME, verdict: 'not-detected', sourceMatches: [] },
    { domain: 'd.com', technology: NAME, verdict: 'unverifiable', reason: 'HTTP 403' },
    { domain: 'e.com', technology: NAME, verdict: 'unverifiable', reason: 'HTTP 403' },
    { domain: 'g.com', technology: NAME, verdict: 'unverifiable', reason: 'Hostname could not be resolved (g.com)' },
    { domain: 'h.com', technology: NAME, verdict: 'unverifiable', reason: 'Hostname could not be resolved (h.com)' },
]

test('a record file is named after its technology', () => {
    assert.equal(slug(NAME), 'ibm-websphere-application-server')
    assert.equal(slug('Google Campaign Manager 360'), 'google-campaign-manager-360')
})

test("Codex's second-pass actions are applied to a copy of the definition", () => {
    const proposed = proposeFromSecondPass(definition, reviews, answers)
    assert.deepEqual(proposed.headers, undefined)
    assert.equal(proposed.html, '\\bIBM\\s+WebSphere\\s+Application\\s+Server\\b')
    assert.deepEqual(proposed.meta, definition.meta)
    assert.equal(definition.headers.Server, '^(?:IBM )?HTTP Server/\\d+')
})

test('overturned and evidence-pending rules stay as they are; a lowered confidence replaces the rule', () => {
    const own = { scriptSrc: ['a\\.js', 'b\\.js'], js: { x: '' } }
    const ownReviews = [
        { id: 1, technology: 'X', channel: 'scriptSrc', key: null, pattern: 'a\\.js' },
        { id: 2, technology: 'X', channel: 'scriptSrc', key: null, pattern: 'b\\.js' },
        { id: 3, technology: 'X', channel: 'js', key: 'x', pattern: '' },
    ]
    const proposed = proposeFromSecondPass(own, ownReviews, [
        { id: 1, verdict: 'overturn', action: 'none' },
        { id: 2, verdict: 'confirm', action: 'lower-confidence', fix: 'b\\.js\\;confidence:25' },
        { id: 3, verdict: 'needs-evidence', action: 'remove' },
    ])
    assert.deepEqual(proposed, { scriptSrc: ['a\\.js', 'b\\.js\\;confidence:25'], js: { x: '' } })
})

test('the record ties every audit match to the rule that made it', () => {
    const proposed = proposeFromSecondPass(definition, reviews, answers)
    const replay = summarizeReplay(NAME, [{ host: 'a.com', claim: 'suspect-pattern', before: [{ type: 'html', key: null, match: 'AAibm' }], after: [] }])
    const record = buildRecord({ technology: NAME, definition, proposed, source: 'second pass', rows, reviews, answers, replay })
    assert.equal(record.counts['suspect-pattern'], 3)
    assert.equal(record.suspectRate, 1)
    assert.equal(record.liveCompanies, 13169943)
    const html = record.rules.find(({ channel }) => channel === 'html')
    assert.deepEqual(html.hosts, { 'suspect-pattern': 2 })
    assert.deepEqual(html.examples.map(({ host, matchedText }) => [host, matchedText]), [['a.com', 'AAibm'], ['b.com', 'BBibm']])
    assert.equal(html.secondPass.action, 'narrow')
    const powered = record.rules.find(({ key }) => key === 'X-Powered-By')
    assert.deepEqual(powered.hosts, { 'suspect-pattern': 2 })
    assert.deepEqual(record.rules.find(({ key }) => key === 'generator').hosts, {})
    assert.deepEqual(record.missed.map(({ host }) => host), ['c.com'])
    assert.deepEqual(record.unverifiable, [{ reason: 'HTTP 403', hosts: 2 }, { reason: 'Hostname could not be resolved', hosts: 2 }])
    assert.deepEqual(record.changes.removed.map(({ channel, key }) => [channel, key]), [['headers', 'X-Powered-By'], ['headers', 'Server'], ['html', null]])
    assert.deepEqual(record.changes.added.map(({ pattern }) => pattern), ['\\bIBM\\s+WebSphere\\s+Application\\s+Server\\b'])
})

test('the rendered record keeps the hand-written argument and shows how to check a match', () => {
    const proposed = proposeFromSecondPass(definition, reviews, answers)
    const replay = summarizeReplay(NAME, [{ host: 'a.com', claim: 'suspect-pattern', before: [{ type: 'html', key: null, match: 'AAibm' }], after: [] }])
    const record = buildRecord({ technology: NAME, definition, proposed, source: 'second pass', rows, reviews, answers, replay })
    const fresh = renderRecord(record)
    assert.match(fresh, /<!-- decision:start -->[\s\S]*To be written[\s\S]*<!-- decision:end -->/)
    assert.match(fresh, /AAibm/)
    assert.match(fresh, /PHP is not WebSphere\./)
    assert.match(fresh, /shouldNotMatch: `PHP\/8\.3\.12`/)
    assert.match(fresh, /--show [a-z]\.com/)
    assert.match(fresh, /1 lost, 0 added, 0 kept/)
    const argument = '<!-- decision:start -->\n## Decision\n\nChange it: the base64 favicon.\n<!-- decision:end -->'
    const edited = fresh.replace(/<!-- decision:start -->[\s\S]*<!-- decision:end -->/, argument)
    assert.equal(keptArgument(edited), argument)
    const again = renderRecord(record, keptArgument(edited))
    assert.ok(again.includes(argument))
    assert.doesNotMatch(again, /To be written/)
})

test('the CLI writes the record and keeps the argument across runs', () => {
    const { main } = require('../scripts/stacklookup-decision')
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stacklookup-decision-'))
    fs.mkdirSync(path.join(root, 'technologies'))
    fs.mkdirSync(path.join(root, 'data/stacklookup-scans'), { recursive: true })
    fs.mkdirSync(path.join(root, 'data/pattern-review'), { recursive: true })
    fs.writeFileSync(path.join(root, 'technologies/i.json'), JSON.stringify({ [NAME]: definition }))
    fs.writeFileSync(path.join(root, 'data/pattern-review/merged.json'), JSON.stringify(reviews))
    fs.writeFileSync(path.join(root, 'data/pattern-review/second-pass-answers-001.jsonl'), answers.map((item) => JSON.stringify(item)).join('\n'))
    fs.writeFileSync(path.join(root, 'data/stacklookup-audit.json'), JSON.stringify({ rows }))
    fs.writeFileSync(path.join(root, 'data/stacklookup-scans/a.com.json'), JSON.stringify({
        status: 200, finalUrl: 'https://a.com/', html: '<img src="data:image/png;base64,AAibm">', text: '',
        headers: {}, cookies: {}, meta: {}, scriptSrc: [], scripts: [], patterns: {},
    }))
    const logs = []
    const options = { root, log: (line) => logs.push(line), readBase: () => ({ [NAME]: definition }) }
    main([NAME], options)
    const file = path.join(root, 'data/decisions/ibm-websphere-application-server.md')
    assert.match(fs.readFileSync(file, 'utf8'), /Detected on 1 hosts before, 0 after/)
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('To be written', 'Change it.'))
    main([NAME.toLowerCase()], options)
    assert.match(fs.readFileSync(file, 'utf8'), /Change it\./)

    logs.length = 0
    main([NAME, '--show', 'a.com'], options)
    assert.ok(logs.some((line) => /html: AAibm/.test(line)))
    assert.throws(() => main([NAME, '--show', '../etc/passwd'], options), /Invalid host/)
    assert.throws(() => main(['No Such Tech'], options), /not in the catalog/)
    fs.rmSync(root, { recursive: true, force: true })
})
