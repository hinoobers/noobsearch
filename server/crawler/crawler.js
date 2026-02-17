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

        crawl(crawlingUrl, 3, false, visited).then(() => {
            crawling = false;
        }).catch(() => {
            crawling = false;
        });
    }, 1000 * 10); // every 1 minute
}

async function crawl(url, ttl, user_added, visited = new Set()) {
    if(ttl <= 0) {
        return;
    }
    const analysis = await analyzePage(url);
    if(!analysis.ok) {
        console.log("Failed to analyze", url, "error:", analysis.error);
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

        await crawl(sublink, ttl - 1, user_added, visited);
    }

    // Final step of adding to database, let's double check we have essential data
    if(!analysis.title || !analysis.description) {
        console.log("Missing title or description for", url);
        return;
    }

    // Add to database
    // Data might already be there, in that case we need to update it
    const urlObj = new URL(url);
    const rootDomain = urlObj.hostname.split(".").slice(-2).join(".");
    const path = urlObj.pathname;
    let subdomain = urlObj.hostname.split(".").slice(0, -2).join(".");
    if(subdomain.trim() === "") {
        subdomain = null;
    } 
    await pool.execute("INSERT INTO pages (protocol, root_domain, subdomain, path, title, description, keywords, user_added, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), keywords = VALUES(keywords), last_updated = VALUES(last_updated)", [analysis.protocol, rootDomain, subdomain, path, analysis.title, analysis.description, JSON.stringify(analysis.keywords), user_added, new Date()]);
}

module.exports = { startCrawler, crawl };