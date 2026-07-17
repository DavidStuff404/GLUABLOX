const express = require("express");
const app = express();
app.use(express.json());

// Store active players and their coordinates
let players = {};

// Roblox sends updates here every 0.1 seconds
app.post("/update-pose", (req, res) => {
  const { username, x, y, z, angle } = req.body;
  if (username) {
    players[username] = { x, y, z, angle, lastSeen: Date.now() };
  }
  res.sendStatus(200);
});

// Roblox sends a signal here when a player leaves
app.post("/player-left", (req, res) => {
  const { username } = req.body;
  delete players[username];
  res.sendStatus(200);
});

// GMod fetches this to get everyone's positions
app.get("/sync-world", (req, res) => {
  // Clean up players who disconnected (inactive for > 5 seconds)
  const now = Date.now();
  for (let name in players) {
    if (now - players[name].lastSeen > 5000) {
      delete players[name];
    }
  }
  res.json(players);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bridge server is running on port ${PORT}`);
});
