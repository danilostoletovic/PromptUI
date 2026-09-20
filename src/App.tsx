import { useState, useRef, useEffect } from 'react';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { SessionHistory } from './components/SessionHistory';
import { OpenUIRenderer } from './components/OpenUIRenderer';
import { PromptInput } from './components/PromptInput';
import { useChat } from './hooks/useChat';

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
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
  };

  return (
    <div className="chatgpt-layout">
      {/* Collapsible ChatGPT Sidebar */}
      <SessionHistory
        history={sessionHistory}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onNewPrompt={handleNewChat}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Stage */}
      <div className="chatgpt-main-stage">
        <WorkspaceHeader
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
