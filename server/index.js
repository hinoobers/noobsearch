require("dotenv").config();
const express = require("express");
const app = express();

const {crawl} = require("./crawler/crawler");

app.use(express.json());

app.get('/search', (req, res) => {

});

crawl("https://arvutitark.ee/", 3);

app.listen(process.env.SERVER_PORT, () => {
    console.log("Search engine is running on port " + process.env.SERVER_PORT)
})