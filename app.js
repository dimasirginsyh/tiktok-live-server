const express = require("express");
const http = require("http");

const { WebcastPushConnection } = require("tiktok-live-connector");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

const USERNAME = "username_tiktok";
const liveConnector = new WebcastPushConnection(USERNAME);

let tiktokConnected = false;

liveConnector
  .connect()
  .then((state) => {
    tiktokConnected = state.isConnected;
    console.info(`Connected to roomId ${state.roomId}`);
  })
  .catch((err) => {
    console.error("Failed to connect", err);
  });

io.on("connection", (socket) => {
  console.log("user connected");

  liveConnector.on("chat", (data) => {
    if (tiktokConnected) {
      console.log(`${data.uniqueId}: ${data.comment}`);
      io.emit("chat", `${data.uniqueId}: ${data.comment}`);
    }
  });

  liveConnector.on("gift", (data) => {
    if (tiktokConnected) {
      const gift = data.label
        .replace("{0:user}", data.nickname)
        .replace("{1:gift}", data.giftName)
        .replace("{2:string}", `(${data.diamondCount})`);
      console.log(gift);
      io.emit("gift", gift);
    }
  });

  liveConnector.on("subscribe", (data) => {
    if (tiktokConnected) {
      const subscribe = data.label.replace("{0:user}", data.nickname);
      console.log(subscribe);
      io.emit("subscribe", subscribe);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server start on ${PORT}`);
});
