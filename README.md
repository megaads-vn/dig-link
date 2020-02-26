const proxyList = {
    "US": [
        // {
        //     username: '',
        //     password: ''
        // }
    ],
    "UK": [

    ],
    "GE": [

    ],
    "ES": [

    ],
    "FR": [

    ],
    "VN": [
        
    ]
};

const crawlerService = require('./src/CrawlerService');
const databaseLocation = './database/IPV6-COUNTRY-REGION-CITY-LATITUDE-LONGITUDE-ZIPCODE.BIN';

(async function () {
    var chiaki = new crawlerService('https://www.chiaki.vn/combo-5-chai-gel-rua-tay-kho-bath-body-works-29ml?utm_source=zippy');
    // var location = await chiaki.getLocation(databaseLocation);
    // var sitemaps = [];
    // var proxyPath = '';
    // if (location && location.status == 'OK') {
    //     var proxyZone = proxyList[location.country_short][0];
    //     var sessionId = (1000000 * Math.random()) || 0;
    //     proxyPath = `http://${proxyZone.username}-session-${sessionId}:${proxyZone.password}@${proxyZone.url}`;
    // }

    /* Crawler by Sitemap */
    sitemaps = await chiaki.getSitemap();
    var links = await chiaki.getLinkSitemap(sitemaps);

    /* Crawler by Origin */
    // var links = await chiaki.getLinkOrigin(1000);
    // console.log("Link Origin", links);

    /* Crawler by Puppeteer */
    // var links = await chiaki.getLinkHeadless(1000);
    // console.log("Link Origin", links);
})();

