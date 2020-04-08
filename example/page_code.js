(function () {
    // Cut the mustard
    if ('querySelector' in window.top.document &&
        'addEventListener' in window.top
    ) {
        Ingestly.config({
            endpoint: 'stats.example.com',
            apiKey: '2ee204330a7b2701a6bf413473fcc486',
            eventName: 'ingestlyRecurringEvent',
            eventFrequency: 250,
            prefix: 'ingestly',
            targetWindow: 'self',
            useCookie: true,
            options: {
                rum: {
                    enable: true
                },
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
                    targets: window.document.getElementsByTagName('article')
                },
                media: {
                    enable: true,
                    heartbeat: 5
                },
                form: {
                    enable: true,
                    targets: window.document.getElementsByTagName('form')
                }
            }
        });

        Ingestly.init({
            pgUrl: window.location.href,
            pgRef: document.referrer,
            pgTitle: window.document.title,
            pgAttr: {},
            usId: '',
            usStatus: '',
            usAttr: {},
            cnId: '',
            cnHeadline: '',
            cnStatus: '',
            cnAttr: {},
            cpCode: Ingestly.getQueryVal('cid'),
            cpName: Ingestly.getQueryVal('utm_campaign'),
            cpSource: Ingestly.getQueryVal('utm_source'),
            cpMedium: Ingestly.getQueryVal('utm_medium'),
            cpTerm: Ingestly.getQueryVal('utm_term'),
            cpContent: Ingestly.getQueryVal('utm_content'),
            cpAttr: {}
        });

        Ingestly.trackPage();
    }
}());
