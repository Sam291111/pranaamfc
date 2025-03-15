require('dotenv').config();
const express = require('express');
const { EAFCApiService } = require('eafc-clubs-api'); // Now it's a regular require
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001; // Use AlwaysData's PORT or default to 3001
const apiService = new EAFCApiService();

app.use(cors()); // Enable CORS for all routes.  Less crucial on Heroku, but good practice.

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

// API endpoint to get overall club stats
app.get('/api/stats', async (req, res) => {
    try {
        const clubId = process.env.CLUB_ID;
        const platform = process.env.PLATFORM;
        if (!clubId || !platform) {
            throw new Error("CLUB_ID and PLATFORM must be set in .env");
        }
        const stats = await apiService.overallStats({ clubIds: clubId, platform });
        res.json(stats);
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
         const memberStats = await apiService.memberStats({ clubId, platform });
         res.json(memberStats);
     } catch (error) {
         console.error("Error fetching member stats:", error);
         res.status(500).json({ error: 'Failed to fetch member stats' });
     }
 });

// API endpoint to get club search
app.get('/api/search', async (req, res) => {
 try {
   const clubName = req.query.clubName; // Get clubName from query parameter
   const platform = process.env.PLATFORM; // Still use platform from .env

     if (!clubName) {
         return res.status(400).json({ error: 'clubName query parameter is required' });
     }

   const searchResults = await apiService.searchClub({ clubName, platform });
   res.json(searchResults);

 } catch (error) {
   console.error("Error searching for club:", error);
   res.status(500).json({ error: 'Failed to search for club', message: error.message});
 }
});

 // API to get club info
app.get('/api/clubinfo', async(req, res) => {
 try {
   const clubId = process.env.CLUB_ID;
   const platform = process.env.PLATFORM
   const clubInfo = await apiService.clubInfo({clubIds: clubId, platform});
   res.json(clubInfo);
 } catch (error){
   console.error("Error getting club info", error);
   res.status(500).json({ error: 'Failed to get club info', message: error.message});
 }
});

// IMPORTANT: Serve index.html for *any* other route.  This is crucial
// for client-side routing to work correctly with frameworks like React,
// Vue, or even just with different HTML files.  Without this, refreshing
// on a page other than the root (/) will result in a 404 error.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});