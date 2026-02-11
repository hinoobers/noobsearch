// Idea for a crawler im thinking is:
// a) manually added websites (via GUI)
// b) some pre-set websites, popular
// c) some sort of automatic discovery???

const analyzePage = require("../pageanalyzer/pageanalyzer");
const pool = require("../database");
const fs = require("fs");

let crawlingUrl = "";
let crawling = false;

function startCrawler() {
    console.log("Crawler started");
    setInterval(() => {
        if(crawling) {
            return;
        }

        crawling = true;
        if(crawlingUrl === "") {
            crawlingUrl = fs.readFileSync("./crawler/domains.txt", "utf-8").split("\n")[0].trim();
        } else {
            const index = fs.readFileSync("./crawler/domains.txt", "utf-8").split("\n").findIndex(line => line.trim() === crawlingUrl);
            const lines = fs.readFileSync("./crawler/domains.txt", "utf-8").split("\n");
            crawlingUrl = lines[(index + 1) % lines.length].trim();
        }

        crawl(crawlingUrl, 3).then(() => {
            crawling = false;
        }).catch(() => {
            crawling = false;
        });
    }, 1000 * 60); // every 1 minute
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