const express = require("express");
const app = express();
app.use(express.json());

let players = {};
let damageEventsToRoblox = {};
let gmodChatsToRoblox = [];
let robloxChatsToGmod = [];

app.post("/update-pose", (req, res) => {
  const { username, x, y, z, angle, vx, vy, vz, emote, health, colors, chatMessage } = req.body;
  
  if (username) {
    players[username] = { 
      x, y, z, angle, 
      vx: vx || 0, vy: vy || 0, vz: vz || 0, 
      emote: emote || "none",
      health: health || 100,
      colors: colors || { r: 255, g: 255, b: 255 },
      lastSeen: Date.now() 
    };

    if (chatMessage) {
      robloxChatsToGmod.push({ username, message: chatMessage });
    }
  }
  
  // Send GMod damage & chats back to Roblox
  const pendingDamage = damageEventsToRoblox[username] || 0;
  if (pendingDamage > 0) delete damageEventsToRoblox[username];

  res.json({ 
    damage: pendingDamage,
    gmodChats: gmodChatsToRoblox 
  });
});

// Clear processed GMod chats after Roblox reads them
app.post("/clear-gmod-chats", (req, res) => {
  gmodChatsToRoblox = [];
  res.sendStatus(200);
});

// GMod posts chat and damage
app.post("/gmod-chat", (req, res) => {
  const { username, message } = req.body;
  gmodChatsToRoblox.push({ username, message });
  res.sendStatus(200);
});

app.post("/damage-roblox", (req, res) => {
  const { username, damage } = req.body;
  if (username) {
    damageEventsToRoblox[username] = (damageEventsToRoblox[username] || 0) + damage;
  }
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
  // Return players and any fresh chats from Roblox
  const chats = [...robloxChatsToGmod];
  robloxChatsToGmod = []; // Clear queue
  res.json({ players, chats });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
