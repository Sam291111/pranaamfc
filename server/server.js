app.use((req, res, next) => {
    if (req.path === '/') { // ONLY increment if the path is EXACTLY '/'
        try {
            visitorCount++;
            fs.writeFileSync(counterFilePath, visitorCount.toString(), 'utf-8');
            console.log("Visitor Count:", visitorCount);
        } catch (error) {
            console.error("Error writing to counter file:", error);
        }
    }
    next(); // ALWAYS call next()
});