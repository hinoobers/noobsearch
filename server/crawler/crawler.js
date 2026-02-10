// Idea for a crawler im thinking is:
// a) manually added websites (via GUI)
// b) some pre-set websites, popular
// c) some sort of automatic discovery???

const analyzePage = require("../pageanalyzer/pageanalyzer");
const pool = require("../database");
const crawlCache = [];

function startCrawler() {

}

async function crawl(url, ttl) {
    if(ttl <= 0) {
        return;
    }
    const analysis = await analyzePage(url);
    if(!analysis.ok) {
        return;
    }

    // For each crawler session, let's generate an id
    let crawlId = Math.random().toString(36).substring(2, 15);
    while(crawlCache[crawlId]) {
        // just in case, we want to avoid collisions, but they are very unlikely
        crawlId = Math.random().toString(36).substring(2, 15);
    }
    crawlCache[crawlId] = [];

    const sublinks = analysis.sublinks;
    for(const sublink of sublinks) {
        if(!sublink.startsWith("http") || crawlCache[crawlId].includes(sublink)) {
            // some <a tags arent always links
            continue;
        }
        crawlCache[crawlId].push(sublink);
        await crawl(sublink, ttl - 1);
    }

    // Final step of adding to database, let's double check we have essential data
    if(!analysis.title || !analysis.description) {
        return;
    }

    // Add to database
    await pool.execute("INSERT INTO pages (url, title, description, keywords, last_updated) VALUES (?, ?, ?, ?, ?)", [url, analysis.title, analysis.description, JSON.stringify(analysis.keywords), new Date()]);
}

module.exports = { startCrawler, crawl };