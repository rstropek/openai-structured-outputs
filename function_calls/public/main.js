const API_CHAT = "http://localhost:5000/api/chat";
const API_TALKS = "http://localhost:5000/api/talks";

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const talksList = document.getElementById("talks-list");
const detailModal = document.getElementById("detail-modal");

let chat = [];

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
  chat = data.chat;
  renderChat(chat);
  fetchTalks();
};

function renderChat(chat) {
  talksList.innerHTML = chat
    .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.content && msg.content.trim() !== "")
    .map(msg => {
      // Ersetze Zeilenumbrüche durch <br>
      const formatted = msg.content.replace(/\n/g, "<br>");
      return `<div class="bubble ${msg.role}">${msg.role === 'user' ? '👤' : '🤖'} ${formatted}</div>`;
    })
    .join('');
}

// --- Talk List for below the chat ---
const talksArea = document.createElement("div");
talksArea.id = "talks-area";
document.body.appendChild(talksArea);

async function fetchTalks() {
  const res = await fetch(API_TALKS);
  const talks = await res.json();
  renderTalks(talks);
}

function renderTalks(talks) {
  talksArea.innerHTML = "<h2>Alle Vorträge</h2>";
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

function showDetail(talk) {
  detailModal.className = "";
  detailModal.innerHTML = `
    <div class="modal-content">
      <h2>${talk.title}</h2>
      <p>${talk.abstract}</p>
      <p><strong>Speaker:</strong> ${talk.speaker.name} (${talk.speaker.experience_level})</p>
      <p><strong>Co-Speaker:</strong> ${talk.co_speakers.map(c => c.name).join(", ")}</p>
      <p><strong>Kategorie:</strong> ${talk.category}</p>
      <p><strong>Format:</strong> ${talk.format}</p>
      <p><strong>Keywords:</strong> ${talk.keywords.join(", ")}</p>
      <p><strong>Datum:</strong> ${talk.proposed_datetime}</p>
      <button id="close-detail">Schließen</button>
    </div>
  `;
  document.getElementById("close-detail").onclick = function() {
    detailModal.className = "hidden";
  };
}

fetchTalks();
