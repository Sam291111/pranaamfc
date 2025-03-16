async function fetchAndDisplayRecentResults() {
    const resultsContainer = document.getElementById('recent-results');
    if (!resultsContainer) {
        return;
    }
    resultsContainer.innerHTML = '<p>Loading recent results...</p>';

    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        const data = await response.json();
        const platform = "common-gen4"; // HARDCODED Platform - EASIEST

        if (Array.isArray(data) && data.length > 0) {
            const stats = data[0];
            let resultsHTML = '<h3>Recent Results</h3><ul>';

            for (let i = 0; i < 10; i++) {
                const opponentKey = `lastOpponent${i}`;
                if (stats[opponentKey]) {
                    // Use the HARDCODED platform here:
                    const clubDetails = await fetch(`/api/clubinfo?clubIds=${stats[opponentKey]}&platform=${platform}`);
                    const clubData = await clubDetails.json();
                    const clubName = clubData[stats[opponentKey]]?.name;
                    resultsHTML += `<li> ${clubName ? clubName : stats[opponentKey]} </li>`;
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