import React from 'react';
import { PanelLeft, Plus, Trash2, Settings } from 'lucide-react';
import { SiteIcon } from './SiteIcon';
import type { HealthStatus } from '../types/chat';
interface WorkspaceHeaderProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
  onClearSession: () => void;
  onNewChat: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  hasMessages: boolean;
  onSettings: () => void;
}
export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  health,
  onRefreshHealth,
  onClearSession,
  onNewChat,
  isSidebarOpen,
  onToggleSidebar,
  hasMessages,
  onSettings,
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
        <div className="model-selector-pill" title={health?.model || "Checking connection"}>
          <SiteIcon size={20} />
          <span className="model-name">PromptUI</span>
          <span className="model-badge">{health?.hasApiKey ? health.model : "Demo"}</span>
        </div>
      </div>
      <div className="header-right">
        <button className="header-icon-btn" onClick={onSettings} aria-label="Open settings" title="Settings"><Settings size={18} /></button>
        {/* Connection / OpenAI Status */}
        <button
          type="button"
          onClick={onRefreshHealth}
          aria-label="Recheck AI connection"
          className="header-status-indicator"
          title={
            health?.hasApiKey
              ? 'OpenAI API Gateway Connected'
              : 'Offline CSV tables and sample interfaces. Click to recheck the connection.'
          }
        >
          <span className={health?.hasApiKey ? 'status-dot-green' : 'status-dot-blue'} />
          <span className="status-text">
            {health?.hasApiKey ? 'OpenAI Active' : health ? 'Offline demo' : 'Connecting…'}
          </span>
        </button>
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
