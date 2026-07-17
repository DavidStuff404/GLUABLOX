const express = require("express");
const app = express();
app.use(express.json());

// Store active players and coordinates
let players = {};

// Roblox sends updates here
app.post("/update-pose", (req, res) => {
  const { username, x, y, z, angle } = req.body;
  if (username) {
    players[username] = { x, y, z, angle, lastSeen: Date.now() };
  }
  res.sendStatus(200);
});

// Roblox sends a signal when a player leaves
app.post("/player-left", (req, res) => {
  const { username } = req.body;
  delete players[username];
  res.sendStatus(200);
});

// GMod fetches this to get positions
app.get("/sync-world", (req, res) => {
  // Clean up inactive players (> 5 seconds)
  const now = Date.now();
  for (let name in players) {
    if (now - players[name].lastSeen > 5000) {
      delete players[name];
    }
  }
  res.json(players);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
