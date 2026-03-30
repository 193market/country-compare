"use client";

import type { ChatSession } from "@/lib/chatHistory";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onClearAll,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  function handleClearAll() {
    if (confirm("Delete all conversations?")) {
      onClearAll();
    }
  }

  function formatDate(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 z-50 h-dvh w-[280px] bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* New Chat button */}
        <div className="p-3 border-b border-gray-800">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-8">
              No conversations yet
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 px-3 py-2.5 mx-2 my-0.5 rounded-lg cursor-pointer transition-colors ${
                  s.id === activeSessionId
                    ? "bg-gray-800"
                    : "hover:bg-gray-800/50"
                }`}
                onClick={() => {
                  onSelectSession(s.id);
                  onClose();
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">
                    {s.title || "Untitled"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(s.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
                  title="Delete"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Clear All */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={handleClearAll}
              className="w-full text-xs text-gray-500 hover:text-red-400 py-1.5 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
