const pool = require("../database");

async function search(query) {
    const queryWords = query.split(" ").filter(word => word.replace(/[^a-zA-Z0-9]/g, '').length >= 1).slice(0, 20);
    if(queryWords.length === 0) {
        return {ok: false, error: "Empty query"};
    }

    const results = await pool.execute("SELECT url, title, description, keywords FROM pages");

    const final =  results[0].map(row => {
        const keywords = JSON.parse(row.keywords);
        const matchCount = keywords.filter(keyword => queryWords.includes(keyword.toLowerCase())).length;
        const relevance = matchCount / keywords.length;
        return { url: row.url, title: row.title, description: row.description, relevance };
    }).filter(result => result.relevance > 0) // Only return results that have some relevance
        .sort((a, b) => b.relevance - a.relevance);
    return {ok: true, results: final}
}

module.exports = search;