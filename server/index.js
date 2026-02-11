require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const {startCrawler} = require("./crawler/crawler");
const search = require("./search/searchengine");

app.use(express.json());
app.use(cors());

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

//startCrawler();

app.listen(process.env.SERVER_PORT, () => {
    console.log("Search engine is running on port " + process.env.SERVER_PORT)
})