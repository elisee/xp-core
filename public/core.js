"use strict";

const socket = io({ reconnection: false, transports: ["websocket"] });

let userEntries = [];

const chatLogElt = $(".chatLog");

socket.on("disconnect", () => {
  document.body.innerHTML = `<div class="disconnected">You've been disconnected.</div>`;
});

const username = prompt("Enter your nickname", "guest");
loadGame();

socket.emit("joinCore", username, (data) => {
  userEntries = data.userEntries;
  refreshUsersList();
});

socket.on("addUserEntry", (userEntry) => {
  userEntries.push(userEntry);
  refreshUsersList();

  $make("div", chatLogElt, { textContent: `— ${userEntry.username} has joined.` });
  chatLogElt.scrollTop = chatLogElt.scrollHeight;
});

socket.on("removeUserEntry", (username) => {
  userEntries.splice(userEntries.findIndex(x => x.username === username), 1);
  refreshUsersList();

  $make("div", chatLogElt, { textContent: `— ${username} has left.` });
  chatLogElt.scrollTop = chatLogElt.scrollHeight;
});

let chatMessageCount = 0;
const maxChatMessageCount = 200;

socket.on("chat", (username, text) => {
  chatMessageCount++;
  if (chatMessageCount > maxChatMessageCount) chatLogElt.removeChild(chatLogElt.firstChild);

  $make("div", chatLogElt, { textContent: `${username}: ${text}` });
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
  const iframe = $make("iframe", null, { src: "//xpgame.jklm.fun" });
  document.body.insertBefore(iframe, document.body.firstElementChild);

  iframe.addEventListener("load", () => {
    iframeWindow = iframe.contentWindow;
    iframeWindow.postMessage(JSON.stringify({ name: "setUsername", username }), "*");
  });
}

function refreshUsersList() {
  const usersListElt = $(".usersList");
  usersListElt.innerHTML = "";

  for (const userEntry of userEntries) {
    $make("div", usersListElt, { textContent: userEntry.username });
  }
}
