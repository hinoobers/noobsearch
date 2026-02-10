
const canRead = require("./robotschecker");
const fetchPageContent = require("./pagereader");

async function analyzePage(url) {
    const canAccess = await canRead(url);
    if(!canAccess) {
        //return { ok: false, error: "robots.txt disallow"}
    }

    // Current design: We fetch the HTML, we get sublinks that can also be passed into analyzePage
    const pageContent = await fetchPageContent(url);
    if(!pageContent.ok) {
        return pageContent;
    }

    // Links can have duplicates, or references to this page, so to avoid issues, let's filter
    const uniqueLinks = [...new Set(pageContent.links)].filter(link => link !== url);
    // For website description, we prefer meta description, OR from readable text, lets do like 100 characters
    return {ok: true, sublinks: uniqueLinks}
}

module.exports = analyzePage;