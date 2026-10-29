# Pattern review prompt (for ChatGPT or another model)

Paste the prompt below, then the contents of one
`data/pattern-review/batch-NNN.jsonl` file. Save the reply as
`data/pattern-review/answers-NNN.jsonl` (same number).

The batches come from `npm run triage:patterns`. They hold only the patterns
the mechanical triage could not settle: `suspect` ones first, then `unclear`,
each ordered by how many companies the technology covers.

---

You are reviewing fingerprint patterns from a Wappalyzer-style technology
detector. Each pattern is evidence that a website uses a given technology. A
pattern that is not specific to that technology produces false positives on
websites that do not use it. Your job is to judge each pattern's credibility.

Each input line is JSON:

- `technology`, `website`: what the pattern claims to detect.
- `channel`: where the pattern is matched —
  `scriptSrc` (URL of each `<script src>`), `html` (raw page HTML),
  `scripts` (inline and external script bodies), `js` (a global JavaScript
  property path that exists on the page; `pattern` matches its value, empty
  means "exists"), `dom` (a CSS selector; with `key`, `key` is the selector and
  `pattern` matches an attribute, property or text), `headers` / `cookies` /
  `meta` (`key` is the header, cookie or meta name; `pattern` matches the value,
  empty means "present"), `dns` (`key` is the record type), `css` (stylesheet
  text), `url` (page URL), `xhr` (hostname of a request), `xhrUrl` (full URL of
  a request), `probe` (`key` is a path requested on the site).
- `pattern`: a JavaScript regex, case-insensitive. Text after `\;` is metadata:
  `\;version:\1` extracts a version, `\;confidence:N` gives a weight below 100.
- `triage`, `reason`: what a mechanical check said. It is a hint, not a
  verdict; it is often wrong in both directions.

For each line, answer with one JSON line, in the same order, and nothing else:

{"id": <same id>, "verdict": "credible" | "too-broad" | "wrong" | "needs-evidence", "why": "<one short sentence>", "fix": "<suggested replacement regex, or null>"}

Verdicts:

- `credible`: a site without this technology would essentially never match
  it. Vendor-owned hostnames, vendor-prefixed globals, cookies and headers,
  and product-specific file names are typical.
- `too-broad`: it can match sites that do not use the technology — a common
  word, a generic path (`/cart.js`), a generic global (`ga`, `config`), a
  header any server sends, a parent brand that does not identify this
  specific product or plan (e.g. a plain `Shopify` global for "Shopify Basic"),
  or a short alternative inside the regex.
- `wrong`: it identifies a different technology, or cannot match what the
  channel receives (for example a path in `xhr`, which only sees hostnames).
- `needs-evidence`: you cannot tell without seeing real pages.

Be strict: when in doubt between `credible` and `too-broad`, choose
`too-broad` or `needs-evidence`. Only propose a `fix` when you are confident it
keeps the true matches. Keep `why` under 25 words.
