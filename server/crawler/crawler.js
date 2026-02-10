// Idea for a crawler im thinking is:
// a) manually added websites (via GUI)
// b) some pre-set websites, popular
// c) some sort of automatic discovery???

const analyzePage = require("../pageanalyzer/pageanalyzer");
const pool = require("../database");

function startCrawler() {

}

async function crawl(url) {
    const analysis = await analyzePage(url);
    if(!analysis.ok) {
        return;
    }

    const sublinks = analysis.sublinks;
    for(const sublink of sublinks) {
        await crawl(sublink);
    }

    // Add to database
    await pool.execute("INSERT INTO pages (url, title, description, keywords, last_updated) VALUES (?, ?, ?, ?, ?)", [url, analysis.title, analysis.description, analysis.keywords, new Date()]);
}

module.exports = { startCrawler, crawl };