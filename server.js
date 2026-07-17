const express = require("express");
const app = express();
app.use(express.json());

let players = {};

app.post("/update-pose", (req, res) => {
  const { username, x, y, z, angle, vx, vy, vz } = req.body;
  if (username) {
    players[username] = { 
      x, y, z, angle, 
      vx: vx || 0, vy: vy || 0, vz: vz || 0, 
      lastSeen: Date.now() 
    };
  }
  res.sendStatus(200);
});

app.post("/player-left", (req, res) => {
  const { username } = req.body;
  delete players[username];
  res.sendStatus(200);
});

app.get("/sync-world", (req, res) => {
  const now = Date.now();
  for (let name in players) {
    if (now - players[name].lastSeen > 5000) {
      delete players[name];
    }
  }
  res.json(players);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
