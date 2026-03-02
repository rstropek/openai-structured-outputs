import "./style.css";
import { marked } from "https://esm.sh/marked@15.0.4";

const API_CHAT = "http://localhost:5001/api/chat";

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatArea = document.getElementById("chat-area");

let chat = [];

marked.setOptions({ gfm: true });

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatMessageContent(content, role) {
  const trimmed = (content || "").trim();
  if (!trimmed) return "";
  if (role === "user") {
    return escapeHtml(trimmed).replace(/\n/g, "<br>");
  }
  return marked.parse(trimmed);
}

chatForm.onsubmit = async (e) => {
  e.preventDefault();
  const userInput = chatInput.value;
  chatInput.value = "";
  chat.push({ role: "user", content: userInput });
  renderChat(chat);
  try {
    const res = await fetch(API_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat }),
    });
    const data = await res.json();
    chat = data;
    renderChat(chat);
  } catch (err) {
    console.error(err);
    chat.push({ role: "assistant", content: "Sorry, something went wrong. Check the server and try again." });
    renderChat(chat);
  }
};

function renderChat(chat) {
  chatArea.innerHTML = chat
    .filter((msg) => (msg.role === "user" || msg.role === "assistant") && msg.content && msg.content.trim() !== "")
    .map((msg) => {
      const formatted = formatMessageContent(msg.content, msg.role);
      return `<div class="bubble ${msg.role}">${msg.role === "user" ? "👤" : "🤖"} <span class="bubble-body">${formatted}</span></div>`;
    })
    .join("");
  chatArea.scrollTop = chatArea.scrollHeight;
}
