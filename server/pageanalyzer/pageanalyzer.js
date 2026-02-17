
const {canRead} = require("./robotschecker");
const {fetchPageContent} = require("./pagereader");

async function analyzePage(url) {
    const canAccess = await canRead(url);
    if(!canAccess) {
        return { ok: false, error: "robots.txt disallow"}
    }

    // Current design: We fetch the HTML, we get sublinks that can also be passed into analyzePage
    const pageContent = await fetchPageContent(url);
    if(!pageContent.ok) {
        return pageContent;
    }

    // Links can have duplicates, or references to this page, so to avoid issues, let's filter
    const uniqueLinks = [...new Set(pageContent.links)];
    // limit to 50 sublinks, speeds up crawler
    // first sort it by most distinctive words in links, so get a variety
    uniqueLinks.sort((a, b) => {
        const aParts = a.split("/").filter(part => part.length > 0);
        const bParts = b.split("/").filter(part => part.length > 0);
        const aScore = aParts.reduce((score, part) => score + (pageContent.keywords.includes(part) ? 1 : 0), 0);
        const bScore = bParts.reduce((score, part) => score + (pageContent.keywords.includes(part) ? 1 : 0), 0);
        return bScore - aScore;
    })

    // For website description, we prefer meta description, OR from readable text, lets do like 100 characters
    return {ok: true, sublinks: uniqueLinks.slice(0, 50), title: pageContent.title, description: pageContent.description, keywords: pageContent.keywords, protocol: url.includes("https") ? "https" : "http"}
}

module.exports = analyzePage;