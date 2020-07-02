"use strict";

// Generate a persistent user token for reconnection during a game
function getUserToken() {
  const existingToken = localStorage.getItem("xpUserToken");
  if (existingToken != null && existingToken.length === 16) return existingToken;

  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let token = "";
  const digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";
  for (let i = 0; i < array.length; i++) token += digits[array[i] % digits.length];
  localStorage.setItem("xpUserToken", token);
  return token;
}

const socket = io({ reconnection: false, transports: ["websocket"] });

let userEntries = [];

const chatLogElt = $(".chatLog");

socket.on("disconnect", () => {
  document.body.innerHTML = `<div class="disconnected">You've been disconnected.</div>`;
});

const userToken = getUserToken();
let nickname = localStorage.getItem("xpNickname");
const startForm = $("form.start");

startForm.addEventListener("submit", (event) => {
  if (!startForm.checkValidity()) return;
  event.preventDefault();

  nickname = $(startForm, "input.nickname").value;
  localStorage.setItem("xpNickname", nickname);
  start();
});

if (nickname != null) {
  start();
}

function start() {
  $hide(startForm);
  $show(".loading");
  $show(".sidebar");

  socket.emit("joinCore", userToken, nickname, (data) => {
    userEntries = data.userEntries;
    refreshUsersList();
  });

  loadGame();
}

socket.on("addUserEntry", (userEntry) => {
  userEntries.push(userEntry);
  refreshUsersList();

  $make("div", chatLogElt, { textContent: `— ${userEntry.nickname} has joined.` });
  chatLogElt.scrollTop = chatLogElt.scrollHeight;
});

socket.on("removeUserEntry", (nickname) => {
  userEntries.splice(userEntries.findIndex(x => x.nickname === nickname), 1);
  refreshUsersList();

  $make("div", chatLogElt, { textContent: `— ${nickname} has left.` });
  chatLogElt.scrollTop = chatLogElt.scrollHeight;
});

let chatMessageCount = 0;
const maxChatMessageCount = 200;

socket.on("chat", (nickname, text) => {
  chatMessageCount++;
  if (chatMessageCount > maxChatMessageCount) chatLogElt.removeChild(chatLogElt.firstChild);

  $make("div", chatLogElt, { textContent: `${nickname}: ${text}` });
  chatLogElt.scrollTop = chatLogElt.scrollHeight;
});

const chatTextArea = $(".chatInput textarea");
chatTextArea.addEventListener("keydown", (event) => {
  if (!event.shiftKey && event.keyCode === 13) {
    event.preventDefault();

    const text = chatTextArea.value.trim();
    if (text.length > 0) socket.emit("chat", text);

    chatTextArea.value = "";
  }
});

socket.on("reloadGame", () => {
  document.body.removeChild($("iframe"));

  loadGame();
});

let iframeWindow;

function loadGame() {
  $hide(".loading");

  const iframe = $make("iframe", null, { src: "//xpgame.jklm.fun" });
  document.body.insertBefore(iframe, document.body.firstElementChild);

  iframe.addEventListener("load", () => {
    iframeWindow = iframe.contentWindow;
    iframeWindow.postMessage(JSON.stringify({ name: "setUser", userToken, nickname }), "*");
  });
}

function refreshUsersList() {
  const usersListElt = $(".usersList");
  usersListElt.innerHTML = "";

  for (const userEntry of userEntries) {
    $make("div", usersListElt, { textContent: userEntry.nickname });
  }
}
