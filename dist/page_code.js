(function () {
    // Cut the mustard
    if ('querySelector' in window.parent.document &&
        'addEventListener' in window.parent
    ) {
        Ingestly.config({
            endpoint: 'stat.example.com',
            apiKey: '2ee204330a7b2701a6bf413473fcc486',
            eventName: 'ingestlyRecurringEvent',
            eventFrequency: 250,
            prefix: 'ingestly',
            targetWindow: 'self',
            options: {
                unload: {
                    enable: true
                },
                clicks: {
                    enable: true,
                    targetAttr: 'data-trackable'
                },
                scroll: {
                    enable: true,
                    threshold: 2,
                    granularity: 20,
                    unit: 'percent'
                },
                read: {
                    enable: true,
                    threshold: 2,
                    granularity: 20,
                    target: window.document.getElementById('article')
                },
                media: {
                    enable: true,
                    heartbeat: 5
                }
            }
        });

        Ingestly.init({
            userId: '',
            userStatus: '',
            userAttr: {},
            pageTitle: window.parent.document.title,
            pageAttr: {},
            contentId: '',
            contentHeadline: '',
            contentStatus: '',
            contentAttr: {},
            campaignCode: Ingestly.getQueryVal('cid'),
            campaignName: Ingestly.getQueryVal('utm_campaign'),
            campaignSource: Ingestly.getQueryVal('utm_source'),
            campaignMedium: Ingestly.getQueryVal('utm_medium'),
            campaignTerm: Ingestly.getQueryVal('utm_term'),
            campaignContent: Ingestly.getQueryVal('utm_content'),
            customAttr: {}
        });

        Ingestly.trackPage();
    }
}());
