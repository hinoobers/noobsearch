const axios = require('axios');
const { Parser } = require('htmlparser2');

async function fetchPageContent(url) {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const links = [];

        let title = "";
        let isTitleTag = false;
        let descriptionExists = false;
        let description = "";
        let noise = false;
        let humanReadableText = "";

        const parser = new Parser({
            onopentag(name, attributes) {
                if(name === "a") {
                    if(attributes.href.startsWith("/")) {
                        // we need to convert it for our analyzer to work properly
                        links.push(new URL(attributes.href, url).href);
                    } else {
                        links.push(attributes.href);
                    }
                } else if(name == "meta") {
                    if(attributes.name === "description") {
                        descriptionExists = true;
                        description = attributes.content;
                    }
                } else if(name === "title") {
                    isTitleTag = true;
                } else if(["script", "style", "noscript"].includes(name)) {
                    noise = true;
                }
            },
            ontext(text) {
                if(isTitleTag) {
                    title += text;
                } else if(!noise) {
                    humanReadableText += text + " ";
                }
            },
            onclosetag(name) {
                if(name === "title") {
                    isTitleTag = false;
                } else if(["script", "style", "noscript"].includes(name)) {
                    noise = false;
                }
            }
        });
        parser.write(html);
        parser.end();

        if(!descriptionExists) {
            // This is to give them a chance, maybe they don't want a description displayed?
            let textContent = humanReadableText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
            description = textContent.substring(0, 100); 
        }

        const keywordExclusion = ["the", "this", "that", "then", "and", "for", "with"]; // These have no use, we want distinctive words, that can we used for search later on
        let keywords = humanReadableText.split(" ").filter(word => word.replace(/[^a-zA-Z0-9]/g, '').length >= 3).slice(0, 20).filter(word => !keywordExclusion.includes(word.toLowerCase()));
        // I feel like randomizing the keywords might give a better search, but needs to be tested TODO
        keywords = keywords.sort(() => 0.5 - Math.random());

        return { ok: true, content: html, title, description, links, keywords};
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return { ok: false, error: error.message };
    }
}

module.exports = fetchPageContent;