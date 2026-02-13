const axios = require('axios');
const { Parser } = require('htmlparser2');

async function fetchPageContent(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });
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
                    // I think it's best to also remove ?parameter from the url, avoids duplicates (page buttons for example)
                    if(attributes.href !== undefined) {
                        if(attributes.href.startsWith("/")) {
                            // we need to convert it for our analyzer to work properly
                            try{
                                const fullUrl = new URL(attributes.href, url);
                                links.push(fullUrl.origin + fullUrl.pathname);
                            } catch (ignored) {
                                
                            }
                        } else {
                            try {
                                const cleanUrl = new URL(attributes.href);
                                links.push(cleanUrl.origin + cleanUrl.pathname);
                            } catch(ignored) {

                            }
                        }
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

        const keywordExclusion = ["the", "this", "that", "then", "and", "for", "with", "see", "mis", "tema", "ning", "ja", "tema"]; // These have no use, we want distinctive words, that can we used for search later on
        let keywords = humanReadableText.split(" ").filter(word => word.replace(/[^a-zA-Z0-9]/g, '').length >= 3).slice(0, 20).filter(word => !keywordExclusion.includes(word.toLowerCase()));
        // I feel like randomizing the keywords might give a better search, but needs to be tested TODO
        keywords = keywords.sort(() => 0.5 - Math.random());

        return { ok: true, content: html, title, description, links, keywords};
    } catch (error) {
        console.log(error);
        console.error(`Error fetching ${url}:`, error.message);
        return { ok: false, error: error.message };
    }
}

module.exports = fetchPageContent;