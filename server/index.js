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

app.use(require("body-parser").json());

const { execSync, spawn } = require("child_process");

let gameProcess;

app.post("/api/github/push/5H08B3Ica3", async (req, res) => {
  res.status(200).send();
  console.log("Got a push event from GitHub!");

  await updateRepo();
  restartGameServer();
});

const server = require("http").createServer(app);
const io = require("socket.io")(server, { transports: ["websocket"] });

const userEntries = [];
const usersByToken = {};

io.on("connect", (socket) => {
  let user;

  socket.on("joinCore", (userToken, nickname, callback) => {
    if (!validate.string(userToken, 16, 16)) return socket.disconnect(true);
    if (!validate.string(nickname, 1, 30)) return socket.disconnect(true);
    if (!validate.function(callback)) return socket.disconnect(true);

    if (usersByToken[userToken] != null) return socket.disconnect(true);

    const entry = { nickname };
    user = { entry, userToken, socket };

    usersByToken[user.userToken] = user;
    userEntries.push(entry);

    callback({ userEntries });

    io.in("xp").emit("addUserEntry", entry);
    socket.join("xp");
  });

  socket.on("chat", (text) => {
    if (user == null) return;
    if (!validate.string(text, 1, 300)) return socket.disconnect(true);

    io.in("xp").emit("chat", user.entry.nickname, text);
  });

  socket.on("disconnect", () => {
    if (user == null) return;

    userEntries.splice(userEntries.indexOf(user.entry), 1);
    io.in("xp").emit("removeUserEntry", user.entry.nickname);
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
  const commit = await repo.getReferenceCommit("origin/tribes");
  await Git.Reset.reset(repo, commit, Git.Reset.TYPE.HARD, {});
  const repoHash = (await repo.getHeadCommit()).sha();
  console.log(`Repo updated at ${repoHash}!`);
}

function startGameServer() {
  console.log("Game: npm install");
  execSync("npm install", { cwd: xpGamePath });

  gameProcess = spawn("node", [xpGamePath]);
  console.log("Game process started.");

  gameProcess.stdout.on("data", (data) => {
    const text = data.toString("utf8").trimEnd();
    if (text === "XP_GAME_STARTED") io.in("xp").emit("reloadGame");

    io.in("xp").emit("chat", "[GAME OUT]", text);
  });

  gameProcess.stderr.on("data", (data) => {
    io.in("xp").emit("chat", "[GAME ERR]", data.toString("utf8"));
  });

  gameProcess.on("exit", (code) => {
    console.log(`Game process exited with code ${code}.`);
    io.in("xp").emit("chat", "[GAME EXIT]", code);
    gameProcess = null;
    startGameServer();
  });
}

function restartGameServer() {
  if (!gameProcess.kill()) throw new Error("Failed to kill game process.");
}

async function start() {
  await updateRepo();
  startGameServer();

  server.listen(4000);
  console.log(`XP Core started in ${app.get("env")} mode.`);
}

start();
