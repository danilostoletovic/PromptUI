import React, { useState, useMemo } from 'react';
import { Renderer } from '@openuidev/react-lang';
import { openuiLibrary } from '@openuidev/react-ui';
import type { OpenUIError } from '@openuidev/react-lang';
import {
  Code,
  LayoutTemplate,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Terminal,
  MessageSquareText,
  Layers,
  FileText,
} from 'lucide-react';
import type { ViewMode, FallbackViewMode } from '../types/chat';
import { detectOpenUI } from '../utils/openuiDetector';
import { SiteIcon } from './SiteIcon';

interface OpenUIRendererProps {
  content: string;
  isStreaming: boolean;
  error: string | null;
  prompt: string;
  onSelectPrompt: (prompt: string) => void;
}

const FEATURED_CARDS = [
  {
    title: 'Compare 3 Laptops',
    desc: 'Structured comparison table with specs and pricing',
    prompt: 'Compare three laptops in a table.',
  },
  {
    title: '7-Day Travel Itinerary',
    desc: 'Interactive step-by-step trip plan with daily activities',
    prompt: 'Create a 7-day travel itinerary.',
  },
  {
    title: 'Recursion with Interactive Demo',
    desc: 'Visual explanation with interactive controls and callouts',
    prompt: 'Explain recursion with an interactive example.',
  },
  {
    title: 'Project Dashboard',
    desc: 'KPI metrics, progress bars, and team task table',
    prompt: 'Create a simple project dashboard.',
  },
];

export const OpenUIRenderer: React.FC<OpenUIRendererProps> = ({
  content,
  isStreaming,
  error,
  prompt,
  onSelectPrompt,
}) => {
  const [openUiViewMode, setOpenUiViewMode] = useState<ViewMode>('ui');
  const [fallbackViewMode, setFallbackViewMode] = useState<FallbackViewMode>('text');
  const [copied, setCopied] = useState(false);
  const [parseErrors, setParseErrors] = useState<OpenUIError[]>([]);

  // Validate and classify the incoming response in real time
  const detection = useMemo(() => {
    return detectOpenUI(content, isStreaming);
  }, [content, isStreaming]);

  const handleCopy = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Gracefully filter out transient "no renderable root component" errors during partial streams
  const handleParseErrors = (errors: OpenUIError[] | null) => {
    if (!errors) {
      setParseErrors([]);
      return;
    }
    const filtered = errors.filter(
      (e) => !e.message?.includes('Code parsed but produced no renderable root component')
    );
    setParseErrors(filtered);
  };

  const hasContent = Boolean(content && content.trim());

  return (
    <div className="chatgpt-canvas-container">
      {/* Empty State / Welcome Screen */}
      {!hasContent && !isStreaming && !error && (
        <div className="chatgpt-welcome-view">
          <div className="chatgpt-hero-icon" style={{ background: 'transparent', padding: 0 }}>
            <SiteIcon size={48} />
          </div>
          <h2 className="chatgpt-hero-title">What can OpenUI build for you?</h2>
          <p className="chatgpt-hero-desc">
            Enter a prompt or select an interactive template below to generate dynamic React UI components in real time.
          </p>

          <div className="chatgpt-prompt-cards">
            {FEATURED_CARDS.map((card, idx) => (
              <button
                key={idx}
                className="chatgpt-card"
                onClick={() => onSelectPrompt(card.prompt)}
              >
                <div className="card-header-row">
                  <span className="card-title-text">{card.title}</span>
                </div>
                <p className="card-desc-text">{card.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Conversation Turn */}
      {(hasContent || isStreaming || error) && (
        <div className="chatgpt-turn-flow">
          {/* User Message Bubble */}
          {prompt && (
            <div className="chatgpt-user-row">
              <div className="chatgpt-user-bubble">
                <span>{prompt}</span>
              </div>
            </div>
          )}

          {/* Assistant Response Row */}
          <div className="chatgpt-assistant-row">
            <div className="chatgpt-assistant-avatar">
              <Sparkles size={16} />
            </div>

            <div className="chatgpt-response-column">
              {/* Response Toolbar */}
              <div className="chatgpt-response-toolbar">
                <div className="toolbar-left-info">
                  {isStreaming ? (
                    <div className="status-badge-streaming">
                      <span className="status-pulse-dot" />
                      <span>
                        {detection.isOpenUI ? 'Streaming OpenUI Lang...' : 'Streaming response...'}
                      </span>
                    </div>
                  ) : hasContent ? (
                    detection.isOpenUI ? (
                      <div className="status-badge-ready">
                        <Check size={13} className="text-emerald" />
                        <span>Interactive Interface Ready</span>
                      </div>
                    ) : (
                      <div className="status-badge-text-response">
                        <MessageSquareText size={13} />
                        <span>Natural Language Response</span>
                      </div>
                    )
                  ) : null}
                </div>

                {hasContent && (
                  <div className="toolbar-right-actions">
                    {/* View mode toggle pills for OpenUI responses */}
                    {detection.isOpenUI ? (
                      <div className="mode-toggle-pills">
                        <button
                          type="button"
                          className={`mode-pill ${openUiViewMode === 'ui' ? 'active' : ''}`}
                          onClick={() => setOpenUiViewMode('ui')}
                          title="Render interactive interface"
                        >
                          <LayoutTemplate size={13} />
                          <span>Interactive UI</span>
                        </button>
                        <button
                          type="button"
                          className={`mode-pill ${openUiViewMode === 'code' ? 'active' : ''}`}
                          onClick={() => setOpenUiViewMode('code')}
                          title="View OpenUI Lang DSL code"
                        >
                          <Code size={13} />
                          <span>OpenUI Lang</span>
                        </button>
                      </div>
                    ) : (
                      /* View mode toggle pills for Plain-Text Fallback responses */
                      <div className="mode-toggle-pills">
                        <button
                          type="button"
                          className={`mode-pill ${fallbackViewMode === 'text' ? 'active' : ''}`}
                          onClick={() => setFallbackViewMode('text')}
                          title="Display formatted message"
                        >
                          <MessageSquareText size={13} />
                          <span>Message</span>
                        </button>
                        <button
                          type="button"
                          className={`mode-pill ${fallbackViewMode === 'card' ? 'active' : ''}`}
                          onClick={() => setFallbackViewMode('card')}
                          title="Display as dynamic OpenUI Card component"
                        >
                          <Layers size={13} />
                          <span>OpenUI Card</span>
                        </button>
                        <button
                          type="button"
                          className={`mode-pill ${fallbackViewMode === 'raw' ? 'active' : ''}`}
                          onClick={() => setFallbackViewMode('raw')}
                          title="View raw plain text"
                        >
                          <FileText size={13} />
                          <span>Raw Text</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      className="chatgpt-icon-btn"
                      onClick={() =>
                        handleCopy(
                          detection.isOpenUI ? detection.dslContent : detection.plainText
                        )
                      }
                      title="Copy response"
                      aria-label="Copy response content"
                    >
                      {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="chatgpt-error-box">
                  <AlertCircle size={18} className="text-amber" />
                  <div>
                    <strong>Generation Note</strong>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* Streaming initial loader */}
              {isStreaming && !hasContent && (
                <div className="chatgpt-streaming-loader">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              )}

              {/* ============================================================
                  CASE 1: Valid / Fenced OpenUI Lang Output
                  ============================================================ */}
              {hasContent && detection.isOpenUI && openUiViewMode === 'ui' && (
                <div className="chatgpt-ui-card">
                  {parseErrors.length > 0 && (
                    <div className="parser-notice">
                      <AlertCircle size={13} />
                      <span>Parser notice: {parseErrors[0].message}</span>
                    </div>
                  )}
                  <div className="chatgpt-openui-root">
                    <Renderer
                      library={openuiLibrary}
                      response={detection.dslContent}
                      isStreaming={isStreaming}
                      onError={handleParseErrors}
                    />
                  </div>
                </div>
              )}

              {hasContent && detection.isOpenUI && openUiViewMode === 'code' && (
                <div className="chatgpt-code-card">
                  <div className="code-card-header">
                    <div className="code-lang-label">
                      <Terminal size={13} />
                      <span>openui-lang</span>
                    </div>
                    <span className="code-metrics">
                      {detection.dslContent.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="code-card-pre">
                    <code>{detection.dslContent}</code>
                  </pre>
                </div>
              )}

              {/* ============================================================
                  CASE 2: Graceful Fallback for Non-OpenUI / Plain-Text Output
                  Prevents "Code parsed but produced no renderable root component"
                  ============================================================ */}
              {hasContent && !detection.isOpenUI && fallbackViewMode === 'text' && (
                <div className="chatgpt-text-fallback-card">
                  <div className="fallback-card-header">
                    <div className="fallback-header-badge">
                      <MessageSquareText size={14} />
                      <span>Assistant Message</span>
                    </div>
                    <span className="fallback-badge-sub">
                      Natural language response
                    </span>
                  </div>
                  <div className="fallback-message-body">
                    {detection.plainText.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} className="fallback-paragraph">
                        {paragraph.split('\n').map((line, lIdx) => (
                          <React.Fragment key={lIdx}>
                            {line}
                            {lIdx < paragraph.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {hasContent && !detection.isOpenUI && fallbackViewMode === 'card' && (
                <div className="chatgpt-ui-card">
                  <div className="dynamic-openui-notice">
                    <Sparkles size={13} />
                    <span>Rendered as dynamic OpenUI Callout component</span>
                  </div>
                  <div className="chatgpt-openui-root">
                    <Renderer
                      library={openuiLibrary}
                      response={detection.openUiWrappedFallback}
                      isStreaming={false}
                    />
                  </div>
                </div>
              )}

              {hasContent && !detection.isOpenUI && fallbackViewMode === 'raw' && (
                <div className="chatgpt-code-card">
                  <div className="code-card-header">
                    <div className="code-lang-label">
                      <Terminal size={13} />
                      <span>plain-text</span>
                    </div>
                    <span className="code-metrics">
                      {detection.plainText.length} characters
                    </span>
                  </div>
                  <pre className="code-card-pre">
                    <code>{detection.plainText}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
