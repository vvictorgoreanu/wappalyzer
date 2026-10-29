# StackLookup false-positive audit — plan

## Goal

For every `(domain, technology)` that StackLookup reports, decide whether the
technology is really on that domain. When it is not, name the cause, so a
wrong fingerprint can be fixed. Technologies we miss (false negatives) are out
of scope.

A re-detection with the same regex is not proof: a too-broad regex fires again
on the same page. So each claim is judged on the evidence behind it, not on
whether it repeats. And since the point is that the regexes are right going
forward, the unit of review is the **pattern**, not the domain: every pattern
of the top-500 technologies gets a written credibility verdict, and every
pattern that fires on a sampled page is checked against the text it matched.

## Two tracks

**A. Static review of every pattern (no network).** The top-500 technologies
have 1,631 patterns: js 521, scriptSrc 330, dom 222, headers 165, html 92,
cookies 75, dns 63, meta 46, scripts 44, css 28, the rest under 15 each.
Each gets a verdict — `credible`, `too-broad`, `wrong`, `needs-evidence` —
with a one-line reason. Criteria, per channel:

- `scriptSrc` / `url` / `xhr`: anchored to a vendor hostname or a vendor-unique
  path, not a generic path fragment (`/cart.js`, `/api/`).
- `js`: the global is vendor-unique (`Shopify.theme`), not a common word
  (`app`, `config`, `$`).
- `dom` / `css`: the selector is vendor-unique (`[data-elementor-type]`), not a
  generic class (`.cart`, `.slider`).
- `headers` / `cookies`: vendor-specific name or value, not `server: nginx`
  standing in for something else, nor a generic `session` cookie.
- `html` / `scripts` / `text`: a distinctive literal, not a short or common
  word that can appear in page copy.
- `meta`: `generator` values matched as names, not substrings of other names.
- `implies`: true by construction (WooCommerce → WordPress), not just common
  (WordPress → MySQL is a guess; MariaDB and hosted DBs exist). Implied
  technologies are flagged as inferred, not detected.

Mechanical checks run first (literal length, anchoring, a dictionary of
generic words, firing on the control corpus in `scripts/lib/control-corpus.js`);
then each pattern is read and judged, the mechanical result attached.

**B. Evidence from real pages (the sample domains).** For each StackLookup
claim, rescan the page and keep, per detection: channel, regex, matched text,
and context around the match (≈200 characters of HTML, the full script URL,
the full header or cookie). Detections are grouped by pattern, so a pattern
that fired on 40 domains is reviewed once with its 40 matched texts side by
side. A match on text that is plainly not the vendor (a word in an article, a
look-alike path, a different product's file) makes the pattern `too-broad`, and
that page snippet becomes the regression fixture for its fix.

## Inputs (all local-only, gitignored)

- `data/stacklookup-sample-part*.csv` — Zeppelin exports from
  `cassandraEkg.web.technologies`, latest crawl per `(root_domain, domain)`.
  Columns: `root_domain, domain, time, crawls[, crawler_domain], technologies[, categories]`.
  `technologies` is `|`-separated, lowercase, may repeat a name.
- Part 1 is in (147 domains, up to `bwalog.com.br`); parts 2–6 (854 domains)
  wait on Zeppelin access.
- `data/stacklookup-top-500-technologies-*.csv` — used to rank technologies by
  how many companies a false positive would affect.

## Facts established so far

- The `wappalyzer` struct stores only `unique_key` (category) and `value`
  (name). `raw_value`, `type`, `score`, `version` are null, so StackLookup
  keeps no evidence of what matched; the evidence has to be regenerated.
- 413 of 418 distinct names in part 1 map to a catalog name by lowercase.
  Unmapped: `microsoft exchange online`, `microsoft intune`,
  `microsoft entra id`, `valimail`, and one empty value. These are not in our
  catalog at all, so StackLookup's crawler has rules this repo does not.
- `web.technologies` is filled by a separate crawler, `soleadify-wappalyzer-ts`
  (`stack-lookup-app/docs/specs/07-architecture-rollout.md`), which records no
  detector version per row. `stack-lookup-app/live-scan` pins
  `mihneamanolache/wappalyzer#a5dbe94`, which is `main` here.
- `node cli.js <url> --extended` returns, per detection, the channel, regex,
  matched value, confidence and `implies` chain.
- Scanning works with system Chrome via `CHROMIUM_BIN`, but not inside the
  Claude sandbox; scans run unsandboxed or from the user's terminal.
- Smoke test, `1021petsltd.shop`: StackLookup reports `cloudflare`; the page
  now returns 404 and our scan does not detect Cloudflare.

## Verdict per claimed `(domain, technology)`

| Verdict | Meaning | Cause it points to |
| --- | --- | --- |
| `confirmed` | Detected now by a pattern reviewed `credible`, and the matched text is the vendor's | none |
| `suspect-pattern` | Detected now, but by a pattern reviewed `too-broad`/`wrong`, or the matched text is not the vendor's | the regex → fix candidate |
| `implied-only` | Not seen directly; present only because another technology implies it (e.g. MySQL from WordPress) | the `implies` rule, or the technology that implies it |
| `not-detected` | Page loads fine and nothing fires for it now | stale row, or a rule the crawler has and we lack; the page's HTML, headers and script URLs are searched for the technology's patterns to tell which |
| `not-in-catalog` | No catalog entry with that name | crawler-only rule (DNS-based, likely) |
| `unverifiable` | Page errors, times out, is parked or returns non-2xx | none; excluded from rates |

Every `suspect-pattern` row carries the regex, matched text and context, so a
person can check the call in seconds.

## Steps

0. **Static pattern review (track A) — `scripts/pattern-review.js` +
   `docs/ai/stacklookup-compare/pattern-review.json`.** Extract the 1,631
   patterns, run the mechanical checks, then review in batches by channel and
   record verdict + reason per pattern. The review file names patterns only, no
   customer domains. You spot-check a random 5 % of `credible` verdicts and all
   `too-broad`/`wrong` ones before anything is fixed.
   Verify: every pattern has a verdict; mechanical checks have unit tests.

1. **Pure helpers — `scripts/lib/stacklookup.js`.** Parse the export CSV (BOM,
   quoted fields; a truncated last row is dropped and reported), dedupe names,
   map names to the catalog, and assign the verdict above from a scan result.
   Verify: `test/stacklookup.test.js` with fixture rows and fixture scan
   results covering every verdict; `npm run test:unit`.

2. **Scanner with cache — `scripts/stacklookup-audit.js`.** For each domain,
   run the driver with `extended: true` and the flags from
   `stack-lookup-app`'s measurement design (`-p full -w 15000 -N`), one page per
   host, small concurrency. Store the result plus the page's final URL, status,
   response headers and HTML in `data/stacklookup-scans/<domain>.json`, so
   verdicts and the `not-detected` source search rerun offline. `--check`
   reports from the cache without network.
   Verify: run on the 147 part-1 domains; each has a cache file or a stated
   error.

3. **Report — `data/stacklookup-audit.json` + `docs/ai/stacklookup-compare/report.md`.**
   Per technology: number of claims, count per verdict, false-positive-suspect
   rate (`suspect-pattern` + `not-detected` over verifiable claims), and the
   example domains with regex and matched text. Ranked by suspects weighted by
   the technology's `live_companies` from the top-500 file.
   Verify: hand-check 10 rows (5 `suspect-pattern`, 5 `not-detected`) against
   the live page and note the outcome in the report.

4. **Gitignore and wiring.** Add `data/stacklookup-scans/` and
   `data/stacklookup-audit.json` to `.gitignore`; register them in
   `scripts/lib/untracked.js`; add `npm run audit:stacklookup`.
   Verify: `git status` shows no data files; `npm test` passes.

## Later, not in this change

- One fix PR per confirmed broad regex, each with a test reproducing the false
  positive first.
- Ask the owner of `soleadify-wappalyzer-ts` which fork commit it runs, and
  for the `not-in-catalog` rules' source.
- Rerun on parts 2–6 once Zeppelin is back.

## Progress

- [x] 0a mechanical triage — `npm run triage:patterns`
      (`scripts/pattern-triage.js`, rules in `scripts/lib/pattern-triage.js`,
      27 tests). Top 500 on 2026-10-29: 1,641 patterns — credible 917,
      suspect 107, unclear 617 (319 distinctive but not naming the vendor, 282
      naming only a parent brand shared with other technologies, 16 below
      full confidence).
- [ ] 0b review of the 724 suspect + unclear patterns, done in ChatGPT to save
      Claude usage: `data/pattern-review/batch-001..005.jsonl` with
      `chatgpt-review-prompt.md`; answers go to `answers-NNN.jsonl`, then a
      small importer merges them and lists `too-broad`/`wrong` for your check
- [ ] 0c spot-check: you review a random 5 % of `credible` and every
      `too-broad`/`wrong`
- [ ] 1 helpers + tests
- [ ] 2 scanner + cache
- [ ] 3 report
- [ ] 4 gitignore, untracked.js, npm script
