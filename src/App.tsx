import { useState, useRef, useEffect } from 'react';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { SessionHistory } from './components/SessionHistory';
import { OpenUIRenderer } from './components/OpenUIRenderer';
import { PromptInput } from './components/PromptInput';
import { useChat } from './hooks/useChat';
import { SettingsDialog } from './components/SettingsDialog';

export function App() {
  const {
    currentResponse,
    isStreaming,
    error,
    sessionHistory,
    activeSessionId,
    health,
    selectedPrompt,
    refreshHealth,
    sendMessage,
    stopStreaming,
    selectSession,
    clearSession,
    deleteSession,
    deletedSession,
    undoDelete,
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeMobileSidebar = () => { if (window.innerWidth <= 768) setIsSidebarOpen(false); };
  const openSettings = () => { closeMobileSidebar(); setSettingsOpen(true); };
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setIsSidebarOpen(!media.matches);
    media.addEventListener('change', update);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsSidebarOpen(false); };
    window.addEventListener('keydown', escape);
    return () => { media.removeEventListener('change', update); window.removeEventListener('keydown', escape); };
  }, []);

  // Auto-scroll when new content arrives
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [currentResponse, isStreaming]);

  const handleNewChat = () => {
    clearSession();
    closeMobileSidebar();
  };

  return (
    <div className="chatgpt-layout">
      {deletedSession && <div className="undo-toast" role="status">Chat deleted <button onClick={undoDelete}>Undo</button></div>}
      {isSidebarOpen && <button className="sidebar-backdrop" aria-label="Close chat history" onClick={() => setIsSidebarOpen(false)} />}
      {settingsOpen && <SettingsDialog health={health} onClose={() => setSettingsOpen(false)} onConnectionChange={refreshHealth} disabled={isStreaming} />}
      {/* Collapsible ChatGPT Sidebar */}
      <SessionHistory
        history={sessionHistory}
        activeSessionId={activeSessionId}
        onSelectSession={id => { selectSession(id); closeMobileSidebar(); }}
        onDeleteSession={deleteSession}
        onSettings={openSettings}
        onNewPrompt={handleNewChat}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Stage */}
      <div className="chatgpt-main-stage">
        <WorkspaceHeader
          onSettings={openSettings}
          health={health}
          onRefreshHealth={refreshHealth}
          onClearSession={clearSession}
          onNewChat={handleNewChat}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          hasMessages={sessionHistory.length > 0 || Boolean(currentResponse)}
        />

        <div className="chatgpt-scroll-container" ref={scrollContainerRef}>
          <div className="chatgpt-content-column">
            <OpenUIRenderer
              key={activeSessionId || 'welcome'}
              content={currentResponse}
              isStreaming={isStreaming}
              error={error}
              prompt={selectedPrompt}
              onSelectPrompt={(p) => sendMessage(p)}
            />
          </div>
        </div>

        {/* Docked Floating ChatGPT Input */}
        <div className="chatgpt-bottom-dock">
          <PromptInput
            onSendMessage={sendMessage}
            onStopStreaming={stopStreaming}
            isStreaming={isStreaming}
            disabled={health !== null && health.status === 'error'}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
