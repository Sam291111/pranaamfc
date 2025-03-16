async function fetchAndDisplayRecentResults() {
    const resultsContainer = document.getElementById('recent-results');
    if (!resultsContainer) {
        return; // Don't do anything if the element doesn't exist
    }
    resultsContainer.innerHTML = '<p>Loading recent results...</p>';

    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const stats = data[0];
            let resultsHTML = '<h3>Recent Results</h3><ul>';

            // Loop through the lastOpponent properties
            for (let i = 0; i < 10; i++) {
                const opponentKey = `lastOpponent${i}`;
                if (stats[opponentKey]) {
                    // Check if the opponent key exists
                    //We need to call another endpoint to find the opponents name
                    const clubDetails = await fetch(`/api/clubinfo?clubIds=${stats[opponentKey]}&platform=${process.env.PLATFORM}`)
                    const clubData = await clubDetails.json();
                    // Get club name
                   const clubName = clubData[stats[opponentKey]]?.name;

                    resultsHTML += `<li> ${clubName ? clubName: stats[opponentKey]} </li>`;
                }
            }

            resultsHTML += '</ul>';
            resultsContainer.innerHTML = resultsHTML;
        } else {
            resultsContainer.innerHTML = '<p>No recent results found.</p>';
        }
    } catch (error) {
        console.error('Error fetching recent results:', error);
        resultsContainer.innerHTML = `<p>Error loading recent results: ${error.message}</p>`;
    }
}

// Call fetchAndDisplayStats() if on stats page
// Call fetchAndDisplayMembers() if on players page.
// Call recent results on index page.

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('stats.html')) {
        fetchAndDisplayStats();
    } else if (window.location.pathname.includes('players.html')) {
        fetchAndDisplayMembers();
    } else {
        // Assuming the home page (index.html) is where you want recent results.
        fetchAndDisplayRecentResults();
    }
});