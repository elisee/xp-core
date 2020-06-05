"use strict";

const http = require("http");
const path = require("path");
const fs = require("fs");
const Git = require("nodegit");
const express = require("express");
const { validate } = require("./input");

const app = express();

app.use(express.static(path.resolve(__dirname, "../public")));
app.use("/game", express.static(path.resolve(__dirname, "../game/public")));

app.use(require("body-parser").json());

app.post("/api/github/push/5H08B3Ica3", (req, res) => {
  res.status(200).send();

  console.log("Got a push event from GitHub!");
  console.log(req.body);
});

const server = require("http").createServer(app);
const io = require("socket.io")(server, { transports: ["websocket"] });

server.listen(4000);
console.log(`XP Core started in ${app.get("env")} mode.`);

const userEntries = [];
const usersByUsername = {};

io.on("connect", (socket) => {
  let user;

  socket.on("joinCore", (username, callback) => {
    if (!validate.string(username, 1, 30)) return socket.disconnect(true);
    if (!validate.function(callback)) return socket.disconnect(true);

    const entry = { username };
    user = { entry, socket };

    usersByUsername[entry.username] = user;
    userEntries.push(entry);

    callback({ userEntries });

    io.in("xp").emit("addUserEntry", entry);
    socket.join("xp");
  });

  socket.on("chat", (text) => {
    if (user == null) return;
    if (!validate.string(text, 1, 300)) return socket.disconnect(true);

    io.in("xp").emit("chat", user.entry.username, text);
  });

  socket.on("disconnect", () => {
    if (user == null) return;

    userEntries.splice(userEntries.indexOf(user.entry), 1);
    io.in("xp").emit("removeUserEntry", user.entry.username);
  });
});
