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

function getSequenceSimilarity(seq1, seq2) {
    const lowerSeq1 = seq1.map(s => s.toLowerCase());
    const lowerSeq2 = seq2.map(s => s.toLowerCase());

    const set2 = new Set(lowerSeq2);
    const commonCount = lowerSeq1.filter(word => set2.has(word)).length;

    return commonCount / Math.max(lowerSeq1.length, lowerSeq2.length);  
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

    const results = await pool.execute("SELECT protocol, root_domain, subdomain, path, title, description, keywords FROM pages");

    const grouped = new Map();
    for (let row of results[0]) {
        const keywords = JSON.parse(row.keywords);
        const title = row.title || "";

        const titleWords = title.trim().includes(" ") ? title.split(" ") : title.split("_");
        let score = 0;

        for(const word of queryWords) {
            for(const titleWord of titleWords) {
                score += compareStrings(word, titleWord);
            }
        }

        for (const word of queryWords) {
            for (const keyword of keywords) {
                score += (compareStrings(word, keyword) / 4);
            }
        }

        const sequenceSimilarity = getSequenceSimilarity(queryWords, titleWords);
        score += (sequenceSimilarity * 2); 

        const isApex = row.path === "/" && row.subdomain === null;

        if (isApex) {
            let match = 0;
            for(const word of queryWords) {
                match += compareStrings(word, row.root_domain);
                if(match > .5) {
                    match *= 4;
                }
            }
            score += match;
        }

        if (score <= 0.1) continue;

        const url = `${row.protocol}://${row.subdomain ? row.subdomain + "." : ""}${row.root_domain}${row.path}`;

        const existing = grouped.get(row.root_domain);

        if (!existing || score > existing.score) {
            grouped.set(row.root_domain, {
                url,
                title,
                description: row.description,
                score,
                query,
            });
        }
    }
    const final = Array.from(grouped.values())
        .sort((a, b) => b.score - a.score)
        .filter(result => result.score > 0.1)
        .slice(0, 20);
    await addToCache(query, final);
    return {ok: true, results: final}
}

module.exports = {search, compareStrings};