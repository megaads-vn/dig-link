const dnsService = require('dns');
const urlService = require('url');
const ip2Location = require("ip2location-nodejs");
const requestService = require('request-promise');
const puppeteerService = require('puppeteer');
const parserService = require('./ParserService');

function CrawlerService (url) {
    
    var host = '';
    var parseUrl = urlService.parse(url.replace('//www.','//'));

    this.validateUrl = () => {
        if (!parseUrl.protocol || !parseUrl.host) {
            throw new Error('URL Not Valid. Please check again.');
        }
        host = parseUrl.host;
        url = `${parseUrl.protocol}//${parseUrl.hostname}`;
    }
    
    this.getLocation = async (pathName) => {
        var lookupPromise = new Promise((resolve, reject) => {
            dnsService.lookup(host, (err, address, family) => {
                if(err) reject(err);

                resolve(address);
            });
        });
        var ipAddress = await lookupPromise.catch((error) => {
            throw new Error(`Can't get IP Address from host: ${host}. Please check again.`);
        });
        ip2Location.IP2Location_init(pathName);
        return ip2Location.IP2Location_get_all(ipAddress);
    }

    this._buildOption = (link, userAgent, proxyTunnel) => {
        var options = {};
        if (link === "headless") {
            options = { 
                headless: false, 
                args: ['--window-size=1366,768'], 
                defaultViewport: {width: 1366, height: 768} 
            };
            if (proxyTunnel && proxyTunnel != '') {
                options.args.push(`--proxy-server=${proxyTunnel}`);
            }
        } else {
            options = {
                method: 'GET',
                uri: link,
                headers: {
                    'User-Agent': (userAgent && userAgent != '') ? userAgent : 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
                },
                resolveWithFullResponse: true
            };
            if (proxyTunnel && proxyTunnel != '') {
                options.proxy = proxyTunnel;
            }
        }
        
        return options;
    }

    this.getSitemap = async (userAgent, proxyTunnel) => {
        var contentRobots = await requestService(this._buildOption(`${url}/robots.txt`, userAgent, proxyTunnel)).then((parsedBody) => {
            const reg = /Sitemap: *([^\r\n]*)/gi;
            var match = reg.exec(parsedBody.body);
            var _sitemaps = [];
            while (match != null) {
                _sitemaps.push(match[1]);
                match = reg.exec(parsedBody);
            }
            return _sitemaps;
        }).catch((err) => {
            return [`${url}/sitemap.xml`];
        });
        return contentRobots;
    }

    this.getLinkSitemap = async (sitemaps, userAgent, proxyTunnel) => {
        var links = [];
        while (sitemaps.length != 0) {
            var response = await requestService(this._buildOption(sitemaps.shift(), userAgent, proxyTunnel)).catch((err) => {
                return false;
            });
            if (response && response.headers['content-type'].indexOf('text/xml') > -1 && response.body && response.body != '') {
                var parseResult = await parserService.parseXML(response.body);
                if (parseResult && parseResult.subSitemaps) {
                    sitemaps = sitemaps.concat(parseResult.subSitemaps);
                }
                if (parseResult && parseResult.links) {
                    links = links.concat(parseResult.links);
                }
            }
        }
        return links;
    }

    this.getLinkOrigin = async (quantityLink, userAgent, proxyTunnel) => {
        var links = [url];
        var crawlered = [];
        while (links.length != 0 && links.length < quantityLink) {
            var linkItem = links.shift();
            if (crawlered.indexOf(linkItem) == -1) {
                crawlered.push(linkItem);
                var response = await requestService(this._buildOption(linkItem, userAgent, proxyTunnel)).catch((err) => {
                    return false;
                });
                if (response && response.headers['content-type'].indexOf('text/html') > -1 && response.body && response.body != '') {
                    var parseResult = await parserService.parseHTML(response.body, parseUrl);
                    if (parseResult && parseResult.length != 0) {
                        links = links.concat(parseResult);
                    }
                }
                links = Array.from(new Set(links)); //unique link
            }
        }
        
        return links;
    }

    this.getLinkHeadless = async function (quantityLink, userAgent, proxyTunnel) {
        var links = [url];
        var crawlered = [];
        const browser = await puppeteerService.launch(this._buildOption('headless', userAgent, proxyTunnel));
        while (links.length != 0 && links.length < quantityLink) {
            var linkItem = links.shift();
            if (crawlered.indexOf(linkItem) == -1) {
                crawlered.push(linkItem);
                var page = await browser.newPage();
                await page.goto(linkItem, {waitUntil: 'domcontentloaded'});
                var contentPage = await page.evaluate(() => {
                    return document.querySelector('html').innerHTML;
                });

                var parseResult = await parserService.parseHTML(contentPage, parseUrl);
                if (parseResult && parseResult.length != 0) {
                    links = links.concat(parseResult);
                }
                links = Array.from(new Set(links)); //unique link
                page.close();
            }
        }
        await browser.close();
        return links;
    }

    this.validateUrl();

}

module.exports = CrawlerService;