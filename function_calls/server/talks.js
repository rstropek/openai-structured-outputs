const talks = [
  {
    id: "1",
    title: "KI-Ethik und Verantwortung",
    abstract: "Ein Vortrag über ethische Fragestellungen und Verantwortung im Umgang mit Künstlicher Intelligenz.",
    speaker: {
      name: "Melanie Bauer",
      email: "melanie.bauer@example.com",
      experience_level: "advanced"
    },
    co_speakers: [],
    category: "AI",
    format: "Talk",
    keywords: ["Ethik", "KI"],
    proposed_datetime: "2024-07-01T10:00:00Z"
  }
];

function addTalk(talk) {
  talks.push(talk);
}

function getTalks() {
  return talks;
}

function getTalk(id) {
  return talks.find(t => t.id === id);
}

function deleteTalk(id) {
  const idx = talks.findIndex(t => t.id === id);
  if (idx !== -1) talks.splice(idx, 1);
}

function deleteMultipleTalks(ids) {
  const deletedCount = 0;
  ids.forEach(id => {
    const idx = talks.findIndex(t => t.id === id);
    if (idx !== -1) {
      talks.splice(idx, 1);
      deletedCount++;
    }
  });
  return deletedCount;
}

function submit_talk_proposal(talk) {
  try {
    talks.push(talk);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { addTalk, getTalks, getTalk, deleteTalk, deleteMultipleTalks, submit_talk_proposal };
