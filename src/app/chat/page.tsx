'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ChartData } from '@/components/DataChart';
import { parseCharts } from '@/lib/parseCharts';
import ChatSidebar from '@/components/ChatSidebar';
import ProModal from '@/components/ProModal';
import {
  type Message,
  type ChatSession,
  saveChatSession,
  loadChatSessions,
  loadChatSession,
  deleteChatSession,
  clearAllSessions,
  generateSessionTitle,
  generateSessionId,
} from '@/lib/chatHistory';

const DataChart = dynamic(() => import('@/components/DataChart'), { ssr: false });

const EXAMPLE_QUESTIONS = [
  'Compare South Korea and Japan GDP growth',
  'What is the inflation trend in the US vs EU?',
  'Top 5 countries by unemployment rate',
  '한국과 미국 경제 비교해줘',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const LOADING_MESSAGES = [
    '🔍 Searching World Bank database...',
    '📊 Fetching economic indicators...',
    '🌍 Collecting country data...',
    '🧮 Analyzing trends across years...',
    '📈 Comparing indicators...',
    '✍️ Generating insights...',
    '🔗 Cross-referencing data sources...',
    '📝 Almost done, preparing response...',
  ];
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    setSessions(loadChatSessions());
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((d) => setIsPro(d.pro === true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function startNewChat() {
    setMessages([]);
    setActiveSessionId(null);
    setInput('');
    setSidebarOpen(false);
  }

  function selectSession(id: string) {
    const session = loadChatSession(id);
    if (session) {
      setMessages(session.messages);
      setActiveSessionId(id);
    }
    setSidebarOpen(false);
  }

  function deleteSession(id: string) {
    deleteChatSession(id);
    setSessions(loadChatSessions());
    if (activeSessionId === id) startNewChat();
  }

  function clearAll() {
    clearAllSessions();
    setSessions([]);
    startNewChat();
  }

  async function sendMessage(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || isLoading) return;

    const userMessage: Message = { role: 'user', content: userText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error('Request failed');

      const responseText = await res.text();
      const { text: finalText, charts: finalCharts } = parseCharts(responseText);
      const finalMessage: Message = { role: 'assistant', content: finalText, charts: finalCharts };
      const finalMessages = [...newMessages, finalMessage];
      setMessages(finalMessages);

      // Save session
      const sessionId = activeSessionId ?? generateSessionId();
      const title = generateSessionTitle(userText);
      const session: ChatSession = {
        id: sessionId,
        title,
        messages: finalMessages,
        createdAt: activeSessionId ? (loadChatSession(sessionId)?.createdAt ?? Date.now()) : Date.now(),
        updatedAt: Date.now(),
      };
      saveChatSession(session);
      setActiveSessionId(sessionId);
      setSessions(loadChatSessions());
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: Failed to get response. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={startNewChat}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        onClearAll={clearAll}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold">CountryCompare AI</h1>
            <p className="text-xs text-gray-400">
              {isPro ? 'Pro · World Bank + FRED + Korea + Japan' : 'Free · World Bank data only'}
            </p>
          </div>
          {!isPro && (
            <button
              onClick={() => setShowProModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Upgrade to Pro
            </button>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Ask about any country's economy</h2>
                <p className="text-gray-400 text-sm">
                  {isPro
                    ? 'World Bank · FRED · Korea (ECOS) · Japan (e-Stat)'
                    : 'World Bank data for 200+ countries · Upgrade for FRED & more'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-left transition-colors border border-gray-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl w-full ${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-3 text-sm ml-auto w-fit max-w-full">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div
                        className="prose prose-invert prose-sm max-w-none bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3"
                        dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>')
                            .replace(/`(.+?)`/g, '<code class="bg-gray-700 px-1 rounded text-xs">$1</code>')
                            .replace(/\n/g, '<br />'),
                        }}
                      />
                      {msg.charts?.map((chart: ChartData, ci: number) => (
                        <DataChart key={ci} {...chart} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-300 animate-pulse">
                    {LOADING_MESSAGES[loadingStep]}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-gray-800 bg-gray-900">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any country's economy..."
              rows={1}
              className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500 transition-colors"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <ProModal open={showProModal} onClose={() => { setShowProModal(false); fetch('/api/auth/status').then(r => r.json()).then(d => setIsPro(d.pro === true)); }} />
    </div>
  );
}
