const express = require("express");
const app = express();
app.use(express.json());

let players = {};
let damageEventsToRoblox = {}; // Stores damage dealt in GMod to send to Roblox

app.post("/update-pose", (req, res) => {
  const { username, x, y, z, angle, vx, vy, vz, emote, health, colors } = req.body;
  if (username) {
    players[username] = { 
      x, y, z, angle, 
      vx: vx || 0, vy: vy || 0, vz: vz || 0, 
      emote: emote || "none",
      health: health || 100,
      colors: colors || { r: 255, g: 255, b: 255 },
      lastSeen: Date.now() 
    };
  }
  
  // Return pending damage for this Roblox player if there is any
  const pendingDamage = damageEventsToRoblox[username] || 0;
  if (pendingDamage > 0) {
    delete damageEventsToRoblox[username]; // Clear after reading
    res.json({ damage: pendingDamage });
  } else {
    res.json({ damage: 0 });
  }
});

// GMod sends damage to Roblox player
app.post("/damage-roblox", (req, res) => {
  const { username, damage } = req.body;
  if (username) {
    damageEventsToRoblox[username] = (damageEventsToRoblox[username] || 0) + damage;
  }
  res.sendStatus(200);
});

app.post("/player-left", (req, res) => {
  const { username } = req.body;
  delete players[username];
  delete damageEventsToRoblox[username];
  res.sendStatus(200);
});

app.get("/sync-world", (req, res) => {
  const now = Date.now();
  for (let name in players) {
    if (now - players[name].lastSeen > 5000) {
      delete players[name];
      delete damageEventsToRoblox[name];
    }
  }
  res.json(players);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
