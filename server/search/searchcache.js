const cache = new Map();

function fetchResultsFromCache(query) {
    if(cache.has(query)) {
        return cache.get(query);
    } else {
        return null;
    }
}

function addToCache(query, results) {
    cache.set(query, results);
}

module.exports = {fetchResultsFromCache, addToCache};