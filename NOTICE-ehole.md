# EHole attribution

This catalog includes technology detection rules derived from [EdgeSecurityTeam/EHole](https://github.com/EdgeSecurityTeam/EHole) at `9a91e0b3372537681d1b88a31cfab3d00620c1e5`, file `finger.json`, licensed under the Apache License, Version 2.0. A copy of that license is in `LICENSE-ehole`. EHole has no NOTICE file at that commit.

Modifications (Apache-2.0 section 4b):

- EHole keyword entries were converted to Wappalyzer-format `html`, `headers` and `cookies` patterns. Several keywords of one entry (all required) became one anchored lookahead pattern.
- Title keywords are matched inside `<title>`. Regex metacharacters are escaped, and quotes match either `"` or `'`.
- The engine matches case-insensitively, while EHole matches case-sensitively.
- The product names, websites and categories were added by the importer.

The selection evidence is in the StackLookup extension repository, `docs/ai/ehole-import/`.

| Technology | Signal | EHole cms | EHole location | EHole keywords |
| --- | --- | --- | --- | --- |
| CmsEasy | html | CmsEasy | body | `["content=\"CmsEasy"]` |
| DouPHP | html | DouPHP | body | `["Powered by DouPHP","DouPHP","theme"]` |
| YzmCMS | html | YzmCMS | body | `["YzmCMS","yzm-common.css"]` |
