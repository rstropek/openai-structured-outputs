/** Experience level for a speaker */
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

/** Talk category */
export type TalkCategory =
  | "AI"
  | "Web Development"
  | "Security"
  | "DevOps"
  | "UX"
  | "Other";

/** Talk format */
export type TalkFormat = "Talk" | "Workshop" | "Lightning Talk";

export interface Speaker {
  name: string;
  email: string;
  experience_level: ExperienceLevel;
}

export interface CoSpeaker {
  name: string;
  email: string;
}

export interface Talk {
  id: string;
  title: string;
  abstract: string;
  speaker: Speaker;
  co_speakers: CoSpeaker[];
  category: TalkCategory;
  format: TalkFormat;
  keywords: string[];
  proposed_datetime: string;
}

const talks: Talk[] = [
  {
    id: "1",
    title: "AI Ethics and Responsibility",
    abstract:
      "A talk about ethical questions and responsibility in dealing with Artificial Intelligence.",
    speaker: {
      name: "Melanie Bauer",
      email: "melanie.bauer@example.com",
      experience_level: "advanced",
    },
    co_speakers: [],
    category: "AI",
    format: "Talk",
    keywords: ["Ethics", "AI"],
    proposed_datetime: "2026-03-03T10:00:00Z",
  },
];

export function getTalks(): Talk[] {
  return talks;
}

export function getTalk(id: string): Talk | undefined {
  return talks.find((t) => t.id === id);
}

export function deleteTalk(id: string): void {
  const idx = talks.findIndex((t) => t.id === id);
  if (idx !== -1) talks.splice(idx, 1);
}

export function deleteMultipleTalks(ids: string[]): number {
  let deletedCount = 0;
  ids.forEach((id) => {
    const idx = talks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      talks.splice(idx, 1);
      deletedCount++;
    }
  });
  return deletedCount;
}

export function submit_talk_proposal(talk: Talk): boolean {
  try {
    talks.push(talk);
    return true;
  } catch {
    return false;
  }
}
