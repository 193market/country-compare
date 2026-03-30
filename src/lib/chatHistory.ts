import type { ChartData } from "@/components/DataChart";

export interface Message {
  role: "user" | "assistant";
  content: string;
  charts?: ChartData[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "datalens-chats";
const MAX_SESSIONS = 50;

function readAll(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

function writeAll(sessions: ChatSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function saveChatSession(session: ChatSession): void {
  const sessions = readAll();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }

  // Keep max 50, remove oldest by updatedAt
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  writeAll(sessions.slice(0, MAX_SESSIONS));
}

export function loadChatSessions(): ChatSession[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadChatSession(id: string): ChatSession | null {
  return readAll().find((s) => s.id === id) ?? null;
}

export function deleteChatSession(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function clearAllSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateSessionTitle(text: string): string {
  return text.replace(/[^\w\s\u3131-\uD79D\u4E00-\u9FFF.,?!-]/g, "").trim().slice(0, 50);
}

export function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
