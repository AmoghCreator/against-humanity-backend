// index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust to frontend port
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

let blackCard = { text: "This is a black card prompt." };
let whiteCardsData = [
  { id: "w1", text: "White Card 1" },
  { id: "w2", text: "White Card 2" },
  { id: "w3", text: "White Card 3" },
];
let players = {}; // Store players as an object with socket IDs as keys

// Helper function to reset game state
function resetGameState() {
  blackCard = { text: "New Black Card Prompt" };
  whiteCardsData = [
    { id: "w1", text: "White Card 1" },
    { id: "w2", text: "White Card 2" },
    { id: "w3", text: "White Card 3" },
  ];
  for (let playerId in players) {
    players[playerId].selectedCard = ""; // Reset selections
  }
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for joinGame to register a new player
  socket.on("joinGame", (name) => {
    players[socket.id] = { id: socket.id, name, selectedCard: "" };

    // Broadcast the updated game state to all clients
    io.emit("gameState", {
      blackCard,
      whiteCards: whiteCardsData,
      players: Object.values(players),
    });
  });

  // Handle card selection
  socket.on("playCard", (cardId) => {
    const player = players[socket.id];
    if (player && !player.selectedCard) { // Allow only one selection per round
      const card = whiteCardsData.find((c) => c.id === cardId);
      if (card) {
        player.selectedCard = card.text;

        // Broadcast updated game state to all clients
        io.emit("gameState", {
          blackCard,
          whiteCards: whiteCardsData,
          players: Object.values(players),
        });
      }
    }
  });

  // Listen for refreshGame to start a new round
  socket.on("refreshGame", () => {
    resetGameState();

    // Broadcast the reset game state
    io.emit("gameState", {
      blackCard,
      whiteCards: whiteCardsData,
      players: Object.values(players),
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    delete players[socket.id]; // Remove player

    // Broadcast updated game state to all clients
    io.emit("gameState", {
      blackCard,
      whiteCards: whiteCardsData,
      players: Object.values(players),
    });
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
