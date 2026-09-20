import React from 'react';
import { PanelLeft, Plus, Trash2, ChevronDown } from 'lucide-react';
import type { HealthStatus } from '../types/chat';

interface WorkspaceHeaderProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
  onClearSession: () => void;
  onNewChat: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  hasMessages: boolean;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  health,
  onClearSession,
  onNewChat,
  isSidebarOpen,
  onToggleSidebar,
  hasMessages,
}) => {
  return (
    <header className="chatgpt-header">
      <div className="header-left">
        <button
          onClick={onToggleSidebar}
          className="header-icon-btn"
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </button>

        <button
          onClick={onNewChat}
          className="header-icon-btn"
          title="New chat"
          aria-label="New chat"
        >
          <Plus size={18} />
        </button>

        {/* Model Selector Dropdown Pill */}
        <div className="model-selector-pill" title="Model: OpenUI 4o (OpenAI gpt-4o)">
          <span className="model-name">OpenUI 4o</span>
          <span className="model-badge">OpenAI</span>
          <ChevronDown size={14} className="model-chevron" />
        </div>
      </div>

      <div className="header-right">
        {/* Connection / OpenAI Status */}
        <div
          className="header-status-indicator"
          title={
            health?.hasApiKey
              ? 'OpenAI API Gateway Connected'
              : 'Mock Mode Active - Generates OpenUI interfaces offline'
          }
        >
          <span className={health?.hasApiKey ? 'status-dot-green' : 'status-dot-blue'} />
          <span className="status-text">
            {health?.hasApiKey ? 'OpenAI Active' : 'Mock Mode'}
          </span>
        </div>

        {hasMessages && (
          <button
            onClick={onClearSession}
            className="header-action-btn"
            title="Clear current session"
          >
            <Trash2 size={15} />
            <span>Clear</span>
          </button>
        )}
      </div>
    </header>
  );
};
