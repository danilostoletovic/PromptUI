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
  const [deletedSession, setDeletedSession] = useState<SessionItem | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentResponseRef = useRef<string>('');

  // Fetch health check on mount
  useEffect(() => {
    fetchHealth().then(setHealth);
    return () => abortControllerRef.current?.abort();
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
      if (!promptText.trim() || abortControllerRef.current) return;

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

      const connection = health || await fetchHealth();
      if (controller.signal.aborted) return;
      setHealth(connection);

      await streamChatCompletion({
        messages: updatedMessages,
        provider: connection.provider,
        signal: controller.signal,
        onChunk: (chunk: string) => {
          if (abortControllerRef.current !== controller) return;
          currentResponseRef.current += chunk;
          setCurrentResponse(currentResponseRef.current);
        },
        onError: (err: string) => {
          if (abortControllerRef.current !== controller) return;
          setError(err);
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        onDone: () => {
          if (abortControllerRef.current !== controller) return;
          setIsStreaming(false);
          abortControllerRef.current = null;
          const finalResponse = currentResponseRef.current;

          if (finalResponse) {
            const newSessionItem: SessionItem = {
              id: sessionId,
              prompt: trimmedPrompt,
              response: finalResponse,
              timestamp: Date.now(),
              provider: connection.provider,
              model: connection.model,
              messages: [...updatedMessages, { role: 'assistant', content: finalResponse }],
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
        stopStreaming();
        setMessages(item.messages || [{ role: 'user', content: item.prompt }, { role: 'assistant', content: item.response }]);
        currentResponseRef.current = item.response;
        setActiveSessionId(sessionId);
        setSelectedPrompt(item.prompt);
        setCurrentResponse(item.response);
        setError(null);
      }
    },
    [sessionHistory, stopStreaming]
  );

  const clearSession = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setCurrentResponse('');
    setError(null);
    setSelectedPrompt('');
    setActiveSessionId(null);
  }, [stopStreaming]);

  const deleteSession = useCallback((id: string) => {
    setDeletedSession(sessionHistory.find(item => item.id === id) || null);
    if (id === activeSessionId) clearSession();
    setSessionHistory(previous => previous.filter(item => item.id !== id));
  }, [activeSessionId, clearSession, sessionHistory]);

  const undoDelete = useCallback(() => {
    if (deletedSession) setSessionHistory(previous => [...previous, deletedSession].sort((a, b) => b.timestamp - a.timestamp));
    setDeletedSession(null);
  }, [deletedSession]);

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
    deleteSession,
    deletedSession,
    undoDelete,
  };
}
