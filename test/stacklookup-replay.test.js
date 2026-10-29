'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { changedTechnologies, replayHost, rescanChannels, summarizeReplay, renderReplay } = require('../scripts/lib/stacklookup-replay')

const record = (extra = {}) => ({
    status: 200, finalUrl: 'https://a.com/', html: '<html>favicon base64,AAibmAA</html>', text: '',
    headers: { 'x-powered-by': 'Next.js', server: 'Apache/2.4.1' }, cookies: {}, meta: {},
    scriptSrc: [], scripts: [], patterns: {}, technologies: [], ...extra,
})
const matches = (detections) => detections.map(({ type, key, match }) => [type, key, match])

test('only technologies whose definitions differ are replayed', () => {
    const before = { A: { headers: { Server: 'a' } }, B: { html: 'b' }, C: { html: 'c' } }
    const after = { A: { headers: { Server: 'a' } }, B: { html: 'b2' }, D: { html: 'd' } }
    assert.deepEqual(changedTechnologies(before, after), ['B', 'C', 'D'])
})

test('cached page channels are analyzed again with each definition', () => {
    const { before, after } = replayHost(record(), 'Schannel',
        { headers: { 'X-Powered-By': '.*(.*)' } },
        { headers: { 'X-Powered-By': 'ASP\\.NET' } })
    assert.deepEqual(matches(before), [['headers', 'x-powered-by', 'Next.js']])
    assert.deepEqual(after, [])
})

test('a narrower html regex drops a match inside base64 but keeps the real one', () => {
    const page = record({ html: '<img src="data:image/png;base64,AAibmAA"><p>IBM WebSphere Application Server</p>' })
    const { before, after } = replayHost(page, 'IBM WebSphere Application Server',
        { html: '[\\w\\s]+IBM' }, { html: '\\bIBM\\s+WebSphere\\s+Application\\s+Server\\b' })
    assert.equal(before.length, 1)
    assert.deepEqual(matches(after), [['html', null, 'IBM WebSphere Application Server']])
})

test('values only kept in stored detections (external scripts, js) are tested again', () => {
    const page = record({
        patterns: {
            Vendor: [
                { type: 'scripts', key: undefined, regex: 'fls.doubleclick.net', value: '// gtag "fls.doubleclick.net"', match: 'fls.doubleclick.net' },
                { type: 'js', key: 'vendor.version', regex: '^(.+)$', value: '1.2.3', match: '1.2.3' },
            ],
        },
    })
    const { before, after } = replayHost(page, 'Vendor',
        { scripts: 'fls.doubleclick.net', js: { 'vendor.version': '^(.+)$' } },
        { scripts: '^never$', js: { 'vendor.version': '^\\d+\\.\\d+\\.\\d+$' } })
    assert.deepEqual(matches(before), [['scripts', null, 'fls.doubleclick.net'], ['js', 'vendor.version', '1.2.3']])
    assert.deepEqual(matches(after), [['js', 'vendor.version', '1.2.3']])
})

test('DOM detections are carried over only while the DOM rules are unchanged', () => {
    const page = record({ patterns: { Vendor: [{ type: 'dom', key: '.vendor', regex: '(?:)', value: '', match: '' }] } })
    assert.equal(replayHost(page, 'Vendor', { dom: '.vendor' }, { dom: '.vendor', html: 'x' }).after.length, 1)
    assert.equal(replayHost(page, 'Vendor', { dom: '.vendor' }, { dom: '.vendor-new' }).after.length, 0)
})

test('channels whose new matches a cache cannot show are named for a rescan', () => {
    assert.deepEqual(rescanChannels(
        { html: 'a', js: { x: '' }, dom: '.a', scripts: 'a', headers: { Server: 'a' } },
        { html: 'b', js: { x: '', y: '' }, dom: '.b', scripts: 'b', headers: { Server: 'b' } },
    ), ['dom', 'js', 'scripts'])
    assert.deepEqual(rescanChannels({ js: { x: 'a' } }, { js: { x: 'b' } }), [])
})

test('the summary sorts hosts by what the claim was and what the fix did', () => {
    const detection = (match) => [{ type: 'headers', key: 'x-powered-by', match, regex: 'r' }]
    const summary = summarizeReplay('Schannel', [
        { host: 'a.com', claim: 'suspect-pattern', before: detection('Next.js'), after: [] },
        { host: 'b.com', claim: 'confirmed', before: detection('ASP.NET'), after: [] },
        { host: 'c.com', claim: null, before: detection('PHP'), after: [] },
        { host: 'd.com', claim: 'suspect-pattern', before: detection('x'), after: detection('x') },
        { host: 'e.com', claim: 'not-detected', before: [], after: detection('ASP.NET') },
        { host: 'f.com', claim: null, before: [], after: [] },
    ], ['js'])
    assert.equal(summary.hostsBefore, 4)
    assert.equal(summary.hostsAfter, 2)
    assert.deepEqual(summary.lost.map(({ host, claim }) => [host, claim]), [['b.com', 'confirmed'], ['a.com', 'suspect-pattern'], ['c.com', null]])
    assert.deepEqual(summary.kept.map(({ host }) => host), ['d.com'])
    assert.deepEqual(summary.added.map(({ host }) => host), ['e.com'])
    assert.deepEqual(summary.lostConfirmed, 1)
    assert.deepEqual(summary.rescan, ['js'])
})

test('the rendered replay warns about lost confirmed claims and shows matched text', () => {
    const detection = (match) => [{ type: 'headers', key: 'server', match, regex: 'r' }]
    const markdown = renderReplay([summarizeReplay('Apache HTTP Server', [
        { host: 'a.com', claim: 'confirmed', before: detection('Apache/2.4.1'), after: [] },
    ], ['scripts'])])
    assert.match(markdown, /## Apache HTTP Server/)
    assert.match(markdown, /1 confirmed claim lost/)
    assert.match(markdown, /a\.com/)
    assert.match(markdown, /Apache\/2\.4\.1/)
    assert.match(markdown, /Rescan needed for new matches in: scripts/)
})

test('the CLI replays changed technologies over loaded caches only', () => {
    const { main } = require('../scripts/stacklookup-replay')
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stacklookup-replay-'))
    fs.mkdirSync(path.join(root, 'technologies'))
    fs.mkdirSync(path.join(root, 'data/stacklookup-scans'), { recursive: true })
    fs.writeFileSync(path.join(root, 'technologies/s.json'), JSON.stringify({ Schannel: { headers: { 'X-Powered-By': 'ASP\\.NET' } } }))
    const write = (host, extra) => fs.writeFileSync(path.join(root, `data/stacklookup-scans/${host}.json`), JSON.stringify(record(extra)))
    write('a.com', {})
    write('b.com', { headers: { 'x-powered-by': 'ASP.NET' } })
    write('down.com', { error: 'Navigation timeout', status: null })
    fs.writeFileSync(path.join(root, 'data/stacklookup-audit.json'), JSON.stringify({
        rows: [{ domain: 'a.com', technology: 'Schannel', verdict: 'suspect-pattern' }],
    }))
    const logs = []
    const [summary] = main([], {
        root, log: (line) => logs.push(line),
        readBase: () => ({ Schannel: { headers: { 'X-Powered-By': '.*(.*)' } } }),
    })
    assert.equal(summary.hostsBefore, 3 - 1)
    assert.deepEqual(summary.lost.map(({ host, claim }) => [host, claim]), [['a.com', 'suspect-pattern']])
    assert.deepEqual(summary.kept.map(({ host }) => host), ['b.com'])
    assert.match(fs.readFileSync(path.join(root, 'data/stacklookup-replay.md'), 'utf8'), /## Schannel/)
    assert.ok(logs.some((line) => /Schannel: 2 → 1 hosts/.test(line)))
    fs.rmSync(root, { recursive: true, force: true })
})
