require("dotenv").config();
const express = require("express");
const app = express();

const {startCrawler} = require("./crawler/crawler");
const search = require("./search/searchengine");
const pool = require("./database");

app.use(express.json());

app.get('/search', (req, res) => {
    const query = req.query.q;
    if(!query) {
        return res.status(400).json({ok: false, error: "Missing query parameter"});
    }

    search(query).then(result => {
        console.log("Search query:", query, "Results found:", result);
        res.json(result);
    }).catch(error => {
        console.error(error);
        res.status(500).json({ok: false, error: "Search error"});
    });
});

//startCrawler();

app.listen(process.env.SERVER_PORT, () => {
    console.log("Search engine is running on port " + process.env.SERVER_PORT)
})