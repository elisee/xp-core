"use strict";

const http = require("http");
const path = require("path");
const fs = require("fs");
const Git = require("nodegit");
const express = require("express");
const { validate } = require("./input");

const app = express();
app.use(express.static(path.resolve(__dirname, "../public")));

const xpGamePath = path.resolve(__dirname, "../xp-game");
app.use("/xp-game", express.static(path.join(xpGamePath, "public")));

app.use(require("body-parser").json());

app.post("/api/github/push/5H08B3Ica3", async (req, res) => {
  res.status(200).send();
  console.log("Got a push event from GitHub!");

  await updateRepo();
});

const server = require("http").createServer(app);
const io = require("socket.io")(server, { transports: ["websocket"] });

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


async function updateRepo() {
  let repo;

  try {
    console.log("Opening existing repo if any...");
    repo = await Git.Repository.open(xpGamePath);
    console.log("Opened repo successfully.");
  }
  catch {
    console.log("Failed to open repo, cloning...");
    repo = await Git.Clone.clone("https://github.com/elisee/xp-game", xpGamePath);
    const repoHash = (await repo.getHeadCommit()).sha();
    console.log(`Repo cloned at ${repoHash}!`);
    return;
  }

  await repo.fetch("origin");
  const commit = await repo.getReferenceCommit("origin/master");
  await Git.Reset.reset(repo, commit, Git.Reset.TYPE.HARD, {});
  const repoHash = (await repo.getHeadCommit()).sha();
  console.log(`Repo updated at ${repoHash}!`);
}

async function start() {
  await updateRepo();

  server.listen(4000);
  console.log(`XP Core started in ${app.get("env")} mode.`);
}

start();
