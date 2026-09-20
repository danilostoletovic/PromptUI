import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage, SessionItem, HealthStatus } from '../types/chat';
import { streamChatCompletion, fetchHealth } from '../services/api';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentResponseRef = useRef<string>('');

  // Fetch health check on mount
  useEffect(() => {
    fetchHealth().then(setHealth);
  }, []);

  const refreshHealth = useCallback(() => {
    fetchHealth().then(setHealth);
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (promptText: string) => {
      if (!promptText.trim() || isStreaming) return;

      const trimmedPrompt = promptText.trim();
      setSelectedPrompt(trimmedPrompt);
      setError(null);
      setCurrentResponse('');
      currentResponseRef.current = '';
      setIsStreaming(true);

      const userMsg: ChatMessage = { role: 'user', content: trimmedPrompt };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const sessionId = `session-${Date.now()}`;
      setActiveSessionId(sessionId);

      await streamChatCompletion({
        messages: updatedMessages,
        provider: 'openai',
        signal: controller.signal,
        onChunk: (chunk: string) => {
          currentResponseRef.current += chunk;
          setCurrentResponse(currentResponseRef.current);
        },
        onError: (err: string) => {
          setError(err);
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        onDone: () => {
          setIsStreaming(false);
          abortControllerRef.current = null;
          const finalResponse = currentResponseRef.current;

          if (finalResponse) {
            const newSessionItem: SessionItem = {
              id: sessionId,
              prompt: trimmedPrompt,
              response: finalResponse,
              timestamp: Date.now(),
              provider: health?.provider || 'openai',
              model: health?.model || 'gpt-4o',
            };

            setSessionHistory((prev) => [newSessionItem, ...prev]);

            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: finalResponse },
            ]);
          }
        },
      });
    },
    [messages, isStreaming, health]
  );

  const selectSession = useCallback(
    (sessionId: string) => {
      const item = sessionHistory.find((s) => s.id === sessionId);
      if (item) {
        setActiveSessionId(sessionId);
        setSelectedPrompt(item.prompt);
        setCurrentResponse(item.response);
        setError(null);
      }
    },
    [sessionHistory]
  );

  const clearSession = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setCurrentResponse('');
    setError(null);
    setSelectedPrompt('');
    setActiveSessionId(null);
  }, [stopStreaming]);

  return {
    messages,
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
  };
}
