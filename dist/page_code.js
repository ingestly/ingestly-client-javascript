(function () {
    // Cut the mustard
    if ('querySelector' in window.parent.document &&
        'addEventListener' in window.parent
    ) {
        Ingestly.init({
            endpoint: 'stat.example.com',
            apiKey: '2ee204330a7b2701a6bf413473fcc486',
            eventName: 'ingestlyRecurringEvent',
            eventFrequency: 250,
            prefix: 'ingestly',
            cookieDomain: 'example.com',
            options: {
                scroll: {
                    enable: true,
                    threshold: 2,
                    granularity: 20,
                    unit: 'percent'
                },
                clicks: {
                    enable: true,
                    targetAttr: 'data-trackable'
                }
            }
        }, {
            userId: '',
            userStatus: '',
            userAttr: {},
            pageUrl: window.parent.document.location.href,
            pageReferrer: window.parent.document.referrer,
            pageTitle: window.parent.document.title,
            pageAttr: {},
            contentId: '',
            contentHeadline: '',
            contentStatus: '',
            contentAttr: {},
            campaignCode: Ingestly.getQueryVal('cid'),
            campaignName: Ingestly.getQueryVal('utm_campaign'),
            campaignsource: Ingestly.getQueryVal('utm_source'),
            campaignMedium: Ingestly.getQueryVal('utm_medium'),
            campaignTerm: Ingestly.getQueryVal('utm_term'),
            campaignContent: Ingestly.getQueryVal('utm_content'),
            customAttr: {}
        });

        Ingestly.trackPage();
    }
}());