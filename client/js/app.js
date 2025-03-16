async function fetchAndDisplayStats() {
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = "<p>Loading stats...</p>"; // Loading indicator

    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        const data = await response.json();

        if (Array.isArray(data.stats) && data.stats.length > 0) {
            const stats = data.stats[0];
            const gamesPlayed = parseInt(stats.gamesPlayed, 10); // Ensure numeric
            const wins = parseInt(stats.wins, 10);
            const losses = parseInt(stats.losses, 10);
            const ties = parseInt(stats.ties, 10);
            const goals = parseInt(stats.goals, 10);
            const goalsAgainst = parseInt(stats.goalsAgainst, 10);

            const goalsPerGame = gamesPlayed > 0 ? (goals / gamesPlayed).toFixed(2) : "N/A";
            const goalsAgainstPerGame = gamesPlayed > 0 ? (goalsAgainst / gamesPlayed).toFixed(2) : "N/A";
            const winPercentage = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) + "%" : "N/A";

            statsContainer.innerHTML = `
                <h3>Club Record</h3>
                <p>Wins: ${wins}</p>
                <p>Losses: ${losses}</p>
                <p>Ties: ${ties}</p>
                <p>Games Played: ${gamesPlayed}</p>
                <p>Goals: ${goals}</p>
                <p>Goals Against: ${goalsAgainst}</p>
                <p>Goals Per Game: ${goalsPerGame}</p>
                <p>Goals Against Per Game: ${goalsAgainstPerGame}</p>
                <p>Win Percentage: ${winPercentage}</p>
                <p>Best Division: ${stats.bestDivision}</p>
                <p>Skill Rating: ${stats.skillRating}</p>
                <p>Unbeaten Streak: ${stats.unbeatenstreak}</p>

            `;
        } else {
            statsContainer.innerHTML = `<p>No stats found.</p>`;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        statsContainer.innerHTML = `<p>Error loading stats: ${error.message}</p>`;
    }
}

async function fetchAndDisplayMembers() {
    // Target the NEW div, not the entire td
    const membersContainer = document.getElementById('members-container');

    if (!membersContainer) {
        console.error("Could not find 'members-container' element."); // Debugging!
        return; // Exit if the container isn't found
    }

    membersContainer.innerHTML = '<p>Loading players...</p>'; // Add loading indicator

    try {
        const response = await fetch('/api/members');
        if(!response.ok){
            throw new Error('Failed to fecth members data')
        }
        const data = await response.json();

        if (data && data.members && data.members.length > 0) {
            let membersHTML = '<h2>Our Legendary Squad</h2>'; // Initialize HTML

            data.members.forEach(member => {
                membersHTML += `
                    <div class="player-profile">
                        <h3>${member.name} <span class = "blink">♦️</span></h3>
                        <p>Games Played: ${member.gamesPlayed}</p>
                        <p>Goals: ${member.goals}</p>
                        <p>Assists: ${member.assists}</p>
                        <p>Position: ${member.favoritePosition}</p>
                    </div>`;
            });
            membersContainer.innerHTML = membersHTML; // Insert into the SPECIFIC div

        } else {
             membersContainer.innerHTML = '<p>No members data found.</p>';
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        membersContainer.innerHTML = `<p>Error loading members: ${error.message}</p>`;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('stats.html')) {
        fetchAndDisplayStats();
    } else if (window.location.pathname.includes('players.html')){
      fetchAndDisplayMembers();
    }
});