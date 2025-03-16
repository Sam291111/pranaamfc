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

// --- Guestbook Functions ---

// Display existing guestbook entries
async function displayGuestbookEntries() {
    const entriesContainer = document.getElementById('guestbook-entries');
     if (!entriesContainer) {
        return; // Exit if the container isn't found
    }
    try {
        const response = await fetch('/api/guestbook');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const entries = await response.json();

        if (entries.length > 0) {
            const entriesHTML = entries.map(entry => `
                <div class="guestbook-entry">
                    <p><strong>${entry.name}</strong> (${entry.timestamp}):</p>
                    <p>${entry.message}</p>
                </div>
            `).join('');
            entriesContainer.innerHTML = entriesHTML;
        } else {
            entriesContainer.innerHTML = '<p>No entries yet.</p>';
        }
    } catch (error) {
        console.error("Error fetching guestbook entries:", error);
        entriesContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}

// Handle guestbook form submission
async function submitGuestbookEntry(event) {
    event.preventDefault(); // Prevent the default form submission

    const nameInput = document.getElementById('guestbook-name');
    const messageInput = document.getElementById('guestbook-message');
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) {
        alert("Please enter both your name and a message.");
        return;
    }

    try {
        const response = await fetch('/api/guestbook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, message })
        });

        if (!response.ok) {
            const errorData = await response.json(); // Get error details
            throw new Error(`Server error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const newEntry = await response.json(); //we dont need to use this

        // Add the new entry to the display (without reloading)
        displayGuestbookEntries()

        // Clear the form
        nameInput.value = '';
        messageInput.value = '';

    } catch (error) {
        console.error("Error submitting guestbook entry:", error);
        alert(`Error submitting entry: ${error.message}`); // User-friendly error
    }
}

// --- DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('stats.html')) {
        fetchAndDisplayStats();
    } else if (window.location.pathname.includes('players.html')){
      fetchAndDisplayMembers();
    } else {
        // index.html - Load guestbook entries and set up form
        displayGuestbookEntries();

        const guestbookForm = document.getElementById('guestbook-form');
        if (guestbookForm) {
            guestbookForm.addEventListener('submit', submitGuestbookEntry);
        }
    }
});