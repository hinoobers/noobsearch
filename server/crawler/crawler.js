// Idea for a crawler im thinking is:
// a) manually added websites (via GUI)
// b) some pre-set websites, popular
// c) some sort of automatic discovery???

const analyzePage = require("../pageanalyzer/pageanalyzer");
const pool = require("../database");

function startCrawler() {

}

async function crawl(url, ttl, visited = new Set()) {
    if(ttl <= 0) {
        return;
    }
    const analysis = await analyzePage(url);
    if(!analysis.ok) {
        return;
    }
    if(visited.has(url)) {
        return;
    }
    visited.add(url);

    const sublinks = analysis.sublinks;
    for(const sublink of sublinks) {
        if(!sublink.startsWith("http")) {
            // some <a tags arent always links
            continue;
        }

        await crawl(sublink, ttl - 1, visited);
    }

    // Final step of adding to database, let's double check we have essential data
    if(!analysis.title || !analysis.description) {
        return;
    }

    // Add to database
    // Data might already be there, in that case we need to update it
    await pool.execute("INSERT INTO pages (url, title, description, keywords, last_updated) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), keywords = VALUES(keywords), last_updated = VALUES(last_updated)", [url, analysis.title, analysis.description, JSON.stringify(analysis.keywords), new Date()]);
}

module.exports = { startCrawler, crawl };