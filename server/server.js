require('dotenv').config();
const express = require('express');
const { EAFCApiService } = require('eafc-clubs-api');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Import the 'fs' module (File System)

const app = express();
const port = process.env.PORT || 3001;
const apiService = new EAFCApiService();

app.use(cors());
app.use(express.json()); // Add this line to parse JSON request bodies

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

// --- (Existing API routes: /api/stats, /api/members - no changes needed) ---
app.get('/api/stats', async (req, res) => {
  try {
      const clubId = process.env.CLUB_ID;
      const platform = process.env.PLATFORM;
      if (!clubId || !platform) {
          throw new Error("CLUB_ID and PLATFORM must be set in .env");
      }
      const stats = await apiService.overallStats({ clubIds: clubId, platform });

      // Add platform to the response
       res.json({ stats: stats, platform: platform }); // Send stats AND platform


  } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

// API endpoint to get member stats
app.get('/api/members', async (req, res) => {
  try {
      const clubId = process.env.CLUB_ID;
      const platform = process.env.PLATFORM;
      if (!clubId || !platform) {
          throw new Error("CLUB_ID and PLATFORM must be set");
      }
      const memberStats = await apiService.memberStats({ clubId, platform });
      res.json(memberStats);
  } catch (error) {
      console.error("Error fetching member stats:", error);
      res.status(500).json({ error: 'Failed to fetch member stats', message: error.message});
  }
});

// --- Guestbook API Endpoints ---

// GET /api/guestbook:  Get all guestbook entries
app.get('/api/guestbook', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'guestbook.json'); //create a variable
        console.log("Guestbook file path:", filePath); // Log the path

        const data = fs.readFileSync(filePath, 'utf-8');
        const entries = JSON.parse(data);
        res.json(entries);
    } catch (error) {
        console.error("Error reading guestbook:", error);
        res.status(500).json({ error: 'Failed to read guestbook' });
    }
});

// POST /api/guestbook: Add a new guestbook entry
app.post('/api/guestbook', (req, res) => {
    try {
        const { name, message } = req.body;

        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required' });
        }
        const filePath = path.join(__dirname, 'guestbook.json');
        console.log("Guestbook file path:", filePath);

        const data = fs.readFileSync(filePath, 'utf-8');
        const entries = JSON.parse(data);

        const newEntry = {
            id: entries.length > 0 ? entries[entries.length - 1].id + 1 : 1, // Simple incrementing ID
            name: name,
            message: message,
            timestamp: new Date().toISOString() // ISO 8601 format
        };

        entries.push(newEntry);
        fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8'); // Write back to file

        res.status(201).json(newEntry); // Return the new entry (good practice)

    } catch (error) {
        console.error("Error adding to guestbook:", error);
        res.status(500).json({ error: 'Failed to add entry to guestbook' });
    }
});


// Serve index.html for all other routes (for client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});