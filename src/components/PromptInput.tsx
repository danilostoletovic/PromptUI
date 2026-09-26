import { PROMPT_EXAMPLES } from '../services/promptExamples';
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Sparkles } from 'lucide-react';

interface PromptInputProps {
  onSendMessage: (prompt: string) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  disabled = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isStreaming || disabled) return;
    onSendMessage(prompt);
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSuggestion = (text: string) => {
    if (isStreaming || disabled) return;
    onSendMessage(text);
  };

  const hasText = Boolean(prompt.trim());

  return (
    <div className="chatgpt-input-wrapper">
      {/* Quick Suggestion Pills */}
      <div className="chatgpt-suggestions-bar">
        {PROMPT_EXAMPLES.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="chatgpt-pill"
            disabled={isStreaming || disabled}
            onClick={() => handleSelectSuggestion(s.prompt)}
          >
            <Sparkles size={11} className="pill-sparkle" />
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="chatgpt-input-form">
        <div className="chatgpt-input-box">
          <textarea
            ref={textareaRef}
            rows={1}
            aria-label="Your prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything, paste data, or describe what you want to change…"
            disabled={disabled || isStreaming}
            className="chatgpt-textarea"
          />

          <div className="chatgpt-input-actions">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="chatgpt-send-btn stop-active"
                title="Stop streaming"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasText || disabled}
                className={`chatgpt-send-btn ${hasText ? 'ready' : 'disabled'}`}
                title="Send prompt"
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="chatgpt-disclaimer">
        Include your context and constraints. Follow up to refine the result.
      </div>
    </div>
  );
};
