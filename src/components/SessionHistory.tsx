import React from 'react';
import { Plus, MessageSquare, PanelLeft } from 'lucide-react';
import { SiteIcon } from './SiteIcon';
import type { SessionItem } from '../types/chat';

interface SessionHistoryProps {
  history: SessionItem[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewPrompt: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  history,
  activeSessionId,
  onSelectSession,
  onNewPrompt,
  isOpen,
  onToggle,
}) => {
  return (
    <aside className={`chatgpt-sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Sidebar Top Toolbar */}
      <div className="sidebar-top">
        <button
          onClick={onNewPrompt}
          className="sidebar-new-chat-btn"
          title="New Chat"
        >
          <Plus size={16} />
          <span>New chat</span>
        </button>

        <button
          onClick={onToggle}
          className="sidebar-toggle-btn"
          title="Close sidebar"
          aria-label="Close sidebar"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {/* History List */}
      <div className="sidebar-scroll-area">
        <div className="sidebar-section-title">Recent Chats</div>

        {history.length === 0 ? (
          <div className="sidebar-empty-state">
            <p>No conversations yet.</p>
            <span>Prompts you run will appear here.</span>
          </div>
        ) : (
          <div className="sidebar-items-list">
            {history.map((item) => {
              const isActive = item.id === activeSessionId;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSession(item.id)}
                  className={`sidebar-chat-item ${isActive ? 'active' : ''}`}
                  title={item.prompt}
                >
                  <MessageSquare size={15} className="chat-item-icon" />
                  <span className="chat-item-title">{item.prompt}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-pill">
          <div className="profile-avatar" style={{ background: 'transparent', padding: 0 }}>
            <SiteIcon size={24} />
          </div>
          <div className="profile-info">
            <span className="profile-name">OpenUI Workspace</span>
            <span className="profile-role">Interactive UI Engine</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
