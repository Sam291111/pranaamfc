require('dotenv').config();
const express = require('express');
const { EAFCApiService } = require('eafc-clubs-api');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;
const apiService = new EAFCApiService();

app.use(cors());

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

        console.log(`Fetching stats for clubId: ${clubId}, platform: ${platform}`);

        // We let the apiService handle the fetching, as shown before.
        let stats;
        try{
          stats = await apiService.overallStats({ clubIds: clubId, platform });
        } catch (error){
          console.error("Error within the apiService:", error)
          return res.status(500).json({error: "Failed to fetch data from the API", message: error.message})
        }

        // Log the raw response BEFORE parsing it as JSON:
        console.log("Raw API Response (stats):", stats);

        res.json(stats); // Send the JSON data


    } catch (error) {
        console.error("Error in /api/stats:", error);
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
        console.log(`Fetching members for clubId: ${clubId}, platform: ${platform}`);

        let memberStats;
        try {
          memberStats = await apiService.memberStats({ clubId, platform });
        }
        catch(error){
          console.error("Error within the apiService:", error)
          return res.status(500).json({error: "Failed to fetch data from the API", message: error.message})
        }

        // Log the raw response BEFORE parsing it as JSON:
        console.log("Raw API Response (members):", memberStats);

        res.json(memberStats);
    } catch (error) {
        console.error("Error in /api/members:", error);
        res.status(500).json({ error: 'Failed to fetch member stats', message: error.message});
    }
});

// API endpoint for club search
app.get('/api/search', async (req, res) => {
    try {
        const clubName = req.query.clubName;
        const platform = process.env.PLATFORM;

        if (!clubName) {
            return res.status(400).json({ error: 'clubName query parameter is required' });
        }
        if (!platform) {
          throw new Error("PLATFORM must be set");
        }
        console.log(`Searching for club: ${clubName}, platform: ${platform}`);

        let searchResults;
        try{
          searchResults = await apiService.searchClub({ clubName, platform });
        } catch (error) {
          console.error("Error within the apiService:", error)
          return res.status(500).json({error: "Failed to fetch data from the API", message: error.message})
        }


        // Log the raw response BEFORE parsing it as JSON:
        console.log("Raw API Response (search):", searchResults);

        res.json(searchResults);

    } catch (error) {
        console.error("Error in /api/search:", error);
        res.status(500).json({ error: 'Failed to search for club', message: error.message });
    }
});

// API endpoint to get club info
app.get('/api/clubinfo', async (req, res) => {
    try {
        const clubId = process.env.CLUB_ID;
        const platform = process.env.PLATFORM;
        if(!clubId || !platform){
          throw new Error("CLUB_ID and PLATFORM must be set")
        }
        console.log(`Fetching club info for clubId: ${clubId}, platform: ${platform}`);

        let clubInfo;
        try{
          clubInfo = await apiService.clubInfo({ clubIds: clubId, platform });
        } catch(error){
          console.error("Error within the apiService:", error)
          return res.status(500).json({error: "Failed to fetch data from the API", message: error.message})
        }


        // Log the raw response BEFORE parsing it as JSON:
        console.log("Raw API Response (clubinfo):", clubInfo);
        res.json(clubInfo);
    } catch (error) {
        console.error("Error in /api/clubinfo:", error);
        res.status(500).json({ error: 'Failed to get club info', message: error.message });
    }
});

// Serve index.html for all other routes (for client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});