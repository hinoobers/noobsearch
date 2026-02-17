require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const {startCrawler, crawl} = require("./crawler/crawler");
const {canRead, getCache} = require("./pageanalyzer/robotschecker");
const {search, compareStrings} = require("./search/searchengine");
const {canReadPage} = require("./pageanalyzer/pagereader");
const pool = require("./database");

app.use(express.json());
app.use(cors());

console.log(compareStrings("a", "A"));
app.get('/search', (req, res) => {
    const query = req.query.q;
    if(!query) {
        return res.status(400).json({ok: false, error: "Missing query parameter"});
    }

    const millis = Date.now();
    search(query).then(result => {
        if(!result.ok) {
            return res.status(500).json({ok: false, error: result.error});
        }
        const time = Date.now() - millis;
        res.json({ok: true, results: result.results, time});
    }).catch(error => {
        console.error(error);
        res.status(500).json({ok: false, error: "Search error"});
    });
});

app.get("/statistics", async (req, res) => {
    // For now just return number of indexed pages
    const [rows] = await pool.execute("SELECT COUNT(*) as count FROM pages");
    const [domains] = await pool.execute("SELECT COUNT(DISTINCT root_domain) as count FROM pages");
    const [mostDominantRootDomain] = await pool.execute("SELECT root_domain FROM pages GROUP BY root_domain ORDER BY COUNT(*) DESC LIMIT 1");
    res.json({ok: true, indexedPages: rows[0].count, uniqueDomains: domains[0].count, mostDominantRootDomain: mostDominantRootDomain[0] ? mostDominantRootDomain[0].root_domain : "n/a"});
})

app.post("/crawlsite", async (req, res) => {
    const url = req.body.url;
    if(!url) {
        return res.status(400).json({ok: false, error: "Missing url parameter"});
    }

    if (typeof url !== 'string' || url.length > 2048) {
        return res.status(400).json({ ok: false, error: "Invalid or too long URL" });
    }

    // Profanity filter
    const words = ["porn", "sex", "redtube"];
    for(const word of words) {
        if(url.toLowerCase().includes(word)) {
            return res.status(400).json({ok: false, error: "Profanity filter"});
        }
    }

    let urlObj;
    try {
        urlObj = new URL(url);
        if (!urlObj.protocol.startsWith('http')) throw new Error(); 
    } catch (e) {
        return res.status(400).json({ ok: false, error: "Invalid URL format" });
    }
    const rootDomain = urlObj.hostname.split(".").slice(-2).join(".");
    if(rootDomain.split(".").length != 2) {
        return res.status(400).json({ok: false, error: "Invalid root domain (entered: " + rootDomain + ")"});
    }

    if(rootDomain.split(".")[1].length < 2) {
        // Root domain extensions can be 2 characters at minimum
        return res.status(400).json({ok: false, error: "Invalid root domain (extension)"});
    }

    const canReadPAgeCache = await canReadPage(url);
    if(canReadPAgeCache === false) {
        return res.status(403).json({ok: false, error: "Page is not there or cannot be accessed"});
    }

    const robotCache = await canRead(url);
    if(robotCache === false) {
        return res.status(403).json({ok: false, error: "Crawling disallowed by robots.txt"});
    }


    const protocol = urlObj.protocol === "https:" ? "https" : "http";
    const path = urlObj.pathname === "/" ? "/" : urlObj.pathname.replace(/\/$/, "");
    const subdomain = urlObj.hostname.split(".").length > 2 ? urlObj.hostname.split(".").slice(0, -2).join(".") : null;

    console.log(rootDomain, protocol, path, subdomain);

    const [rows] = await pool.execute("SELECT * FROM pages WHERE root_domain = ? AND protocol = ? AND path = ? AND subdomain <=> ?", [rootDomain, protocol, path, subdomain]);
    if(rows.length > 0) {
        return res.json({ok: true, message: "Site already indexed"});
    } else {
        res.json({ok: true, message: "Crawl request sent, it may take a few minutes for the site to be indexed."});
        crawl(url, 3).then(() => {
            // No reply, we alr sent
        }).catch(error => {
            console.error(error);
        });
    }
});

//startCrawler();

app.listen(process.env.SERVER_PORT, () => {
    console.log("Search engine is running on port " + process.env.SERVER_PORT)
})