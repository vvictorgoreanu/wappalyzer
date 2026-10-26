# third-party-web attribution

This commit adds `scriptSrc` detection rules derived from [patrickhulce/third-party-web](https://github.com/patrickhulce/third-party-web) at `a631d7a773c9338a20446ba0d106fabc0f87b732` (`data/entities.js`, with HTTP Archive 2026-03 usage data from the same commit), licensed MIT. The MIT license text is in `LICENSE-third-party-web`.

Each row lists an imported technology, the generated pattern, and the third-party-web entity and domain it came from. Review notes and validation results are in the StackLookup extension repository at `docs/ai/third-party-web-import/findings/third-party-web-candidates.json`.

| Technology | Pattern | Entity | Domain |
| --- | --- | --- | --- |
| AAX | `^https?://(?:[a-z0-9-]+\.)*aaxads\.com(?:[:/?#]\|$)` | Acceptable Ads | `*.aaxads.com` |
| Ably | `^https?://(?:[a-z0-9-]+\.)*ably\.io(?:[:/?#]\|$)` | Ably | `*.ably.io` |
| AccessiBe | `^https?://(?:[a-z0-9-]+\.)*acsbapp\.com(?:[:/?#]\|$)` | Accessibe Accessibility Overlay | `*.acsbapp.com` |
| AccessiBe | `^https?://(?:[a-z0-9-]+\.)*acsbap\.com(?:[:/?#]\|$)` | Accessibe Accessibility Overlay | `*.acsbap.com` |
| ActBlue | `^https?://(?:[a-z0-9-]+\.)*actblue\.com(?:[:/?#]\|$)` | ActBlue | `*.actblue.com` |
| ActiveCampaign | `^https?://(?:[a-z0-9-]+\.)*trackcmp\.net(?:[:/?#]\|$)` | ActiveCampaign | `*.trackcmp.net` |
| Ad6Media | `^https?://(?:[a-z0-9-]+\.)*ad6media\.fr(?:[:/?#]\|$)` | Ad6Media | `*.ad6media.fr` |
| AdKernel | `^https?://(?:[a-z0-9-]+\.)*adkernel\.com(?:[:/?#]\|$)` | adKernel | `*.adkernel.com` |
| AdMan Media | `^https?://(?:[a-z0-9-]+\.)*admanmedia\.com(?:[:/?#]\|$)` | AdMan Media | `*.admanmedia.com` |
| AdScore | `^https?://(?:[a-z0-9-]+\.)*adsco\.re(?:[:/?#]\|$)` | AdScore | `*.adsco.re` |
| AdSpeed | `^https?://(?:[a-z0-9-]+\.)*adspeed\.net(?:[:/?#]\|$)` | AdSpeed | `*.adspeed.net` |
| Adacado | `^https?://(?:[a-z0-9-]+\.)*adacado\.com(?:[:/?#]\|$)` | Adacado | `*.adacado.com` |
| Adnami | `^https?://(?:[a-z0-9-]+\.)*adnami\.io(?:[:/?#]\|$)` | Adnami | `*.adnami.io` |
| AdsWizz | `^https?://(?:[a-z0-9-]+\.)*adswizz\.com(?:[:/?#]\|$)` | AdsWizz | `*.adswizz.com` |
| AdvertServe | `^https?://(?:[a-z0-9-]+\.)*advertserve\.com(?:[:/?#]\|$)` | AdvertServe | `*.advertserve.com` |
| Adwise | `^https?://(?:[a-z0-9-]+\.)*adwise\.bg(?:[:/?#]\|$)` | Adwise | `*.adwise.bg` |
| Airship | `^https?://(?:[a-z0-9-]+\.)*urbanairship\.com(?:[:/?#]\|$)` | Airship | `*.urbanairship.com` |
| Airship | `^https?://(?:[a-z0-9-]+\.)*aswpsdkus\.com(?:[:/?#]\|$)` | Airship | `*.aswpsdkus.com` |
| AlphaSSL | `^https?://(?:[a-z0-9-]+\.)*alphassl\.com(?:[:/?#]\|$)` | AlphaSSL | `*.alphassl.com` |
| Amplience | `^https?://(?:[a-z0-9-]+\.)*amplience\.net(?:[:/?#]\|$)` | Amplience | `*.amplience.net` |
| Amplience | `^https?://(?:[a-z0-9-]+\.)*bigcontent\.io(?:[:/?#]\|$)` | Amplience | `*.bigcontent.io` |
| Amplience | `^https?://(?:[a-z0-9-]+\.)*adis\.ws(?:[:/?#]\|$)` | Amplience | `*.adis.ws` |
| Anedot | `^https?://(?:[a-z0-9-]+\.)*anedot\.com(?:[:/?#]\|$)` | Anedot | `*.anedot.com` |
| Apester | `^https?://(?:[a-z0-9-]+\.)*apester\.com(?:[:/?#]\|$)` | Apester | `*.apester.com` |
| Atlas AI Digital Assistant | `^https?://(?:[a-z0-9-]+\.)*atlasrtx\.com(?:[:/?#]\|$)` | atlasRTX | `*.atlasrtx.com` |
| Audioboom | `^https?://(?:[a-z0-9-]+\.)*audioboom\.com(?:[:/?#]\|$)` | audioBoom | `*.audioboom.com` |
| AvantLink | `^https?://(?:[a-z0-9-]+\.)*avmws\.com(?:[:/?#]\|$)` | AvantLink | `*.avmws.com` |
| BBB Accredited Business Seal | `^https?://seal-[a-z0-9-]+\.bbb\.org/badge/badge\.min\.js(?:[?#]\|$)` | Better Business Bureau | `*.bbb.org` |
| Baidu Analytics (百度统计) | `^https?://hmcdn\.baidu\.com(?:[:/?#]\|$)` | Baidu Analytics | `hmcdn.baidu.com` |
| BannerFlow | `^https?://(?:[a-z0-9-]+\.)*bannerflow\.com(?:[:/?#]\|$)` | BannerFlow | `*.bannerflow.com` |
| BidTheatre | `^https?://(?:[a-z0-9-]+\.)*bidtheatre\.com(?:[:/?#]\|$)` | BidTheatre | `*.bidtheatre.com` |
| Bidswitch | `^https?://(?:[a-z0-9-]+\.)*bidswitch\.net(?:[:/?#]\|$)` | Bidswitch | `*.bidswitch.net` |
| Bidtellect | `^https?://(?:[a-z0-9-]+\.)*bttrack\.com(?:[:/?#]\|$)` | Bidtellect | `*.bttrack.com` |
| Bizrate Insights | `^https?://insights\.bizrate\.com/js/init\.js(?:[?#]\|$)` | Bizrate | `*.bizrate.com` |
| BowNow | `^https?://(?:[a-z0-9-]+\.)*bownow\.jp(?:[:/?#]\|$)` | BowNow | `*.bownow.jp` |
| Brandmetrics | `^https?://(?:[a-z0-9-]+\.)*brandmetrics\.com(?:[:/?#]\|$)` | Brandmetrics | `*.brandmetrics.com` |
| BuySellAds | `^https?://(?:[a-z0-9-]+\.)*buysellads\.net(?:[:/?#]\|$)` | BuySellAds | `*.buysellads.net` |
| CallTrackingMetrics | `^https?://(?:[a-z0-9-]+\.)*tctm\.co(?:[:/?#]\|$)` | CallTrackingMetrics | `*.tctm.co` |
| Catchpoint | `^https?://(?:[a-z0-9-]+\.)*3gl\.net(?:[:/?#]\|$)` | Catchpoint | `*.3gl.net` |
| Celtra | `^https?://(?:[a-z0-9-]+\.)*celtra\.com(?:[:/?#]\|$)` | Celtra | `*.celtra.com` |
| Chartbeat | `^https?://(?:[a-z0-9-]+\.)*chartbeat\.net(?:[:/?#]\|$)` | Chartbeat | `*.chartbeat.net` |
| CleverTap | `^https?://(?:[a-z0-9-]+\.)*wzrkt\.com(?:[:/?#]\|$)` | WizRocket Technologies | `*.wzrkt.com` |
| Codigo | `^https?://(?:[a-z0-9-]+\.)*codigo\.se(?:[:/?#]\|$)` | codigo | `*.codigo.se` |
| Coral | `^https?://(?:[a-z0-9-]+\.)*coral\.coralproject\.net(?:[:/?#]\|$)` | Coral | `*.coral.coralproject.net` |
| Council Advertising Network | `^https?://(?:[a-z0-9-]+\.)*counciladvertising\.net(?:[:/?#]\|$)` | Council ad Network | `*.counciladvertising.net` |
| DMCA.com Protection | `^https?://images\.dmca\.com/badges/dmcabadgehelper\.min\.js(?:[?#]\|$)` | Digital Millennium Copyright Act Services | `*.dmca.com` |
| Datawrapper | `^https?://(?:[a-z0-9-]+\.)*dwcdn\.net(?:[:/?#]\|$)` | Datawrapper | `*.dwcdn.net` |
| Disqus | `^https?://(?:[a-z0-9-]+\.)*disquscdn\.com(?:[:/?#]\|$)` | Disqus | `*.disquscdn.com` |
| Dotdigital | `^https?://(?:[a-z0-9-]+\.)*trackedlink\.net(?:[:/?#]\|$)` | WebInsight | `*.trackedlink.net` |
| Dotdigital | `^https?://(?:[a-z0-9-]+\.)*trackedweb\.net(?:[:/?#]\|$)` | WebInsight | `*.trackedweb.net` |
| Dynamic Converter | `^https?://(?:[a-z0-9-]+\.)*dynamicconverter\.com(?:[:/?#]\|$)` | Dynamic Converter | `*.dynamicconverter.com` |
| Dynatrace | `^https?://js-cdn\.dynatrace\.com(?:[:/?#]\|$)` | Dynatrace | `js-cdn.dynatrace.com` |
| Etracker | `^https?://(?:[a-z0-9-]+\.)*etracker\.de(?:[:/?#]\|$)` | etracker | `*.etracker.de` |
| Euroland IR | `^https?://(?:[a-z0-9-]+\.)*euroland\.com(?:[:/?#]\|$)` | Euroland | `*.euroland.com` |
| Extole | `^https?://(?:[a-z0-9-]+\.)*extole\.io(?:[:/?#]\|$)` | Extole | `*.extole.io` |
| Feedbackify | `^https?://(?:[a-z0-9-]+\.)*feedbackify\.com(?:[:/?#]\|$)` | Feedbackify | `*.feedbackify.com` |
| Filestack | `^https?://(?:[a-z0-9-]+\.)*filepicker\.io(?:[:/?#]\|$)` | Filestack | `*.filepicker.io` |
| Foxentry | `^https?://(?:[a-z0-9-]+\.)*foxentry\.cz(?:[:/?#]\|$)` | Foxentry | `*.foxentry.cz` |
| Freetobook | `^https?://(?:[a-z0-9-]+\.)*freetobook\.com(?:[:/?#]\|$)` | Freetobook | `*.freetobook.com` |
| G2 | `^https?://(?:[a-z0-9-]+\.)*g2crowd\.com(?:[:/?#]\|$)` | G2 | `*.g2crowd.com` |
| Geniee | `^https?://(?:[a-z0-9-]+\.)*genieesspv\.jp(?:[:/?#]\|$)` | Geniee | `*.genieesspv.jp` |
| Geniee | `^https?://(?:[a-z0-9-]+\.)*gssprt\.jp(?:[:/?#]\|$)` | Geniee | `*.gssprt.jp` |
| Geniuslink | `^https?://(?:[a-z0-9-]+\.)*geni\.us(?:[:/?#]\|$)` | Geniuslink | `*.geni.us` |
| GeoEdge | `^https?://(?:[a-z0-9-]+\.)*geoedge\.be(?:[:/?#]\|$)` | GeoEdge | `*.geoedge.be` |
| Gnatta | `^https?://(?:[a-z0-9-]+\.)*gnatta\.com(?:[:/?#]\|$)` | gnatta | `*.gnatta.com` |
| GovMetric | `^https?://(?:[a-z0-9-]+\.)*govmetric\.com(?:[:/?#]\|$)` | GovMetric | `*.govmetric.com` |
| Hubvisor | `^https?://(?:[a-z0-9-]+\.)*hubvisor\.io(?:[:/?#]\|$)` | Hubvisor | `*.hubvisor.io` |
| Hybrid | `^https?://(?:[a-z0-9-]+\.)*hybrid\.ai(?:[:/?#]\|$)` | Hybrid | `*.hybrid.ai` |
| INFOnline | `^https?://(?:[a-z0-9-]+\.)*ioam\.de(?:[:/?#]\|$)` | Infoline | `*.ioam.de` |
| Improve Digital | `^https?://(?:[a-z0-9-]+\.)*360yield\.com(?:[:/?#]\|$)` | Improve Digital | `*.360yield.com` |
| Improvely | `^https?://(?:[a-z0-9-]+\.)*iljmp\.com(?:[:/?#]\|$)` | Improvely | `*.iljmp.com` |
| InZynk | `^https?://(?:[a-z0-9-]+\.)*inzynk\.io(?:[:/?#]\|$)` | InZynk | `*.inzynk.io` |
| Index Exchange | `^https?://(?:[a-z0-9-]+\.)*indexww\.com(?:[:/?#]\|$)` | Index Exchange | `*.indexww.com` |
| Infinity Call Tracking | `^https?://(?:[a-z0-9-]+\.)*infinity-tracking\.net(?:[:/?#]\|$)` | Infinity Tracking | `*.infinity-tracking.net` |
| Infogram | `^https?://(?:[a-z0-9-]+\.)*jifo\.co(?:[:/?#]\|$)` | infogr.am | `*.jifo.co` |
| Ipsos DotMetrics | `^https?://(?:[a-z0-9-]+\.)*dotmetrics\.net(?:[:/?#]\|$)` | DotMetrics | `*.dotmetrics.net` |
| Issuu | `^https?://(?:[a-z0-9-]+\.)*isu\.pub(?:[:/?#]\|$)` | issuu | `*.isu.pub` |
| Kaizen Platform | `^https?://(?:[a-z0-9-]+\.)*kaizenplatform\.net(?:[:/?#]\|$)` | Kaizen Platform | `*.kaizenplatform.net` |
| Kaltura | `^https?://(?:[a-z0-9-]+\.)*kaltura\.com(?:[:/?#]\|$)` | Kaltura Video Platform | `*.kaltura.com` |
| Kameleoon | `^https?://(?:[a-z0-9-]+\.)*kameleoon\.eu(?:[:/?#]\|$)` | Kameleoon | `*.kameleoon.eu` |
| Kameleoon | `^https?://(?:[a-z0-9-]+\.)*kameleoon\.io(?:[:/?#]\|$)` | Kameleoon | `*.kameleoon.io` |
| Kargo | `^https?://(?:[a-z0-9-]+\.)*kargo\.com(?:[:/?#]\|$)` | Kargo | `*.kargo.com` |
| Knorex XPO | `^https?://(?:[a-z0-9-]+\.)*brand-display\.com(?:[:/?#]\|$)` | XPO | `*.brand-display.com` |
| LTK | `^https?://(?:[a-z0-9-]+\.)*rewardstyle\.com(?:[:/?#]\|$)` | rewardStyle.com | `*.rewardstyle.com` |
| LightWidget | `^https?://(?:[a-z0-9-]+\.)*lightwidget\.com(?:[:/?#]\|$)` | LightWidget | `*.lightwidget.com` |
| LiveChat | `^https?://(?:[a-z0-9-]+\.)*livechat-static\.com(?:[:/?#]\|$)` | LiveChat | `*.livechat-static.com` |
| LiveHelpNow | `^https?://(?:[a-z0-9-]+\.)*livehelpnow\.net(?:[:/?#]\|$)` | LiveHelpNow | `*.livehelpnow.net` |
| LivePerson | `^https?://(?:[a-z0-9-]+\.)*lpsnmedia\.net(?:[:/?#]\|$)` | LivePerson | `*.lpsnmedia.net` |
| Loop11 | `^https?://(?:[a-z0-9-]+\.)*loop11\.com(?:[:/?#]\|$)` | Loop11 | `*.loop11.com` |
| Mailmunch | `^https?://(?:[a-z0-9-]+\.)*mailmunch\.co(?:[:/?#]\|$)` | MailMunch | `*.mailmunch.co` |
| Mapp | `^https?://(?:[a-z0-9-]+\.)*wbtrk\.net(?:[:/?#]\|$)` | Webtrekk | `*.wbtrk.net` |
| Mapp | `^https?://(?:[a-z0-9-]+\.)*webtrekk\.net(?:[:/?#]\|$)` | Webtrekk | `*.webtrekk.net` |
| Mapp | `^https?://(?:[a-z0-9-]+\.)*wt-eu02\.net(?:[:/?#]\|$)` | Webtrekk | `*.wt-eu02.net` |
| Mapp | `^https?://(?:[a-z0-9-]+\.)*wt-safetag\.com(?:[:/?#]\|$)` | Webtrekk | `*.wt-safetag.com` |
| Marchex | `^https?://(?:[a-z0-9-]+\.)*voicestar\.com(?:[:/?#]\|$)` | Marchex | `*.voicestar.com` |
| Mather Economics | `^https?://(?:[a-z0-9-]+\.)*matheranalytics\.com(?:[:/?#]\|$)` | Mather Economics | `*.matheranalytics.com` |
| Matomo Analytics | `^https?://(?:[a-z0-9-]+\.)*matomo\.cloud(?:[:/?#]\|$)` | Matomo | `*.matomo.cloud` |
| MonetizeMore | `^https?://(?:[a-z0-9-]+\.)*m2\.ai(?:[:/?#]\|$)` | MonetizeMore | `*.m2.ai` |
| Movable Ink | `^https?://(?:[a-z0-9-]+\.)*micpn\.com(?:[:/?#]\|$)` | Movable Ink | `*.micpn.com` |
| Multiview | `^https?://(?:[a-z0-9-]+\.)*multiview\.com(?:[:/?#]\|$)` | Multiview | `*.multiview.com` |
| NEORY | `^https?://(?:[a-z0-9-]+\.)*ad-srv\.net(?:[:/?#]\|$)` | NEORY Marketing Cloud | `*.ad-srv.net` |
| Narrative | `^https?://(?:[a-z0-9-]+\.)*narrative\.io(?:[:/?#]\|$)` | Narrative | `*.narrative.io` |
| New Relic | `^https?://(?:[a-z0-9-]+\.)*nr-data\.net(?:[:/?#]\|$)` | New Relic | `*.nr-data.net` |
| Nova Studio | `^https?://(?:[a-z0-9-]+\.)*polarcdn-engine\.com(?:[:/?#]\|$)` | Polar | `*.polarcdn-engine.com` |
| Nova Studio | `^https?://(?:[a-z0-9-]+\.)*polarcdn-terrax\.com(?:[:/?#]\|$)` | Polar | `*.polarcdn-terrax.com` |
| Nova Studio | `^https?://(?:[a-z0-9-]+\.)*polarcdn\.com(?:[:/?#]\|$)` | Polar | `*.polarcdn.com` |
| Ontame | `^https?://(?:[a-z0-9-]+\.)*ontame\.io(?:[:/?#]\|$)` | Ontame | `*.ontame.io` |
| OpenX | `^https?://(?:[a-z0-9-]+\.)*openxcdn\.net(?:[:/?#]\|$)` | OpenX | `*.openxcdn.net` |
| Opinion Stage | `^https?://(?:[a-z0-9-]+\.)*opinionstage\.com(?:[:/?#]\|$)` | Opinion Stage | `*.opinionstage.com` |
| Opta | `^https?://(?:[a-z0-9-]+\.)*opta\.net(?:[:/?#]\|$)` | Opta | `*.opta.net` |
| OptinMonster | `^https?://(?:[a-z0-9-]+\.)*opmnstr\.com(?:[:/?#]\|$)` | OptinMonster | `*.opmnstr.com` |
| OptinMonster | `^https?://(?:[a-z0-9-]+\.)*optmnstr\.com(?:[:/?#]\|$)` | OptinMonster | `*.optmnstr.com` |
| OptinMonster | `^https?://(?:[a-z0-9-]+\.)*optmstr\.com(?:[:/?#]\|$)` | OptinMonster | `*.optmstr.com` |
| Performax | `^https?://(?:[a-z0-9-]+\.)*performax\.cz(?:[:/?#]\|$)` | Performio | `*.performax.cz` |
| Piano | `^https?://(?:[a-z0-9-]+\.)*npttech\.com(?:[:/?#]\|$)` | piano | `*.npttech.com` |
| Picreel | `^https?://(?:[a-z0-9-]+\.)*pcrl\.co(?:[:/?#]\|$)` | Picreel | `*.pcrl.co` |
| Popads | `^https?://(?:[a-z0-9-]+\.)*popads\.net(?:[:/?#]\|$)` | Popads | `*.popads.net` |
| Prefixbox | `^https?://(?:[a-z0-9-]+\.)*prefixbox\.com(?:[:/?#]\|$)` | Prefix Box AI Search | `*.prefixbox.com` |
| Profitshare | `^https?://(?:[a-z0-9-]+\.)*profitshare\.ro(?:[:/?#]\|$)` | Profitshare | `*.profitshare.ro` |
| PubNation | `^https?://(?:[a-z0-9-]+\.)*pubnation\.com(?:[:/?#]\|$)` | PubNation | `*.pubnation.com` |
| RebelMouse | `^https?://(?:[a-z0-9-]+\.)*rbl\.ms(?:[:/?#]\|$)` | RebelMouse | `*.rbl.ms` |
| Samba TV | `^https?://(?:[a-z0-9-]+\.)*samba\.tv(?:[:/?#]\|$)` | Samba TV | `*.samba.tv` |
| Seedtag | `^https?://(?:[a-z0-9-]+\.)*seedtag\.com(?:[:/?#]\|$)` | Seedtag | `*.seedtag.com` |
| SelectMedia | `^https?://(?:[a-z0-9-]+\.)*selectmedia\.asia(?:[:/?#]\|$)` | SelectMedia International | `*.selectmedia.asia` |
| Sentry | `^https?://(?:[a-z0-9-]+\.)*ravenjs\.com(?:[:/?#]\|$)` | Sentry | `*.ravenjs.com` |
| Sift | `^https?://(?:[a-z0-9-]+\.)*siftscience\.com(?:[:/?#]\|$)` | Sift Science | `*.siftscience.com` |
| Site Blindado | `^https?://(?:[a-z0-9-]+\.)*siteblindado\.com(?:[:/?#]\|$)` | Blindado | `*.siteblindado.com` |
| Siteimprove | `^https?://(?:[a-z0-9-]+\.)*siteimproveanalytics\.com(?:[:/?#]\|$)` | Siteimprove | `*.siteimproveanalytics.com` |
| Smadex | `^https?://(?:[a-z0-9-]+\.)*smadex\.com(?:[:/?#]\|$)` | smadex | `*.smadex.com` |
| Smart Wishlist | `^https?://(?:[a-z0-9-]+\.)*smartwishlist\.webmarked\.net(?:[:/?#]\|$)` | Webmarked | `*.webmarked.net` |
| Snap Pixel | `^https?://sc-static\.net/scevent\.min\.js(?:[?#]\|$)` | Snapchat | `*.sc-static.net` |
| Socialphotos | `^https?://(?:[a-z0-9-]+\.)*slpht\.com(?:[:/?#]\|$)` | Socialphotos | `*.slpht.com` |
| Sojern | `^https?://(?:[a-z0-9-]+\.)*sojern\.com(?:[:/?#]\|$)` | Sojern | `*.sojern.com` |
| Sophus3 | `^https?://(?:[a-z0-9-]+\.)*sophus3\.com(?:[:/?#]\|$)` | Sophus3 | `*.sophus3.com` |
| SoundCloud | `^https?://(?:[a-z0-9-]+\.)*soundcloud\.com(?:[:/?#]\|$)` | SoundCloud | `*.soundcloud.com` |
| SourceKnowledge | `^https?://(?:[a-z0-9-]+\.)*provenpixel\.com(?:[:/?#]\|$)` | SourceKnowledge | `*.provenpixel.com` |
| Speed Shift Media | `^https?://(?:[a-z0-9-]+\.)*speedshiftmedia\.com(?:[:/?#]\|$)` | Media Management Technologies | `*.speedshiftmedia.com` |
| Sportradar | `^https?://(?:[a-z0-9-]+\.)*sportradarserving\.com(?:[:/?#]\|$)` | Sportradar | `*.sportradarserving.com` |
| StreamAMG | `^https?://(?:[a-z0-9-]+\.)*streamamg\.com(?:[:/?#]\|$)` | SreamAMG | `*.streamamg.com` |
| StreamingVideoProvider | `^https?://(?:[a-z0-9-]+\.)*webvideocore\.net(?:[:/?#]\|$)` | WebVideoCore | `*.webvideocore.net` |
| TPMN | `^https?://(?:[a-z0-9-]+\.)*tpmn\.co\.kr(?:[:/?#]\|$)` | TPMN | `*.tpmn.co.kr` |
| Taggstar | `^https?://(?:[a-z0-9-]+\.)*taggstar\.com(?:[:/?#]\|$)` | Taggstar | `*.taggstar.com` |
| Targito | `^https?://(?:[a-z0-9-]+\.)*targito\.com(?:[:/?#]\|$)` | Targito | `*.targito.com` |
| The Media Trust | `^https?://(?:[a-z0-9-]+\.)*webcontentassessor\.com(?:[:/?#]\|$)` | Web Content Assessor | `*.webcontentassessor.com` |
| Tidio | `^https?://(?:[a-z0-9-]+\.)*tidiochat\.com(?:[:/?#]\|$)` | Tidio Live Chat | `*.tidiochat.com` |
| TrafficJunky | `^https?://(?:[a-z0-9-]+\.)*contentabc\.com(?:[:/?#]\|$)` | TrafficJunky | `*.contentabc.com` |
| TrafficJunky | `^https?://(?:[a-z0-9-]+\.)*trafficjunky\.net(?:[:/?#]\|$)` | TrafficJunky | `*.trafficjunky.net` |
| TruConversion | `^https?://(?:[a-z0-9-]+\.)*truconversion\.com(?:[:/?#]\|$)` | TruConversion | `*.truconversion.com` |
| Trust Guard | `^https?://(?:[a-z0-9-]+\.)*trust-guard\.com(?:[:/?#]\|$)` | Trust Guard | `*.trust-guard.com` |
| TrustX | `^https?://(?:[a-z0-9-]+\.)*trustx\.org(?:[:/?#]\|$)` | TrustX | `*.trustx.org` |
| Underdog Media | `^https?://(?:[a-z0-9-]+\.)*underdog\.media(?:[:/?#]\|$)` | Underdog Media | `*.underdog.media` |
| Uniconsent | `^https?://cmp\.uniconsent\.com(?:[:/?#]\|$)` | UniConsent CMP | `cmp.uniconsent.com` |
| Uniqodo | `^https?://(?:[a-z0-9-]+\.)*uniqodo\.com(?:[:/?#]\|$)` | Uniqodo | `*.uniqodo.com` |
| Viafoura | `^https?://(?:[a-z0-9-]+\.)*viafoura\.co(?:[:/?#]\|$)` | Viafoura | `*.viafoura.co` |
| Viafoura | `^https?://(?:[a-z0-9-]+\.)*viafoura\.net(?:[:/?#]\|$)` | Viafoura | `*.viafoura.net` |
| Vidyard | `^https?://(?:[a-z0-9-]+\.)*vidyard\.com(?:[:/?#]\|$)` | Vidyard | `*.vidyard.com` |
| Vizzit | `^https?://(?:[a-z0-9-]+\.)*vizzit\.se(?:[:/?#]\|$)` | Vizzit | `*.vizzit.se` |
| Weborama | `^https?://(?:[a-z0-9-]+\.)*weborama\.com(?:[:/?#]\|$)` | Weborama | `*.weborama.com` |
| Weborama | `^https?://(?:[a-z0-9-]+\.)*weborama\.fr(?:[:/?#]\|$)` | Weborama | `*.weborama.fr` |
| Wishpond | `^https?://(?:[a-z0-9-]+\.)*wishpond\.net(?:[:/?#]\|$)` | Wishpond Technologies | `*.wishpond.net` |
| Wistia | `^https?://(?:[a-z0-9-]+\.)*wistia\.net(?:[:/?#]\|$)` | Wistia | `*.wistia.net` |
| Woosmap | `^https?://(?:[a-z0-9-]+\.)*woosmap\.com(?:[:/?#]\|$)` | Woosmap | `*.woosmap.com` |
| Wunderkind | `^https?://(?:[a-z0-9-]+\.)*wknd\.ai(?:[:/?#]\|$)` | Wunderkind | `*.wknd.ai` |
| Wurfl | `^https?://(?:[a-z0-9-]+\.)*wurflcloud\.com(?:[:/?#]\|$)` | ScientiaMobile | `*.wurflcloud.com` |
| Yandex Maps | `^https?://api-maps\.yandex\.ru(?:[:/?#]\|$)` | Yandex APIs | `api-maps.yandex.ru` |
| Zeta Zync | `^https?://(?:[a-z0-9-]+\.)*rezync\.com(?:[:/?#]\|$)` | Zync | `*.rezync.com` |
| eKomi | `^https?://(?:[a-z0-9-]+\.)*ekomi\.com(?:[:/?#]\|$)` | eKomi | `*.ekomi.com` |
| emetriq | `^https?://(?:[a-z0-9-]+\.)*xplosion\.de(?:[:/?#]\|$)` | emetriq | `*.xplosion.de` |
| iPROM | `^https?://(?:[a-z0-9-]+\.)*iprom\.net(?:[:/?#]\|$)` | iPROM | `*.iprom.net` |
| mediarithmics | `^https?://(?:[a-z0-9-]+\.)*mediarithmics\.com(?:[:/?#]\|$)` | mediarithmics | `*.mediarithmics.com` |
