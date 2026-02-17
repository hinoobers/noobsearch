const cache = new Map();

async function fetchResultsFromCache(query) {
    if(cache.has(query)) {
        const cached = cache.get(query);
        if(Date.now() - cached.timestamp > 1000 * 60 * 5) {
            cache.delete(query);
            return null;
        }
        return cached.results;
    } else {
        return null;
    }
}

async function addToCache(query, results) {
    cache.set(query, {results: results, timestamp: Date.now()});
}

module.exports = {fetchResultsFromCache, addToCache};