require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const {startCrawler, crawl} = require("./crawler/crawler");
const canRead = require("./pageanalyzer/robotschecker");
const {search, compareStrings} = require("./search/searchengine");
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

//startCrawler();

app.listen(process.env.SERVER_PORT, () => {
    console.log("Search engine is running on port " + process.env.SERVER_PORT)
})