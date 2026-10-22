# webappanalyzer attribution

This commit imports technology detection data from [enthec/webappanalyzer](https://github.com/enthec/webappanalyzer) at `d91f7e510e93457041bea874e8a9ffb011e3e4fe`, licensed GPL-3.0. The accompanying `LICENSE` is copied from that upstream commit.

Each row lists an imported technology, signal, and upstream source file. Original patterns and normalization notes are recorded in the extension repository at `docs/ai/competitor-rule-gap/findings/webappanalyzer-candidates.json`.

| Technology | Signal | Original pattern | Source file |
| --- | --- | --- | --- |
| 3Q | scripts | `"3qsdn\\.com"` | `src/technologies/_.json` |
| ACTV8 | js (a8MpParams) | `""` | `src/technologies/a.json` |
| AIDEM Technologies | scripts | `"//zero\\.aidemsrv\\.com/dist/prebid\\.js"` | `src/technologies/a.json` |
| AIDEM Technologies | scripts | `"stream\\.aidemsrv\\.com/lib/stream\\.js"` | `src/technologies/a.json` |
| AccessiWay | js (accessWidget.config.footerHtml) | `""` | `src/technologies/a.json` |
| Addingwell SST | html | `"\\.js\\?aw='.*?\\+.*?dl;"` | `src/technologies/a.json` |
| Admatic | scriptSrc | `"\\.admatic\\.com\\.tr/"` | `src/technologies/a.json` |
| Admatic | xhr | `"\\.admatic\\.(?:com\\.tr\|de\|io)"` | `src/technologies/a.json` |
| Adnuntius | scripts | `"cdn\\.adnuntius\\.com/adn\\.js"` | `src/technologies/a.json` |
| Adventive | scriptSrc | `"ads\\.adventive\\.com/"` | `src/technologies/a.json` |
| Adventive | xhr | `"ads\\.adventive\\.com"` | `src/technologies/a.json` |
| Adventive | dom (script[src*="ads.adventive.com/"]) | `"script[src*=\"ads.adventive.com/\"]"` | `src/technologies/a.json` |
| Adventive | dom (img[src*="ads.adventive.com/"]) | `"img[src*=\"ads.adventive.com/\"]"` | `src/technologies/a.json` |
| Adventive | dom (iframe[src*="ads.adventive.com/"]) | `"iframe[src*=\"ads.adventive.com/\"]"` | `src/technologies/a.json` |
| Advisible | scripts | `"//cdn\\.advisible\\.com"` | `src/technologies/a.json` |
| Altervista Platform | html | `"<a href=\"http://www.altervista.org\">Altervista</a>"` | `src/technologies/a.json` |
| ArtsAI | html | `"arttrk\\.com/pixel"` | `src/technologies/a.json` |
| ArtsAI | xhr | `"arttrk\\.com"` | `src/technologies/a.json` |
| ArtsAI | dom (img[src*="arttrk.com/pixel"]) | `"img[src*=\"arttrk.com/pixel\"]"` | `src/technologies/a.json` |
| Audion | scriptSrc | `"\\.360\\.audion\\.fm/"` | `src/technologies/a.json` |
| Audion | xhr | `"\\.audion\\.fm"` | `src/technologies/a.json` |
| Audion | dom (#audion360-podcast-player-init, .audion-reader) | `"#audion360-podcast-player-init, .audion-reader"` | `src/technologies/a.json` |
| Book Like A Boss | dom (a[href*='bookme.name']) | `"a[href*='bookme.name']"` | `src/technologies/b.json` |
| Cloudbac | headers (x-powered-by) | `"^Cloudbac$"` | `src/technologies/c.json` |
| Cloudbac | meta (generator) | `"^Cloudbac$"` | `src/technologies/c.json` |
| EmailOctopus | scriptSrc | `"emailoctopus\\.com/bundles"` | `src/technologies/e.json` |
| EmailOctopus | xhr | `"emailoctopus\\.com"` | `src/technologies/e.json` |
| EmailOctopus | js (emailOctopus) | `""` | `src/technologies/e.json` |
| EmailOctopus | js (emailoctopus) | `""` | `src/technologies/e.json` |
| Face Age | scriptSrc | `"cdn\\.jsdelivr\\.net/npm/face-age@([\\d.]+)\\;version:\\1"` | `src/technologies/f.json` |
| Face Age | scriptSrc | `"cdn\\.jsdelivr\\.net/npm/face-age(?:/\|$)"` | `src/technologies/f.json` |
| Face Age | scriptSrc | `"unpkg\\.com/face-age@([\\d.]+)\\;version:\\1"` | `src/technologies/f.json` |
| Face Age | scriptSrc | `"unpkg\\.com/face-age(?:/\|$)"` | `src/technologies/f.json` |
| Face Age | xhr | `"core\\.getfaceage\\.com"` | `src/technologies/f.json` |
| Face Age | js (FaceAge.prototype.render) | `""` | `src/technologies/f.json` |
| Face Age | dom (.faceAge-main-module) | `".faceAge-main-module"` | `src/technologies/f.json` |
| Face Age | dom (iframe#FaceAge-module-iframe) | `"iframe#FaceAge-module-iframe"` | `src/technologies/f.json` |
| Flexmail | scriptSrc | `"\\.flexmail\\.eu/"` | `src/technologies/f.json` |
| Flexmail | xhr | `"\\.flexmail\\.eu"` | `src/technologies/f.json` |
| Flexmail | headers (content-security-policy) | `"(?:^\|[^a-z])flexmail\\.eu"` | `src/technologies/f.json` |
| Flexmail | dom (iframe[src*="flexmail.eu"]) | `"iframe[src*=\"flexmail.eu\"]"` | `src/technologies/f.json` |
| Flexmail | dom (form[action*="flexmail.eu"]) | `"form[action*=\"flexmail.eu\"]"` | `src/technologies/f.json` |
| FreeWheel | scriptSrc | `"fwmrm\\.net"` | `src/technologies/f.json` |
| FreeWheel | xhr | `"fwmrm\\.net"` | `src/technologies/f.json` |
| FreeWheel | dom (img[src*="fwmrm.net"]) | `"img[src*=\"fwmrm.net\"]"` | `src/technologies/f.json` |
| FreeWheel | dom (iframe[src*="fwmrm.net"]) | `"iframe[src*=\"fwmrm.net\"]"` | `src/technologies/f.json` |
| Hackle | html | `"HACKLE_SDK_KEY"` | `src/technologies/h.json` |
| Hackle | scriptSrc | `"@hackler/javascript-sdk@([\\d.]+)/\\;version:\\1"` | `src/technologies/h.json` |
| Hackle | scriptSrc | `"@hackler/javascript-sdk"` | `src/technologies/h.json` |
| Hackle | scriptSrc | `"\\.hackle\\.io/"` | `src/technologies/h.json` |
| Hackle | xhr | `"(?:sdk-api\|client-sdk\|event-api\|event\|monitoring\|static\|cdn\\d*)\\.hackle\\.io"` | `src/technologies/h.json` |
| Hackle | js (HACKLE_PRELOAD_CLIENT) | `""` | `src/technologies/h.json` |
| Hackle | js (Hackle) | `""` | `src/technologies/h.json` |
| Hackle | js (HacklePlugin) | `""` | `src/technologies/h.json` |
| Hackle | js (_hackle) | `""` | `src/technologies/h.json` |
| Hackle | js (_hackleCafe24App) | `""` | `src/technologies/h.json` |
| Hackle | js (hackleClient) | `""` | `src/technologies/h.json` |
| Happierleads | scriptSrc | `"rest\\.happierleads\\.com"` | `src/technologies/h.json` |
| Happierleads | xhr | `"(?:rest\|session-recordings)\\.happierleads\\.com"` | `src/technologies/h.json` |
| Happierleads | js (Happierleads) | `""` | `src/technologies/h.json` |
| Happierleads | js (hlRunning) | `""` | `src/technologies/h.json` |
| Impact | scriptSrc | `"utt\\.impactcdn\\.com"` | `src/technologies/i.json` |
| Impact | cookies (ir_gbd) | `""` | `src/technologies/i.json` |
| Impact | cookies (ir_pi) | `""` | `src/technologies/i.json` |
| Impact | js (ire) | `""` | `src/technologies/i.json` |
| Impact | js (ire_o) | `""` | `src/technologies/i.json` |
| Impact | js (impactDataLayer) | `""` | `src/technologies/i.json` |
| Job Boardly | scriptSrc | `"assets\\.jobboardly\\.com/"` | `src/technologies/j.json` |
| Job Boardly | xhr | `"(?:assets\|cdn)\\.jobboardly\\.com"` | `src/technologies/j.json` |
| Job Boardly | cookies (_job_boardly_session) | `""` | `src/technologies/j.json` |
| LogaTech | headers (x-powered-by) | `"^LogaTech$"` | `src/technologies/l.json` |
| LogaTech | meta (generator) | `"^LogaTech$"` | `src/technologies/l.json` |
| Lotame | scriptSrc | `"\\.crwdcntrl\\.net/"` | `src/technologies/l.json` |
| Lotame | xhr | `"\\.crwdcntrl\\.net"` | `src/technologies/l.json` |
| Metricool | scriptSrc | `"tracker\\.metricool\\.com/"` | `src/technologies/m.json` |
| Metricool | xhr | `"tracker\\.metricool\\.com"` | `src/technologies/m.json` |
| Metricool | js (beTracker) | `""` | `src/technologies/m.json` |
| Metricool | dom (img[src*="tracker.metricool.com/"]) | `"img[src*=\"tracker.metricool.com/\"]"` | `src/technologies/m.json` |
| Omago | scriptSrc | `"app\\.omago\\.ai/widget\\.js"` | `src/technologies/o.json` |
| Omago | dom (#omago-widget-container) | `"#omago-widget-container"` | `src/technologies/o.json` |
| Omago | dom (#omago-widget-button) | `"#omago-widget-button"` | `src/technologies/o.json` |
| Orbit Commerce | headers (x-powered-by) | `"^Orbit Commerce$"` | `src/technologies/o.json` |
| Orbit Commerce | js (OrbitCommerce.platform) | `"^Orbit Commerce$"` | `src/technologies/o.json` |
| Orbit Commerce | meta (generator) | `"^Orbit Commerce$"` | `src/technologies/o.json` |
| Peer39 | html | `"tags\\.peer39\\.com"` | `src/technologies/p.json` |
| Peer39 | scriptSrc | `"\\.peer39\\.(?:com\|net)/"` | `src/technologies/p.json` |
| Peer39 | xhr | `"\\.peer39\\.(?:com\|net)"` | `src/technologies/p.json` |
| Podbean | scriptSrc | `"\\.podbean\\.com/"` | `src/technologies/p.json` |
| Podbean | dom (iframe[src*='podbean.com']) | `"iframe[src*='podbean.com']"` | `src/technologies/p.json` |
| Podscribe | scriptSrc | `"podscribe\\.(?:ai\|com)/"` | `src/technologies/p.json` |
| Podscribe | xhr | `"podscribe\\.(?:ai\|com)"` | `src/technologies/p.json` |
| Podscribe | dom (a[href*="app.podscribe.ai/"]) | `"a[href*=\"app.podscribe.ai/\"]"` | `src/technologies/p.json` |
| Podscribe | dom (img[src*="podscribe.com/"]) | `"img[src*=\"podscribe.com/\"]"` | `src/technologies/p.json` |
| Printify | scriptSrc | `"printify\\.com"` | `src/technologies/p.json` |
| Printify | xhr | `"printify\\.com"` | `src/technologies/p.json` |
| Printify | dom (img[src*="printify.com"]) | `"img[src*=\"printify.com\"]"` | `src/technologies/p.json` |
| Printify | dom (img[src*="images-api.printify.com"]) | `"img[src*=\"images-api.printify.com\"]"` | `src/technologies/p.json` |
| ProgressBar.js | scriptSrc | `"cdnjs\\.cloudflare\\.com\\/ajax\\/libs\\/progressbar\\.js\\/([\\d\\.]+)\\/progressbar(?:\\.min)?\\.js\\;version:\\1"` | `src/technologies/p.json` |
| ProgressBar.js | scriptSrc | `"\\/progressbar\\.js@([\\d\\.]+)\\/dist\\/progressbar(?:\\.min)?\\.js\\;version:\\1"` | `src/technologies/p.json` |
| ProgressBar.js | scriptSrc | `"\\/progressbar\\.js\\/dist\\/progressbar(?:\\.min)?\\.js"` | `src/technologies/p.json` |
| Quantyoo | html | `"https://quantyoo\\.de"` | `src/technologies/q.json` |
| Scrapive | scriptSrc | `"scrapive\\.com/scrapive-[a-z-]+\\.iife\\.js"` | `src/technologies/s.json` |
| Scrapive | scripts | `"window\\.__SCRAPIVE_LOADED__"` | `src/technologies/s.json` |
| Scrapive | xhr | `"tygo\\.scrapive\\.com"` | `src/technologies/s.json` |
| Scrapive | js (__SCRAPIVE_EMBED__) | `""` | `src/technologies/s.json` |
| Scrapive | js (__SCRAPIVE_LOADED__) | `""` | `src/technologies/s.json` |
| ShopWise | headers (x-powered-by) | `"ShopWise"` | `src/technologies/s.json` |
| ShopWise | js (__SHOPWISE__.name) | `"ShopWise"` | `src/technologies/s.json` |
| ShopWise | js (__SHOPWISE__.version) | `""` | `src/technologies/s.json` |
| ShopWise | meta (generator) | `"ShopWise"` | `src/technologies/s.json` |
| ShopWise | dom (link[href*='.myshopwise.now']) | `"link[href*='.myshopwise.now']"` | `src/technologies/s.json` |
| SimplyBook.me | scriptSrc | `"widget\\.simplybook\\.it"` | `src/technologies/s.json` |
| SimplyBook.me | js (SimplybookWidget) | `""` | `src/technologies/s.json` |
| SimplyBook.me | dom (a[href*='.simplybook.'][target='_blank']) | `"a[href*='.simplybook.'][target='_blank']"` | `src/technologies/s.json` |
| SimplyBook.me | dom (iframe[src*='.simplybook.it']) | `"iframe[src*='.simplybook.it']"` | `src/technologies/s.json` |
| SmartFront | meta (generator) | `"^SmartFront(?: ([\\d.]+))?$\\;version:\\1"` | `src/technologies/s.json` |
| SmartFront | dom ([data-sf-shell-page-head]) | `"[data-sf-shell-page-head]"` | `src/technologies/s.json` |
| SmartFront | dom (style#sf-theme-vars) | `"style#sf-theme-vars"` | `src/technologies/s.json` |
| SmartFront | dom (div#sf-tenant-css) | `"div#sf-tenant-css"` | `src/technologies/s.json` |
| SociableKIT | html | `"<iframe[^>]*src=[^>]*widgets\\.sociablekit\\.com"` | `src/technologies/s.json` |
| SociableKIT | html | `"<img[^>]*src=[^>]*images\\.sociablekit\\.com"` | `src/technologies/s.json` |
| SociableKIT | scriptSrc | `"widgets\\.sociablekit\\.com"` | `src/technologies/s.json` |
| Sonares | html | `"<iframe [^>]*src=[^>]*content\\.sonares\\.org/[^\"/]+"` | `src/technologies/s.json` |
| SproutStudio | dom (iframe[src*='.sproutstudio.com']) | `"iframe[src*='.sproutstudio.com']"` | `src/technologies/s.json` |
| SuiteDash | scriptSrc | `"app\\.suitedash\\.com"` | `src/technologies/s.json` |
| Supabase | scripts | `"cdn\\.jsdelivr.net/npm/@supabase"` | `src/technologies/s.json` |
| Supabase | scripts | `"unpkg\\.com/@supabase"` | `src/technologies/s.json` |
| THEADX | scriptSrc | `"app\\.theadx\\.com/"` | `src/technologies/t.json` |
| THEADX | xhr | `"\\.theadx\\.com"` | `src/technologies/t.json` |
| Terminalfour | html | `"<[^>]+terminalfour\\.net/"` | `src/technologies/t.json` |
| Terminalfour | html | `"<[^>]+t4Edit-page"` | `src/technologies/t.json` |
| Terminalfour | html | `"<[^>]+/terminalfour/page/(?:section\|content\|directEdit)"` | `src/technologies/t.json` |
| Traffective | js (traffectiveLib) | `""` | `src/technologies/t.json` |
| Tutorbird | dom (iframe[src*='.tutorbird.com']) | `"iframe[src*='.tutorbird.com']"` | `src/technologies/t.json` |
| Tutorbird | dom (a[href*='.tutorbird.com']) | `"a[href*='.tutorbird.com']"` | `src/technologies/t.json` |
| Valorsic Studio | dom ([data-valorsic-studio]) | `"[data-valorsic-studio]"` | `src/technologies/v.json` |
| Verificado | scriptSrc | `"app\\.verificado\\.ai/js/widget/onsite-feedback-widget\\.js"` | `src/technologies/v.json` |
| Verificado | scriptSrc | `"cdn-mz-gj-vai\\.verificado\\.ai/(?:js/)?widget/"` | `src/technologies/v.json` |
| Verificado | js (VerificadoAI.version) | `"^(.+)$\\;version:\\1"` | `src/technologies/v.json` |
| Verificado | js (verificadoAIKeyId) | `""` | `src/technologies/v.json` |
| Verificado | js (verificadoAIUriBaseCdn) | `""` | `src/technologies/v.json` |
| Verificado | dom (#verificadoAIwidget) | `"#verificadoAIwidget"` | `src/technologies/v.json` |
| Verificado | dom (.verificadoai-plp-rating) | `".verificadoai-plp-rating"` | `src/technologies/v.json` |
| Verificado | dom (html[data-verificado]) | `"html[data-verificado]"` | `src/technologies/v.json` |
| WebinarGeek | scriptSrc | `"embed\\.webinargeek\\.com"` | `src/technologies/w.json` |
| WebinarGeek | xhr | `"\\.webinargeek\\.com"` | `src/technologies/w.json` |
| WebinarGeek | js (GeekEmbedStart) | `""` | `src/technologies/w.json` |
| WebinarGeek | js (GeekEmbedLoaded) | `""` | `src/technologies/w.json` |
| WebinarGeek | dom (iframe[src*='webinargeek.com'], script[src*='embed.webinargeek.com']) | `"iframe[src*='webinargeek.com'], script[src*='embed.webinargeek.com']"` | `src/technologies/w.json` |
| WooCommerce Subscriptions | html | `"/plugins/woocommerce-subscriptions/vendor/woocommerce/subscriptions-core/build"` | `src/technologies/w.json` |
| WooCommerce Subscriptions | dom (link[href*="/plugins/woocommerce-subscriptions/"]) | `"link[href*=\"/plugins/woocommerce-subscriptions/\"]"` | `src/technologies/w.json` |
| WooCommerce Subscriptions | dom (script[src*="/plugins/woocommerce-subscriptions/"]) | `"script[src*=\"/plugins/woocommerce-subscriptions/\"]"` | `src/technologies/w.json` |
| Wysistat | scriptSrc | `"www\\.wysistat\\.(?:com\|net)/"` | `src/technologies/w.json` |
| Wysistat | xhr | `"wysistat\\.(?:com\|net)"` | `src/technologies/w.json` |
| Wysistat | cookies (wysistat) | `""` | `src/technologies/w.json` |
| Wysistat | js (_wsq) | `""` | `src/technologies/w.json` |
| Wysistat | js (_wysistat) | `""` | `src/technologies/w.json` |
| Wysistat | js (wysistat) | `""` | `src/technologies/w.json` |
| Yandex.Metrika | scriptSrc | `"cdn\\.jsdelivr\\.net/npm/yandex\\-metrica\\-watch/(?:tag\|watch)\\.js"` | `src/technologies/y.json` |
| Yandex.Metrika | scripts | `"mc\\.yandex\\.ru/metrika/(?:tag\|watch)\\.js"` | `src/technologies/y.json` |
| Yandex.Metrika | scripts | `"cdn\\.jsdelivr\\.net/npm/yandex\\-metrica\\-watch/(?:tag\|watch)\\.js"` | `src/technologies/y.json` |
| YouDraw | headers (x-generator) | `"^YouDraw"` | `src/technologies/y.json` |
| YouDraw | meta (generator) | `"^YouDraw"` | `src/technologies/y.json` |
| Zeeg | scriptSrc | `"assets\\.zeeg\\.me/embed\\.min\\.js"` | `src/technologies/z.json` |
| Zeeg | xhr | `"(?:api\|assets\|uploads\|page-analytics)\\.zeeg\\.me"` | `src/technologies/z.json` |
| Zeeg | js (Zeeg) | `""` | `src/technologies/z.json` |
| Zoomd | scripts | `"sphereup\\.com/zoomd"` | `src/technologies/z.json` |
| Zoomd | js (Zoomd) | `""` | `src/technologies/z.json` |
| audienzz | js (audienzz) | `""` | `src/technologies/a.json` |
| authorize.net | html | `"authorizenet\\\\?/directpost_payment"` | `src/technologies/a.json` |
| authorize.net | html | `"js\\.authorize\\.net"` | `src/technologies/a.json` |
| cituro | scriptSrc | `"app\\.cituro\\.com/"` | `src/technologies/c.json` |
| cituro | xhr | `"(?:app\|cdn)\\.cituro\\.com"` | `src/technologies/c.json` |
| cituro | js (cituroLoader) | `""` | `src/technologies/c.json` |
| cituro | js (cituroOptions) | `""` | `src/technologies/c.json` |
| cituro | js (cituroWidget) | `""` | `src/technologies/c.json` |
| cituro | js (buildCituroOptions) | `""` | `src/technologies/c.json` |
| cituro | dom (iframe[src*='cituro.com']) | `"iframe[src*='cituro.com']"` | `src/technologies/c.json` |
| streaMonkey | html | `"\\.streamonkey\\.net/"` | `src/technologies/s.json` |
| streaMonkey | scriptSrc | `"player\\.streamonkey\\.net/"` | `src/technologies/s.json` |
| streaMonkey | xhr | `"\\.streamonkey\\.net"` | `src/technologies/s.json` |
| streaMonkey | js (StreamPlayer) | `""` | `src/technologies/s.json` |
| teachworks | dom ([id='teachworks-booking-button']) | `"[id='teachworks-booking-button']"` | `src/technologies/t.json` |
| \|related\| Natív Hirdetés Kft | scripts | `"//related\\.hu"` | `src/technologies/_.json` |
