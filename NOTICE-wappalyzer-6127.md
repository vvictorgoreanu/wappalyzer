# Wappalyzer 6.12.7 catalog import

This branch adds 356 complete technology entries from the saved Wappalyzer browser extension 6.12.7 catalog. The existing 8677 fork entries are unchanged.

- Source extension artifact SHA-256: `e4a8c81011ccfb3c990db4061e7ed7ff320f33af2cdaf070d34d194b3224dbc0`
- Structured export SHA-256: `c6ea2576ca11e23bd471d9de3d8dfa64053a4c218a02c6d9c81228f02eb4e683`
- Fork baseline catalog commit: `f878fce28a28faa93cef201539019c43d67beb13`
- Historical gap: 363 names; 7 already represented by the fork; 356 added.

This notice records technical provenance. It does not assert a license grant for the source artifact.

## Fork channel compatibility

The fork's `xhr` channel receives only a hostname. The six source patterns below contain URL paths, so the import moves each unchanged pattern to `xhrUrl`, which receives the full request URL. No other source field changes. The frozen source objects remain in `selection.json` in the StackLookup integration record.

| Technology | Source channel | Fork channel | Reason |
| --- | --- | --- | --- |
| BudgetGuard | `xhr` | `xhrUrl` | Pattern contains `/api/tracking/` |
| Froomle | `xhr` | `xhrUrl` | Pattern contains `/api/` |
| Knoku | `xhr` | `xhrUrl` | Pattern contains `/api/v1/config/` |
| Rentware | `xhr` | `xhrUrl` | Pattern contains `/booking/system` |
| Selify | `xhr` | `xhrUrl` | Pattern contains `/v1` |
| UseClick | `xhr` | `xhrUrl` | Pattern contains `/api/analytics/collect` |

## Added technologies

| Technology | Source file | Source line |
| --- | --- | ---: |
| 220Marketing | `technologies/_.json` | 48 |
| 2people | `technologies/_.json` | 105 |
| ANDCommerce | `technologies/a.json` | 262 |
| APILayer | `technologies/a.json` | 357 |
| AXENTRA OS | `technologies/a.json` | 529 |
| Accelevents | `technologies/a.json` | 683 |
| AccessGo | `technologies/a.json` | 753 |
| ActiveNow | `technologies/a.json` | 1295 |
| Agnicart | `technologies/a.json` | 2856 |
| Aimharder | `technologies/a.json` | 3038 |
| Airwallex | `technologies/a.json` | 3220 |
| Akoova | `technologies/a.json` | 3541 |
| AlloIncognito | `technologies/a.json` | 3949 |
| Amondo | `technologies/a.json` | 4550 |
| Anviara EU Widerrufsbutton | `technologies/a.json` | 5211 |
| Anybot | `technologies/a.json` | 5261 |
| Appfolio | `technologies/a.json` | 5669 |
| Approcket | `technologies/a.json` | 5930 |
| Assoconnect | `technologies/a.json` | 6876 |
| Assortion | `technologies/a.json` | 6893 |
| Atarim | `technologies/a.json` | 7028 |
| Audienceful | `technologies/a.json` | 7336 |
| Audigent | `technologies/a.json` | 7352 |
| Autegro | `technologies/a.json` | 7501 |
| B Cart | `technologies/b.json` | 2 |
| BLR | `technologies/b.json` | 157 |
| BSS Commerce | `technologies/b.json` | 259 |
| Baseet | `technologies/b.json` | 776 |
| Baycloud | `technologies/b.json` | 906 |
| Beepworld | `technologies/b.json` | 1227 |
| Big Tuna | `technologies/b.json` | 1736 |
| BigBlueButton | `technologies/b.json` | 1746 |
| Bisup | `technologies/b.json` | 2030 |
| Bit Assist | `technologies/b.json` | 2046 |
| Bit Form | `technologies/b.json` | 2068 |
| Bits UI | `technologies/b.json` | 2175 |
| Blanxer | `technologies/b.json` | 2295 |
| BoardDocs | `technologies/b.json` | 2877 |
| Booljs | `technologies/b.json` | 3745 |
| Botco.ai | `technologies/b.json` | 4072 |
| Botfaqtor | `technologies/b.json` | 4086 |
| BounceHelp | `technologies/b.json` | 4270 |
| BrandRep | `technologies/b.json` | 4464 |
| Brandnamic | `technologies/b.json` | 4495 |
| Brella | `technologies/b.json` | 4653 |
| BuckyDrop | `technologies/b.json` | 5089 |
| Buddy eCommerce | `technologies/b.json` | 5119 |
| BudgetGuard | `technologies/b.json` | 5146 |
| Buildify | `technologies/b.json` | 5281 |
| Buildium | `technologies/b.json` | 5299 |
| Buildout | `technologies/b.json` | 5313 |
| CampusGroups | `technologies/c.json` | 915 |
| Canvify | `technologies/c.json` | 1073 |
| Capital Turbine | `technologies/c.json` | 1111 |
| Carepatron | `technologies/c.json` | 1350 |
| Casablanca | `technologies/c.json` | 1758 |
| Chiromatrix | `technologies/c.json` | 3194 |
| ChurchDesk | `technologies/c.json` | 3301 |
| Coassemble | `technologies/c.json` | 5120 |
| CommBox | `technologies/c.json` | 5763 |
| Commrz | `technologies/c.json` | 5957 |
| ComplyDog | `technologies/c.json` | 6056 |
| Configio | `technologies/c.json` | 6238 |
| Contrib | `technologies/c.json` | 6729 |
| Contribly | `technologies/c.json` | 6742 |
| CookieTractor | `technologies/c.json` | 7345 |
| CrystalCommerce | `technologies/c.json` | 8483 |
| CssUserAgent | `technologies/c.json` | 8513 |
| CusRev | `technologies/c.json` | 8622 |
| D4 Core | `technologies/d.json` | 29 |
| DMVCFramework | `technologies/d.json` | 184 |
| DZBuild | `technologies/d.json` | 312 |
| Dearnex | `technologies/d.json` | 1043 |
| Dehasoft E-Ticaret | `technologies/d.json` | 1179 |
| Delta Commerce | `technologies/d.json` | 1350 |
| DevBlox Hub | `technologies/d.json` | 1663 |
| Dezrez | `technologies/d.json` | 1806 |
| Dioxus | `technologies/d.json` | 2133 |
| Docebo | `technologies/d.json` | 2496 |
| Dockview | `technologies/d.json` | 2534 |
| Dockvine | `technologies/d.json` | 2544 |
| Docus | `technologies/d.json` | 2652 |
| Ecer | `technologies/e.json` | 743 |
| Ecom | `technologies/e.json` | 755 |
| Eflorista | `technologies/e.json` | 1123 |
| Elephantfy | `technologies/e.json` | 1449 |
| Enllax | `technologies/e.json` | 2180 |
| EnvialoSimple | `technologies/e.json` | 2311 |
| Equalbrowse | `technologies/e.json` | 2555 |
| Equalture | `technologies/e.json` | 2568 |
| Euroweb | `technologies/e.json` | 2905 |
| Experiture | `technologies/e.json` | 3333 |
| FalakCart | `technologies/f.json` | 277 |
| Flare | `technologies/f.json` | 1794 |
| Flotiq | `technologies/f.json` | 2344 |
| FormCraft | `technologies/f.json` | 3141 |
| Formbricks | `technologies/f.json` | 3233 |
| Forsid | `technologies/f.json` | 3501 |
| FoxAppy | `technologies/f.json` | 3670 |
| FrankenPHP | `technologies/f.json` | 3796 |
| Froomle | `technologies/f.json` | 4450 |
| Funil de Vendas | `technologies/f.json` | 4710 |
| Genlook Virtual try-on | `technologies/g.json` | 747 |
| Gensolve | `technologies/g.json` | 764 |
| GetComplied | `technologies/g.json` | 977 |
| Giftnote | `technologies/g.json` | 1255 |
| Givy | `technologies/g.json` | 1573 |
| GoHire | `technologies/g.json` | 2268 |
| GoVoto | `technologies/g.json` | 2372 |
| Google for WooCommerce | `technologies/g.json` | 3102 |
| Gosuslugi | `technologies/g.json` | 3164 |
| Gradual | `technologies/g.json` | 3243 |
| Growthstack | `technologies/g.json` | 3957 |
| Gubagoo | `technologies/g.json` | 3994 |
| Gunosy | `technologies/g.json` | 4150 |
| Gupy | `technologies/g.json` | 4174 |
| HR Hotlink | `technologies/h.json` | 99 |
| HappyOrNot | `technologies/h.json` | 363 |
| Harmonizely | `technologies/h.json` | 455 |
| Harri | `technologies/h.json` | 487 |
| HatenaCMS | `technologies/h.json` | 580 |
| Helipod | `technologies/h.json` | 777 |
| Heureka Conversion Measurement | `technologies/h.json` | 1158 |
| HomeJunction | `technologies/h.json` | 1768 |
| HostChefs | `technologies/h.json` | 1936 |
| Hypersoft | `technologies/h.json` | 2826 |
| ISO100 | `technologies/i.json` | 220 |
| Iconify | `technologies/i.json` | 306 |
| ImobiBrasil | `technologies/i.json` | 728 |
| Impel | `technologies/i.json` | 755 |
| Incomaker | `technologies/i.json` | 1028 |
| Ingresse | `technologies/i.json` | 1306 |
| Inkybay | `technologies/i.json` | 1331 |
| InstanteStore | `technologies/i.json` | 1661 |
| Intelliplan | `technologies/i.json` | 1810 |
| Interspire Shopping Cart | `technologies/i.json` | 1981 |
| Interwow | `technologies/i.json` | 2018 |
| Intlayer | `technologies/i.json` | 2065 |
| Inwink | `technologies/i.json` | 2222 |
| Iyong | `technologies/i.json` | 2439 |
| Jaspr | `technologies/j.json` | 332 |
| Jetimob | `technologies/j.json` | 535 |
| Jimo | `technologies/j.json` | 676 |
| Jscrambler | `technologies/j.json` | 1052 |
| K50 | `technologies/k.json` | 27 |
| KOMERO | `technologies/k.json` | 86 |
| KPA | `technologies/k.json` | 98 |
| Kaily.ai | `technologies/k.json` | 254 |
| KePixel | `technologies/k.json` | 667 |
| Keycloak | `technologies/k.json` | 981 |
| Kleep | `technologies/k.json` | 1593 |
| Knoku | `technologies/k.json` | 1820 |
| Kobisi | `technologies/k.json` | 1971 |
| Komerza | `technologies/k.json` | 2064 |
| Kx AI Search & Discovery Agent | `technologies/k.json` | 2591 |
| LLK Analytics | `technologies/l.json` | 79 |
| Laioutr | `technologies/l.json` | 179 |
| LaunchLMS | `technologies/l.json` | 369 |
| LaunchMyStore | `technologies/l.json` | 384 |
| Lead Recorder | `technologies/l.json` | 644 |
| LegitFit | `technologies/l.json` | 1236 |
| LerenTools | `technologies/l.json` | 1339 |
| Lindo.ai | `technologies/l.json` | 1844 |
| LiveChatAI | `technologies/l.json` | 2419 |
| Loyalistic | `technologies/l.json` | 3444 |
| Madgex | `technologies/m.json` | 399 |
| Mage Loyalty | `technologies/m.json` | 445 |
| MaidCentral | `technologies/m.json` | 691 |
| Masthead CMS | `technologies/m.json` | 1872 |
| Material for MkDocs | `technologies/m.json` | 1971 |
| Mavrck | `technologies/m.json` | 2155 |
| Mayson | `technologies/m.json` | 2266 |
| Mazeed+ | `technologies/m.json` | 2280 |
| Meiqia | `technologies/m.json` | 2562 |
| Meku | `technologies/m.json` | 2578 |
| MemberPress | `technologies/m.json` | 2655 |
| MingCute | `technologies/m.json` | 3828 |
| Mirra | `technologies/m.json` | 4011 |
| Momants | `technologies/m.json` | 4657 |
| Moya | `technologies/m.json` | 5383 |
| Moyasar | `technologies/m.json` | 5399 |
| Moyasar Plugin | `technologies/m.json` | 5407 |
| Musictoday | `technologies/m.json` | 5551 |
| MyNewTerm | `technologies/m.json` | 5823 |
| Nevuto | `technologies/n.json` | 929 |
| Nlet School | `technologies/n.json` | 1540 |
| NoShow | `technologies/n.json` | 1585 |
| NorthWhistle | `technologies/n.json` | 1859 |
| Nsin | `technologies/n.json` | 2120 |
| Oat UI | `technologies/o.json` | 113 |
| Odometer.js | `technologies/o.json` | 430 |
| OmniWallet | `technologies/o.json` | 792 |
| One Church Software | `technologies/o.json` | 1008 |
| Onjax | `technologies/o.json` | 1281 |
| Open Game Panel | `technologies/o.json` | 1442 |
| OpenAI Ads Measurement Pixel | `technologies/o.json` | 1538 |
| OpenDXP | `technologies/o.json` | 1629 |
| OpenWeatherMap | `technologies/o.json` | 1855 |
| Operoo | `technologies/o.json` | 1928 |
| OptKit | `technologies/o.json` | 2007 |
| Oracle Linux | `technologies/o.json` | 2367 |
| Orange CDB | `technologies/o.json` | 2459 |
| Orioly | `technologies/o.json` | 2719 |
| OwnerRez | `technologies/o.json` | 3065 |
| PageLines | `technologies/p.json` | 506 |
| Pagefind | `technologies/p.json` | 588 |
| PaymentForm.io | `technologies/p.json` | 1660 |
| Payzito | `technologies/p.json` | 1787 |
| Pitchero | `technologies/p.json` | 3231 |
| Pointat | `technologies/p.json` | 4330 |
| Popsixle | `technologies/p.json` | 4605 |
| Populi | `technologies/p.json` | 4667 |
| PostFinance Checkout | `technologies/p.json` | 4851 |
| Pozvonim | `technologies/p.json` | 5223 |
| Profile Builder | `technologies/p.json` | 6131 |
| PropertyMeld | `technologies/p.json` | 6509 |
| Pushnews | `technologies/p.json` | 7454 |
| Quickly | `technologies/q.json` | 714 |
| QuinBook | `technologies/q.json` | 796 |
| RAMP Interactive | `technologies/r.json` | 2 |
| RVGlobalSoft | `technologies/r.json` | 291 |
| Rackspace | `technologies/r.json` | 364 |
| RapiDoc | `technologies/r.json` | 764 |
| RateAbiz | `technologies/r.json` | 923 |
| RaveCapture | `technologies/r.json` | 961 |
| ReQruiting | `technologies/r.json` | 1148 |
| React Aria | `technologies/r.json` | 1225 |
| Readdy | `technologies/r.json` | 1426 |
| Recranet | `technologies/r.json` | 1826 |
| Recruitics | `technologies/r.json` | 1880 |
| Referrizer | `technologies/r.json` | 2250 |
| RegistrationMagic | `technologies/r.json` | 2416 |
| Reniwn | `technologies/r.json` | 2694 |
| Rentware | `technologies/r.json` | 2735 |
| RepairDesk | `technologies/r.json` | 2772 |
| ReplySuite | `technologies/r.json` | 2840 |
| Revotas | `technologies/r.json` | 3838 |
| Rivo | `technologies/r.json` | 4312 |
| Rivyo | `technologies/r.json` | 4323 |
| Robocote | `technologies/r.json` | 4438 |
| SEOJuice | `technologies/s.json` | 178 |
| STRIGHT | `technologies/s.json` | 452 |
| Sadrhub | `technologies/s.json` | 633 |
| Salam | `technologies/s.json` | 767 |
| SalesDrip | `technologies/s.json` | 850 |
| Salesforce Data 360 | `technologies/s.json` | 1057 |
| Salesgear | `technologies/s.json` | 1177 |
| Salonkee | `technologies/s.json` | 1281 |
| Schudio | `technologies/s.json` | 1824 |
| Sekolahku | `technologies/s.json` | 2443 |
| Seldit | `technologies/s.json` | 2460 |
| Selify | `technologies/s.json` | 2507 |
| Sellauth | `technologies/s.json` | 2586 |
| Sensei LMS | `technologies/s.json` | 3063 |
| Sepid | `technologies/s.json` | 3178 |
| Shakebug | `technologies/s.json` | 3471 |
| Shopaccino | `technologies/s.json` | 4273 |
| Shorthand | `technologies/s.json` | 5108 |
| Silk | `technologies/s.json` | 5469 |
| SiteNano | `technologies/s.json` | 6170 |
| Sitepins | `technologies/s.json` | 6509 |
| Skillspace | `technologies/s.json` | 6816 |
| Sleak.chat | `technologies/s.json` | 7068 |
| Slim Framework | `technologies/s.json` | 7239 |
| Slotted | `technologies/s.json` | 7294 |
| SmartEditor2 | `technologies/s.json` | 7421 |
| Smartjobboard | `technologies/s.json` | 7496 |
| Smartypilot | `technologies/s.json` | 7627 |
| Smink | `technologies/s.json` | 7742 |
| Smith.ai | `technologies/s.json` | 7755 |
| SnapApp | `technologies/s.json` | 7866 |
| SplashThat | `technologies/s.json` | 9383 |
| Stebby | `technologies/s.json` | 10741 |
| StepFORM | `technologies/s.json` | 10791 |
| Streak.js | `technologies/s.json` | 11356 |
| SupaDupa | `technologies/s.json` | 11961 |
| Supermetrics | `technologies/s.json` | 12183 |
| SupportBox | `technologies/s.json` | 12228 |
| Supportly | `technologies/s.json` | 12246 |
| SureCritic | `technologies/s.json` | 12287 |
| SweetCode Pixel Manager for WooCommerce | `technologies/s.json` | 12580 |
| Système de Design de l'État | `technologies/s.json` | 13059 |
| TMW Shield | `technologies/t.json` | 204 |
| Tabler Icons | `technologies/t.json` | 456 |
| Tachyon Forge | `technologies/t.json` | 511 |
| Teletype App | `technologies/t.json` | 1639 |
| That Open Engine | `technologies/t.json` | 1969 |
| The Newsletter Plugin | `technologies/t.json` | 2089 |
| TheraPsy Bookings | `technologies/t.json` | 2686 |
| Tiendana | `technologies/t.json` | 3271 |
| Tijara Plus | `technologies/t.json` | 3336 |
| Transpond | `technologies/t.json` | 4617 |
| Treatwell | `technologies/t.json` | 4740 |
| Trello | `technologies/t.json` | 4757 |
| Trustmary | `technologies/t.json` | 5296 |
| Twipla | `technologies/t.json` | 5878 |
| Typedream | `technologies/t.json` | 6091 |
| Uappi | `technologies/u.json` | 164 |
| Ucraft | `technologies/u.json` | 253 |
| Uebfaqe | `technologies/u.json` | 271 |
| UnifyDesk | `technologies/u.json` | 699 |
| UpCloud Object Storage | `technologies/u.json` | 906 |
| UpContent | `technologies/u.json` | 923 |
| UseClick | `technologies/u.json` | 1355 |
| UseResponse | `technologies/u.json` | 1374 |
| VdoCipher | `technologies/v.json` | 441 |
| Vectera | `technologies/v.json` | 480 |
| Vee | `technologies/v.json` | 494 |
| VenueSumo | `technologies/v.json` | 679 |
| Vertical Booking | `technologies/v.json` | 1087 |
| VideoAsk | `technologies/v.json` | 1301 |
| Vinext | `technologies/v.json` | 1570 |
| VisitorTracking | `technologies/v.json` | 1886 |
| Vista HCM | `technologies/v.json` | 1924 |
| VoetbalAssist | `technologies/v.json` | 2149 |
| Volument | `technologies/v.json` | 2230 |
| Vortala | `technologies/v.json` | 2362 |
| Vost Veter | `technologies/v.json` | 2375 |
| Voyado | `technologies/v.json` | 2453 |
| WP Stratos | `technologies/w.json` | 441 |
| WP ULike | `technologies/w.json` | 456 |
| WaveRez | `technologies/w.json` | 994 |
| Wavoto | `technologies/w.json` | 1038 |
| Weasy | `technologies/w.json` | 1140 |
| WebToffee EU Order Withdrawal Button for WooCommerce | `technologies/w.json` | 1564 |
| Webmercs | `technologies/w.json` | 1981 |
| Webstorio | `technologies/w.json` | 2212 |
| Wegic | `technologies/w.json` | 2417 |
| Wirsindhandwerk | `technologies/w.json` | 3090 |
| Wobily | `technologies/w.json` | 3407 |
| WzShop | `technologies/w.json` | 4310 |
| XCompliant | `technologies/x.json` | 50 |
| Xendit | `technologies/x.json` | 214 |
| Yacla | `technologies/y.json` | 105 |
| Yaghoot Web | `technologies/y.json` | 115 |
| YouCanBookMe | `technologies/y.json` | 908 |
| ZClouding | `technologies/z.json` | 2 |
| ZOYEQ | `technologies/z.json` | 23 |
| Zapia | `technologies/z.json` | 209 |
| Zephyr Cloud | `technologies/z.json` | 661 |
| Zigaform | `technologies/z.json` | 873 |
| Zucks | `technologies/z.json` | 1513 |
| Zyncro | `technologies/z.json` | 1587 |
| alugha | `technologies/a.json` | 8437 |
| b10cks | `technologies/b.json` | 5673 |
| bValidator | `technologies/b.json` | 5708 |
| beseller | `technologies/b.json` | 5763 |
| docmd | `technologies/d.json` | 3932 |
| eTermin | `technologies/e.json` | 3954 |
| inCMS | `technologies/i.json` | 2856 |
| inPowered | `technologies/i.json` | 2872 |
| jrni | `technologies/j.json` | 1521 |
| kDrive | `technologies/k.json` | 2636 |
| miniOrange SAML SSO | `technologies/m.json` | 6207 |
| privIQ | `technologies/p.json` | 7908 |
| wpForo | `technologies/w.json` | 4431 |
