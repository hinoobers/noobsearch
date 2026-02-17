let robotsCache = new Map();

async function canRead(url) {
    // Usually robots.txt is at the root domain
    const rootDomain = new URL(url).origin;
    const robotsUrl = `${rootDomain}/robots.txt`;

    if(robotsCache.has(url)) {
        return robotsCache.get(url);
    }
    // We need to check if there's a Disallow rule for the given url
    const response = await fetch(robotsUrl);
    if (!response.ok) {
        // This can be a random case, if we can't access, assume we can read to prevent any further issues
        return true;
    }

    const text = await response.text();
    const lines = text.split('\n');
    const path = new URL(url).pathname;
    console.log(`Checking robots.txt for ${url} (path: ${path})`);
    const rules = new Map();
    const globalRules = [];
    let current = null; // current user agent
    for(let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if(line.startsWith("User-agent:")) {
            const userAgent = line.split(":")[1].trim();
            current = userAgent;
            if(!rules.has(current)) {
                rules.set(current, []);
            }
        } else if(line.startsWith("Disallow:") || line.startsWith("Allow:")) {
            if(current === null) {
                globalRules.push(line);
            } else {
                rules.get(current).push(line);
            }
        }
    }

    for(const rule of [...(rules.get("*") || []), ...globalRules, ...(rules.get("noobsearch") || [])]) {
        const [directive, value] = rule.split(":").map(s => s.trim());
        if(directive === "Disallow") {
            if(value === path) {
                robotsCache.set(url, false);
                return false;
            }
        }
    }

    robotsCache.set(url, true);
    return true;
}

async function getCache(url) {
    if(robotsCache.has(url)) {
        return robotsCache.get(url);
    }
    return null;
}

module.exports = {canRead, getCache}