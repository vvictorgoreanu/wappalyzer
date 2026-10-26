# FingerprintHub attribution

This commit imports technology detection data derived from [0x727/FingerprintHub](https://github.com/0x727/FingerprintHub) at `e0443cd4f76b1a5519a7eb5d17a1355e43483e5f` (`web_fingerprint_v4.json`), licensed MIT. The accompanying `LICENSE-fingerprinthub.md` is copied from that upstream commit.

Each row lists an imported technology, its converted signal, and the upstream rule and matcher text it came from. Conversion rules and review decisions are recorded in the extension repository under `docs/ai/fingerprinthub-import/`.

| Technology | Signal | Upstream rule | Original matcher |
| --- | --- | --- | --- |
| 53KF | html `powered by 53kf` | `web-fingerprint/00_unknown/53kf.yaml` | `powered by 53kf` |
| 74cms | html `powered by <a href="http://www\.74cms\.com/"` | `web-fingerprint/74cms/74cms.yaml` | `powered by <a href="http://www.74cms.com/"` |
| ActiveCollab | html `<p id="powered_by"><a href="http://www\.activecollab\.com/"` | `web-fingerprint/00_unknown/activecollab.yaml` | `<p id="powered_by"><a href="http://www.activecollab.com/"` |
| ActiveCollab | html `powered by activecollab` | `web-fingerprint/00_unknown/activecollab.yaml` | `powered by activecollab` |
| AcyMailing | html `com_acym` | `web-fingerprint/acyba/acymailing.yaml` | `com_acym` |
| Ads Pro Plugin | html `/wp-content/plugins/ap-plugin-scripteo` | `web-fingerprint/scripteo/ads_pro.yaml` | `/wp-content/plugins/ap-plugin-scripteo` |
| Alibaba Cloud OSS | headers (server) `^aliyunoss` | `web-fingerprint/00_unknown/aliyunoss.yaml` | `server: aliyunoss` |
| Alibaba Mail | html `^(?=[\s\S]{0,}?action="/alimail/error/browserlog)(?=[\s\S]{0,}?content="阿里企业邮箱)` | `web-fingerprint/00_unknown/alibaba-企业邮箱.yaml` | `action="/alimail/error/browserlog AND content="阿里企业邮箱` |
| Alibaba Mail | html `action="/alimail/error/browserlog` | `web-fingerprint/00_unknown/yunkemail.yaml` | `action="/alimail/error/browserlog` |
| Apache Struts | html `="struts\.token\.name"` | `web-fingerprint/apache/struts.yaml` | `="struts.token.name"` |
| Apusic Application Server | headers (server) `^apusic application server` | `web-fingerprint/00_unknown/apusic.yaml` | `server: apusic application server` |
| Atmail | html `powered by atmail` | `web-fingerprint/atmail/atmail.yaml` | `powered by atmail` |
| Bitbucket | html `bitbucket\.page\.login` | `web-fingerprint/00_unknown/bitbucket.yaml` | `bitbucket.page.login` |
| Broken Link Notifier | html `blnotifier_front_end` | `web-fingerprint/broken_link_notifier_project/broken_link_notifier.yaml` | `blnotifier_front_end` |
| Casdoor | html `^(?=[\s\S]{0,}?<title>casdoor)(?=[\s\S]{0,}?casdoor/manifest\.json)` | `web-fingerprint/casbin/casbin.yaml` | `<title>casdoor AND casdoor/manifest.json` |
| Citadel | html `/styles/webcit\.css` | `web-fingerprint/00_unknown/citadel-servers.yaml` | `/styles/webcit.css` |
| Citadel | html `<div class="boxlabel">citadel server - powered by` | `web-fingerprint/00_unknown/citadel-servers.yaml` | `<div class="boxlabel">citadel server - powered by` |
| Clientexec | html `powered by clientexec` | `web-fingerprint/00_unknown/clientexec.yaml` | `powered by clientexec` |
| ClipBucket | html `^(?=[\s\S]{0,}?<!-- clipbucket)(?=[\s\S]{0,}?content="clipbucket)` | `web-fingerprint/00_unknown/clipbucket.yaml` | `<!-- clipbucket AND content="clipbucket` |
| ClipBucket | html `<!-- forged by clipbucket` | `web-fingerprint/00_unknown/clipbucket.yaml` | `<!-- forged by clipbucket` |
| CmsTop | html `^(?=[\s\S]{0,}?<a class="poweredby" href="http://www\.cmstop\.com")(?=[\s\S]{0,}?cmstop-list-text\.css)` | `web-fingerprint/00_unknown/cmstop.yaml` | `<a class="poweredby" href="http://www.cmstop.com" AND cmstop-list-text.css` |
| CmsTop | html `/css/cmstop-common\.css` | `web-fingerprint/00_unknown/cmstop.yaml` | `/css/cmstop-common.css` |
| CmsTop | html `/js/cmstop-common\.js` | `web-fingerprint/00_unknown/cmstop.yaml` | `/js/cmstop-common.js` |
| CommuniGate Pro | headers (server) `^communigatepro` | `web-fingerprint/00_unknown/communigate-pro.yaml` | `server: communigatepro` |
| Confluence | html `^(?=[\s\S]{0,}?id="com-atlassian-confluence)(?=[\s\S]{0,}?name="confluence-base-url")` | `web-fingerprint/00_unknown/confluence.yaml` | `id="com-atlassian-confluence AND name="confluence-base-url"` |
| Coremail | html `/coremail/bundle/` | `web-fingerprint/00_unknown/coremail.yaml` | `/coremail/bundle/` |
| Coremail | html `action="/coremail/index\.jsp` | `web-fingerprint/00_unknown/coremail.yaml` | `action="/coremail/index.jsp` |
| Coremail | html `coremail/common` | `web-fingerprint/00_unknown/coremail.yaml` | `coremail/common` |
| Coremail | html `fmt_logoalt: "coremail 电子邮件系统` | `web-fingerprint/00_unknown/coremail.yaml` | `fmt_logoalt: "coremail 电子邮件系统` |
| Download Manager | html `wp-content/plugins/download-manager/` | `web-fingerprint/w3eden/download_manager.yaml` | `wp-content/plugins/download-manager/` |
| EduSoho | html `powered by <a href="http://www\.edusoho\.com/" target="_blank">edusoho` | `web-fingerprint/hagzhou-kuozhi-network-technology/edusoho.yaml` | `powered by <a href="http://www.edusoho.com/" target="_blank">edusoho` |
| EduSoho | html `powered by edusoho` | `web-fingerprint/00_unknown/edusoho-open-source-web-classroom-.yaml` | `powered by edusoho` |
| Eventin | html `/wp-content/plugins/eventin` | `web-fingerprint/themewinter/eventin.yaml` | `/wp-content/plugins/eventin` |
| Everest Forms Pro | html `/wp-content/plugins/everest-forms-pro/` | `web-fingerprint/wpeverest/everest-forms-pro.yaml` | `/wp-content/plugins/everest-forms-pro/` |
| GEO my WP | html `/wp-content/plugins/geo-my-wp/` | `web-fingerprint/developer.developer/geo-my-wp.yaml` | `/wp-content/plugins/geo-my-wp/` |
| GeoNode | html `href="/catalogue/opensearch" title="geonode search` | `web-fingerprint/00_unknown/geonode.yaml` | `href="/catalogue/opensearch" title="geonode search` |
| GeoNode | html `powered by <a href="http://geonode\.org` | `web-fingerprint/00_unknown/geonode.yaml` | `powered by <a href="http://geonode.org` |
| Gift Cards For WooCommerce Pro | html `/wp-content/plugins/woocommerce-ultimate-gift-card` | `web-fingerprint/wpswings/woocommerce_ultimate_gift_card.yaml` | `/wp-content/plugins/woocommerce-ultimate-gift-card` |
| Gradio | html `__gradio_mode__` | `web-fingerprint/gradio_project/gradio.yaml` | `__gradio_mode__` |
| Group-Office | html `"theme":"group-office",` | `web-fingerprint/00_unknown/group-office.yaml` | `"theme":"group-office",` |
| Group-Office | html `powered by group-office` | `web-fingerprint/00_unknown/group-office.yaml` | `powered by group-office` |
| Hanweb JCMS | html `/jcms_files/jcms` | `web-fingerprint/00_unknown/hanweb-system.yaml` | `/jcms_files/jcms` |
| Horde | html `_sethordetitle` | `web-fingerprint/horde/horde.yaml` | `_sethordetitle` |
| Horde | html `imp: copyright 2001-2009 the horde project` | `web-fingerprint/horde/horde.yaml` | `imp: copyright 2001-2009 the horde project` |
| HostBill | html `powered by <a href="http://hostbillapp\.com` | `web-fingerprint/00_unknown/hostbill.yaml` | `powered by <a href="http://hostbillapp.com` |
| IBM CICS Transaction Server | headers (server) `^ibm_cics_transaction_server` | `web-fingerprint/00_unknown/ibm-cics-transaction-server.yaml` | `server: ibm_cics_transaction_server` |
| IBM WebSEAL | headers (server) `^webseal` | `web-fingerprint/00_unknown/ibm-webseal.yaml` | `server: webseal` |
| Kaipuyun Search | html `src="http://so\.kaipuyun\.cn\?sitecode=` | `web-fingerprint/00_unknown/ucap-search-.yaml` | `src="http://so.kaipuyun.cn?sitecode=` |
| Kerio Connect | headers (server) `^kerio connect` | `web-fingerprint/00_unknown/kerio-connect.yaml` | `server: kerio connect` |
| LaRecipe | html `/binarytorch/larecipe/` | `web-fingerprint/binarytorch/larecipe.yaml` | `/binarytorch/larecipe/` |
| LeadConnector | html `/wp-content/plugins/leadconnector/` | `web-fingerprint/leadconnector/leadconnector.yaml` | `/wp-content/plugins/leadconnector/` |
| LearnPress | html `/wp-content/plugins/learnpress` | `web-fingerprint/thimpress/learnpress.yaml` | `/wp-content/plugins/learnpress` |
| ListingPro | html `/wp-content/plugins/listingpro` | `web-fingerprint/cridio/listingpro.yaml` | `/wp-content/plugins/listingpro` |
| MCMS | html `/mcms/search\.do" method=` | `web-fingerprint/00_unknown/铭飞mcms.yaml` | `/mcms/search.do" method=` |
| MacCMS | html `<script>var maccms=\{"path` | `web-fingerprint/00_unknown/maccms.yaml` | `<script>var maccms={"path` |
| Mail Mint | html `/wp-content/plugins/mail-mint/` | `web-fingerprint/mail-mint/mail-mint.yaml` | `/wp-content/plugins/mail-mint/` |
| MasterStudy LMS | html `/wp-content/plugins/masterstudy-lms-learning-management-system/` | `web-fingerprint/stylemix/masterstudy-lms.yaml` | `/wp-content/plugins/masterstudy-lms-learning-management-system/` |
| MetInfo | html `<div class="powered_by_metinfo"></div>` | `web-fingerprint/metinfo/metinfo.yaml` | `<div class="powered_by_metinfo"></div>` |
| MetInfo | html `<meta name="generator" content="metinfo` | `web-fingerprint/metinfo/metinfo.yaml` | `<meta name="generator" content="metinfo` |
| NetTalk | headers (server) `^nettalk-webserver` | `web-fingerprint/00_unknown/nettalk-webserver.yaml` | `server: nettalk-webserver` |
| Ninja Tables | html `/wp-content/plugins/ninja-tables/` | `web-fingerprint/wpxpo/ninja-tables.yaml` | `/wp-content/plugins/ninja-tables/` |
| NotificationX | html `/wp-content/plugins/notificationx` | `web-fingerprint/wpdeveloper/notificationx.yaml` | `/wp-content/plugins/notificationx` |
| OpenAM | html `action="/openam/ui/login"` | `web-fingerprint/00_unknown/openam.yaml` | `action="/openam/ui/login"` |
| OpenConf | html `powered by <a href="http://www\.openconf\.org` | `web-fingerprint/00_unknown/openconf.yaml` | `powered by <a href="http://www.openconf.org` |
| OpenConf | html `src="openconf\.js\?` | `web-fingerprint/00_unknown/openconf.yaml` | `src="openconf.js?` |
| OpenConf | cookies (openconf) `` | `web-fingerprint/00_unknown/openconf.yaml` | `set-cookie: openconf=` |
| Page Builder CK | html `com_pagebuilderck` | `web-fingerprint/joomlack/page_builder_ck.yaml` | `com_pagebuilderck` |
| PbootCMS | cookies (pbootsystem) `` | `web-fingerprint/00_unknown/pbootcms.yaml` | `set-cookie: pbootsystem=` |
| Post Timeline | html `wp-content/plugins/post-timeline/` | `web-fingerprint/agilelogix/post-timeline.yaml` | `wp-content/plugins/post-timeline/` |
| Print Invoice & Delivery Notes for WooCommerce | html `wp-content/plugins/woocommerce-delivery-notes/` | `web-fingerprint/tychesoftwares/woocommerce-delivery-notes.yaml` | `wp-content/plugins/woocommerce-delivery-notes/` |
| Qubely | html `qubely_urls` | `web-fingerprint/themeum/qubely.yaml` | `qubely_urls` |
| Relevanssi | html `/wp-content/plugins/relevanssi/` | `web-fingerprint/relevanssi/relevanssi.yaml` | `/wp-content/plugins/relevanssi/` |
| Request a Quote for WooCommerce | html `/wp-content/plugins/woocommerce-request-a-quote/` | `web-fingerprint/addify/woocommerce-request-a-quote.yaml` | `/wp-content/plugins/woocommerce-request-a-quote/` |
| Seafile | html `css/seahub\.min\.css` | `web-fingerprint/seafile/seafile.yaml` | `css/seahub.min.css` |
| Simple Job Board | html `/wp-content/plugins/simple-job-board` | `web-fingerprint/awsm/simple_job_board.yaml` | `/wp-content/plugins/simple-job-board` |
| Tag Groups | html `/wp-content/plugins/tag-groups/` | `web-fingerprint/publishpress/tag-groups.yaml` | `/wp-content/plugins/tag-groups/` |
| ThemeGrill Demo Importer | html `/plugins/themegrill-demo-importer` | `web-fingerprint/themegrill/themegrill-demo-importer.yaml` | `/plugins/themegrill-demo-importer` |
| ThinkCMF | html `made by <a href="http://www\.thinkcmf\.com" target="_blank">thinkcmf</a>` | `web-fingerprint/thinkcmf/thinkcmf.yaml` | `made by <a href="http://www.thinkcmf.com" target="_blank">thinkcmf</a>` |
| ThinkCMF | headers (x-powered-by) `^thinkcmf` | `web-fingerprint/thinkcmf/thinkcmf.yaml` | `x-powered-by: thinkcmf` |
| ThinkJS | headers (x-powered-by) `^thinkjs` | `web-fingerprint/00_unknown/thinkjs.yaml` | `x-powered-by: thinkjs` |
| TongWeb | headers (server) `^tongweb server` | `web-fingerprint/00_unknown/东方通tongweb应用服务器.yaml` | `server: tongweb server` |
| TurboMail | html `^(?=[\s\S]{0,}?powered by turbomail)(?=[\s\S]{0,}?wzcon1 clearfix)` | `web-fingerprint/00_unknown/turbomail.yaml` | `powered by turbomail AND wzcon1 clearfix` |
| TurboMail | html `<a href="http://www\.turbomail\.org">powered by turbomail</a>` | `web-fingerprint/00_unknown/turbomail.yaml` | `<a href="http://www.turbomail.org">powered by turbomail</a>` |
| U-Mail | html `power by <a href="http://www\.comingchina\.com">u-mail邮件服务器</a>` | `web-fingerprint/00_unknown/u-mail.yaml` | `power by <a href="http://www.comingchina.com">u-mail邮件服务器</a>` |
| WP Directory Kit | html `/wp-content/plugins/wpdirectorykit/` | `web-fingerprint/wpdirectorykit/wpdirectorykit.yaml` | `/wp-content/plugins/wpdirectorykit/` |
| WP Fast Total Search | html `wp-content/plugins/fulltext-search` | `web-fingerprint/wp-fast-total-search/wp_fast_total_search.yaml` | `wp-content/plugins/fulltext-search` |
| WP Go Maps | html `/wp-content/plugins/wp-google-maps` | `web-fingerprint/codecabin/wp_go_maps.yaml` | `/wp-content/plugins/wp-google-maps` |
| WP Hotel Booking | html `/wp-content/plugins/wp-hotel-booking/` | `web-fingerprint/thimpress/wp-hotel-booking.yaml` | `/wp-content/plugins/wp-hotel-booking/` |
| WP Maps Pro | html `/wp-content/plugins/wp-maps-pro/` | `web-fingerprint/flippercode/wp-google-map-gold.yaml` | `/wp-content/plugins/wp-maps-pro/` |
| WPBookit | html `/wp-content/plugins/wpbookit/` | `web-fingerprint/iqonicdesign/wpbookit.yaml` | `/wp-content/plugins/wpbookit/` |
| WPMobile.App | html `/wp-content/plugins/wpappninja` | `web-fingerprint/wpmobile.app/wpmobile.app.yaml` | `/wp-content/plugins/wpappninja` |
| WPS Hide Login | html `/wp-content/plugins/wps-hide-login` | `web-fingerprint/wpserveur/wps-hide-login.yaml` | `/wp-content/plugins/wps-hide-login` |
| WPZOOM Portfolio | html `/wp-content/plugins/wpzoom-portfolio` | `web-fingerprint/wpzoom/wpzoom-portfolio.yaml` | `/wp-content/plugins/wpzoom-portfolio` |
| WPvivid Backup & Migration | html `wp-content/plugins/wpvivid-backuprestore` | `web-fingerprint/wpvivid/wpvivid-backuprestore.yaml` | `wp-content/plugins/wpvivid-backuprestore` |
| WebIssues | html `<div id="header-right">webissues` | `web-fingerprint/00_unknown/webissues.yaml` | `<div id="header-right">webissues` |
| Werkzeug | headers (server) `^werkzeug` | `web-fingerprint/00_unknown/werkzeug.yaml` | `server: werkzeug` |
| Wing FTP Server | headers (server) `^wing ftp server` | `web-fingerprint/00_unknown/wing-ftp-server.yaml` | `server: wing ftp server` |
| Winmail Server | html `^(?=[\s\S]{0,}?\(build )(?=[\s\S]{0,}?background="customer/winmail_bg11\.jpg)` | `web-fingerprint/00_unknown/winmail-server.yaml` | `(build  AND background="customer/winmail_bg11.jpg` |
| Wowza Streaming Engine | headers (server) `^wowzastreamingengine` | `web-fingerprint/00_unknown/wowza-wowzastreamingengine.yaml` | `server: wowzastreamingengine` |
| Z-Blog | html `generator" content="z-blog` | `web-fingerprint/00_unknown/z-blog.yaml` | `generator" content="z-blog` |
| Zotonic | html `^(?=[\s\S]{0,}?/lib/js/apps/zotonic-1\.0)(?=[\s\S]{0,}?powered by: zotonic)` | `web-fingerprint/00_unknown/zotonic.yaml` | `/lib/js/apps/zotonic-1.0 AND powered by: zotonic` |
| b2evolution | html `powered by b2evolution` | `web-fingerprint/b2evolution/b2evolution.yaml` | `powered by b2evolution` |
| iCagenda | html `com_icagenda` | `web-fingerprint/joomlic/icagenda.yaml` | `com_icagenda` |
| miniBB | html `<!--minibb copyright link` | `web-fingerprint/00_unknown/minibb.yaml` | `<!--minibb copyright link` |
| miniBB | html `powered by <a href="http://www\.minibb\.` | `web-fingerprint/00_unknown/minibb.yaml` | `powered by <a href="http://www.minibb.` |
| phpList | html `^(?=[\s\S]{0,}?content="michiel dethmers - http://www\.phplist\.com)(?=[\s\S]{0,}?content="phplist version)` | `web-fingerprint/00_unknown/phplist-邮件系统.yaml` | `content="michiel dethmers - http://www.phplist.com AND content="phplist version` |
| tagDiv Composer | html `/wp-content/plugins/td-composer` | `web-fingerprint/tagdiv/tagdiv_composer.yaml` | `/wp-content/plugins/td-composer` |
| wpDiscuz | html `/wp-content/plugins/wpdiscuz` | `web-fingerprint/gvectors/wpdiscuz.yaml` | `/wp-content/plugins/wpdiscuz` |
