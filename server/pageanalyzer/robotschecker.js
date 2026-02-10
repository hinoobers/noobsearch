module.exports = async function canRead(url) {
    // Usually robots.txt is at the root domain
    const rootDomain = new URL(url).origin;
    const robotsUrl = `${rootDomain}/robots.txt`;

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
    for(const line of lines) {
        if(line.startsWith("Disallow: ")) {
            const disallowedPath = line.replace("Disallow: ", "").trim();
            if(path.startsWith(disallowedPath)) {
                console.log(`Access to ${url} is disallowed by robots.txt`);
                return false;
            }
        }
    }
    return true;
}