import "./style.css";

const API_CHAT = "http://localhost:5000/api/chat";
const API_TALKS = "http://localhost:5000/api/talks";

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatArea = document.getElementById("chat-area");
const talksArea = document.getElementById("talks-area");
const detailModal = document.getElementById("detail-modal");

let chat = [];

// Handle chat form submission and update chat
chatForm.onsubmit = async (e) => {
  e.preventDefault();
  const userInput = chatInput.value;
  chatInput.value = "";
  chat.push({ role: "user", content: userInput });
  renderChat(chat);
  const res = await fetch(API_CHAT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat }),
  });
  const data = await res.json();
  chat = data;
  console.log(chat);
  renderChat(chat);
  fetchTalks();
};

// Render chat bubbles in chat area and auto-scroll to bottom
function renderChat(chat) {
  console.log(chat);
  chatArea.innerHTML = chat
    .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.content && msg.content.trim() !== "")
    .map(msg => {
      // Replace line breaks with <br>
      const formatted = msg.content.replace(/\n/g, "<br>");
      return `<div class="bubble ${msg.role}">${msg.role === 'user' ? '👤' : '🤖'} ${formatted}</div>`;
    })
    .join('');
  // Auto-scroll to bottom
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Fetch and render all talks
async function fetchTalks() {
  const res = await fetch(API_TALKS);
  const talks = await res.json();
  renderTalks(talks);
}

// Render talks list with detail and delete buttons
function renderTalks(talks) {
  talksArea.innerHTML = "<h2>All Talks</h2>";
  talks.forEach(talk => {
    const div = document.createElement("div");
    div.className = "talk";
    div.innerHTML = `
      <div>
        <strong>${talk.title}</strong> (${talk.category})<br>
        <span>${talk.speaker.name}</span>
      </div>
      <div>
        <button data-id="${talk.id}" class="detail-btn">Details</button>
        <button data-id="${talk.id}" class="delete-btn">X</button>
      </div>
    `;
    talksArea.appendChild(div);
  });
}

// Handle talk detail and delete button clicks
talksArea.addEventListener("click", async (e) => {
  const target = e.target;
  if (target.classList.contains("delete-btn")) {
    const id = target.getAttribute("data-id");
    await fetch(`${API_TALKS}/${id}`, { method: "DELETE" });
    fetchTalks();
  }
  if (target.classList.contains("detail-btn")) {
    const id = target.getAttribute("data-id");
    const res = await fetch(`${API_TALKS}/${id}`);
    const talk = await res.json();
    showDetail(talk);
  }
});

// Show talk details in modal
function showDetail(talk) {
  detailModal.className = "";
  detailModal.innerHTML = `
    <div class="modal-content">
      <h2>${talk.title}</h2>
      <p>${talk.abstract}</p>
      <p><strong>Speaker:</strong> ${talk.speaker.name} (${talk.speaker.experience_level})</p>
      <p><strong>Co-Speaker:</strong> ${talk.co_speakers.map(c => c.name).join(", ")}</p>
      <p><strong>Category:</strong> ${talk.category}</p>
      <p><strong>Format:</strong> ${talk.format}</p>
      <p><strong>Keywords:</strong> ${talk.keywords.join(", ")}</p>
      <p><strong>Date:</strong> ${talk.proposed_datetime}</p>
      <button id="close-detail">Close</button>
    </div>
  `;
  document.getElementById("close-detail").onclick = function() {
    detailModal.className = "hidden";
  };
}

// Initial fetch of talks
fetchTalks();
