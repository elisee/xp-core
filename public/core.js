"use strict";

const socket = io({ reconnection: false, transports: ["websocket"] });

let userEntries = [];

const chatLogElt = $(".chatLog");

socket.on("disconnect", () => {
  document.body.innerHTML = `<div class="disconnected">You've been disconnected.</div>`;
});

socket.emit("joinCore", prompt("Enter your nickname", "guest"), (data) => {
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

socket.on("chat", (username, text) => {

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
  $("iframe").contentWindow.location.reload();
});

function refreshUsersList() {
  const usersListElt = $(".usersList");
  usersListElt.innerHTML = "";

  for (const userEntry of userEntries) {
    $make("div", usersListElt, { textContent: userEntry.username });
  }
}
