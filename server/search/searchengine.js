const pool = require("../database");
const {fetchResultsFromCache, addToCache} = require("./searchcache");


function compareStrings(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 1;
    if (a.length < b.length) [a, b] = [b, a]; 

    let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
    let currRow = new Array(b.length + 1);

    for (let i = 1; i <= a.length; i++) {
        currRow[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            currRow[j] = Math.min(
                currRow[j - 1] + 1,    
                prevRow[j] + 1,       
                prevRow[j - 1] + cost 
            );
        }
        [prevRow, currRow] = [currRow, prevRow]; // Swap rows
    }

    const distance = prevRow[b.length];
    return 1 - distance / Math.max(a.length, b.length);
}

async function search(query) {
    const queryWords = query.split(" ").filter(word => word.replace(/[^a-zA-Z0-9]/g, '').length >= 1).slice(0, 20);
    if(queryWords.length === 0) {
        return {ok: false, error: "Empty query"};
    }

    const cachedResults = await fetchResultsFromCache(query);
    if(cachedResults !== null) {
        return {ok: true, results: cachedResults};
    }

    console.log("Searching for:", queryWords);

    const results = await pool.execute("SELECT url, title, description, keywords FROM pages");

    const final =  results[0].map(row => {
        const keywords = JSON.parse(row.keywords);
        const title = row.title || "";

        // Search based on title (priority) + keywords
        let score = compareStrings(query, title) * 3;
        // Decrement score based on EXTRA words
        for(const word of title.split(" ")) {
            if(!queryWords.includes(word)) {
                score -= 0.1;
            }
        }

        for(const word of queryWords) {
            for(const keyword of keywords) {
                score = Math.max(score, compareStrings(word, keyword));
            }
        }

        // Priotize top level domains, so "arvutitark.ee" will score higher than arvutitark arvutitark.ee/abc/xyz
        const urlParts = row.url.replace("https://", "").replace("http://", "").split("/");
        if(urlParts.length === 1) {
            score += 0.2
        }
        return { url: row.url, title, description: row.description, score, query };
    }).filter(result => result.score > 0.1) // Only return results that have some relevance
        .sort((a, b) => b.score - a.score);
    await addToCache(query, final);
    return {ok: true, results: final}
}

module.exports = {search, compareStrings};