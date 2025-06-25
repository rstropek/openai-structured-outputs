// In-memory array to store talks
const talks = [
  {
    id: "1",
    title: "AI Ethics and Responsibility",
    abstract: "A talk about ethical questions and responsibility in dealing with Artificial Intelligence.",
    speaker: {
      name: "Melanie Bauer",
      email: "melanie.bauer@example.com",
      experience_level: "advanced"
    },
    co_speakers: [],
    category: "AI",
    format: "Talk",
    keywords: ["Ethics", "AI"],
    proposed_datetime: "2024-07-01T10:00:00Z"
  }
];

// Get all talks
function getTalks() {
  return talks;
}

// Get a single talk by ID
function getTalk(id) {
  return talks.find(t => t.id === id);
}

// Delete a single talk by ID
function deleteTalk(id) {
  const idx = talks.findIndex(t => t.id === id);
  if (idx !== -1) talks.splice(idx, 1);
}

// Delete multiple talks by their IDs
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

// Add a talk proposal (with error handling)
function submit_talk_proposal(talk) {
  try {
    talks.push(talk);
    return true;
  } catch (e) {
    return false;
  }
}

// Export all talk functions
module.exports = { getTalks, getTalk, deleteTalk, deleteMultipleTalks, submit_talk_proposal };
