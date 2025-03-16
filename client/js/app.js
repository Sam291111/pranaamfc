async function fetchAndDisplayStats() {
    const statsContainer = document.getElementById('stats-container');

    try {
        const response = await fetch('/api/stats'); // Fetch from /api/stats
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        const data = await response.json();

        if (data && data.length > 0) {
            const stats = data[0];
            statsContainer.innerHTML = `
                <h3>Club Record</h3>
                <p>Wins: ${stats.wins}</p>
                <p>Losses: ${stats.losses}</p>
                <p>Ties: ${stats.ties}</p>
                <p>Games Played: ${stats.gamesPlayed}</p>
                <p>Goals: ${stats.goals}</p>
                <p>Goals Against: ${stats.goalsAgainst}</p>
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
  const membersContainer = document.querySelector('td[valign="top"]');

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
                        <h3>${member.name}</h3>
                        <p>Games Played: ${member.gamesPlayed}</p>
                        <p>Goals: ${member.goals}</p>
                        <p>Assists: ${member.assists}</p>
                        <p>Position: ${member.favoritePosition}</p>
                        <!-- Add other member stats here -->
                    </div>`;
            });
            membersContainer.innerHTML = membersHTML;

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
    }
     if (window.location.pathname.includes('players.html')){
      fetchAndDisplayMembers();
    }
});