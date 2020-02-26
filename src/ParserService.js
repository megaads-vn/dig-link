const cheerio = require('cheerio');
const xml2js = require('xml2js');
const urlService = require('url');

function ParserService() {

    this.parseHTML = (htmlString, currentUrl) => {
        var $ = cheerio.load(htmlString);
        var links = [];
        $('body').find('a').each((index, element) => {
            var url = $(element).attr('href');
            if (url && url != '') {
                if (url.indexOf('/') === 0) {
                    url = `${currentUrl.protocol}//${currentUrl.hostname}` + url;
                    links.push(url);
                } else {
                    var parseUrl = urlService.parse(url);
                    if (parseUrl && parseUrl.host && parseUrl.host === currentUrl.host) {
                        links.push(url);
                    }
                }
            }
        });
        return links;
    }

    this.parseXML = async (stringParse) => {
        var retVal = {
            links: [],
            subSitemaps: []
        };
        var content = await xml2js.parseStringPromise(stringParse).catch((error) => { return null; });
        if (content && content.sitemapindex && content.sitemapindex.sitemap) {
            var sitemaps = content.sitemapindex.sitemap;
            sitemaps.forEach(element => {
                retVal.subSitemaps.push(element.loc.join());
            });
        }
        if (content && content.urlset && content.urlset.url) {
            var urls = content.urlset.url;
            urls.forEach(element => {
                retVal.links.push(element.loc.join());
            });
        }
        return retVal;
    }
}

module.exports = new ParserService;