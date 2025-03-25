async function fetchAndDisplayStats() {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return; // Exit if the element doesn't exist
    statsContainer.innerHTML = "<p>Loading stats...</p>";

    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        const data = await response.json();

        if (Array.isArray(data.stats) && data.stats.length > 0) {
            const stats = data.stats[0];
            const gamesPlayed = parseInt(stats.gamesPlayed, 10);
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

// Name mapping object (keep this updated):
const nameMap = {
    'hillsygh': 'Gowri Revadala',
    'billyjp2006_': 'Baba Baba',
    'KA_Luke': 'Sandooge Adebayo',
    'Musthakim': 'Isabel Spiro',
    'Slooo47': 'James Parker',
    // Add other mappings here as needed
};

// NEW function to apply daily change indicators
async function fetchAndApplyDailyChanges() {
    try {
        const response = await fetch('/api/daily_changes');
        if (!response.ok) {
            throw new Error(`HTTP error fetching daily changes! Status: ${response.status}`);
        }
        const changes = await response.json();

        // Find all player profile divs
        const playerProfiles = document.querySelectorAll('.player-profile');

        playerProfiles.forEach(profile => {
            const nameElement = profile.querySelector('h3');
            if (!nameElement) return;

            // Extract the displayed name (before the span might be added)
            const displayedName = nameElement.childNodes[0].nodeValue.trim();

            // Find the API name (gamertag) corresponding to the displayed name
            const apiName = Object.keys(nameMap).find(key => nameMap[key] === displayedName) || displayedName;

            const playerChanges = changes[apiName]; // Look up changes using the API name

            // Remove old indicators first to prevent duplicates
            let existingIndicators = nameElement.querySelectorAll('.change-indicator');
            existingIndicators.forEach(ind => ind.remove());

            // Add new indicators if there are changes
            if (playerChanges) {
                let indicatorHTML = '';
                if (playerChanges.newGoals > 0) {
                    indicatorHTML += ` <span class="change-indicator goal-change">+${playerChanges.newGoals}G</span>`;
                }
                if (playerChanges.newAssists > 0) {
                    indicatorHTML += ` <span class="change-indicator assist-change">+${playerChanges.newAssists}A</span>`;
                }
                if (indicatorHTML) {
                    nameElement.insertAdjacentHTML('beforeend', indicatorHTML);
                }
            }
        });

    } catch (error) {
        console.error("Error fetching or applying daily changes:", error);
        // Optionally display an error message to the user, but don't break the page
    }
}


async function fetchAndDisplayMembers() {
    const membersContainer = document.getElementById('members-container');
    if (!membersContainer) {
        console.error("Could not find 'members-container' element.");
        return;
    }
    membersContainer.innerHTML = '<p>Loading players...</p>';

    try {
        const response = await fetch('/api/members');
        if (!response.ok) {
            throw new Error('Failed to fetch members data');
        }
        const data = await response.json();

        if (data && data.members && data.members.length > 0) {
            let membersHTML = '<h2>Our Legendary Squad</h2>';

            data.members.forEach(member => {
                const displayName = nameMap[member.name] || member.name; // Use name mapping

                membersHTML += `
                    <div class="player-profile">
                        <h3>${displayName} <span class = "blink">♦️</span></h3>
                        <p>Games Played: ${member.gamesPlayed}</p>
                        <p>Goals: ${member.goals}</p>
                        <p>Assists: ${member.assists}</p>
                        <p>Position: ${member.favoritePosition}</p>
                    </div>`;
            });
            membersContainer.innerHTML = membersHTML;

            // *** AFTER displaying members, fetch and apply the daily changes ***
            fetchAndApplyDailyChanges();

        } else {
            membersContainer.innerHTML = '<p>No members data found.</p>';
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        membersContainer.innerHTML = `<p>Error loading members: ${error.message}</p>`;
    }
}

// --- Guestbook Functions ---
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
            // Format the timestamp and map the entries
            const entriesHTML = entries.map(entry => `
                <div class="guestbook-entry">
                    <p><strong>${entry.name}</strong> (${new Date(entry.timestamp).toLocaleString()}):</p>
                    <p>${entry.message}</p>
                </div>
            `).join(''); // Join the array of HTML strings
            entriesContainer.innerHTML = entriesHTML;
        } else {
            entriesContainer.innerHTML = '<p>No entries yet.</p>';
        }
    } catch (error) {
        console.error("Error fetching guestbook entries:", error);
        entriesContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}

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

        const newEntry = await response.json(); // We don't need to use the response here

        // Refresh the entire guestbook display
        displayGuestbookEntries();

        // Clear the form
        nameInput.value = '';
        messageInput.value = '';

    } catch (error) {
        console.error("Error submitting guestbook entry:", error);
        alert(`Error submitting entry: ${error.message}`); // User-friendly error
    }
}

// --- Visitor Count Function ---
async function fetchAndDisplayVisitorCount() {
    const countContainer = document.getElementById('visitor-count');
    if (!countContainer) return; // Exit if container doesn't exist

    try {
        const response = await fetch('/api/count');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const count = await response.json();
        countContainer.textContent = count; // Update the count display
    } catch (error) {
        console.error("Error fetching visitor count:", error);
        countContainer.textContent = 'Error'; // Display error message
    }
}

// --- DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('stats.html')) {
        fetchAndDisplayStats();
    } else if (window.location.pathname.includes('players.html')) {
        fetchAndDisplayMembers(); // This will now also trigger the daily changes check
    } else {
        // index.html - Load guestbook entries, visitor count, and set up form
        displayGuestbookEntries();
        fetchAndDisplayVisitorCount();

        const guestbookForm = document.getElementById('guestbook-form');
        if (guestbookForm) {
            guestbookForm.addEventListener('submit', submitGuestbookEntry);
        }
    }
});