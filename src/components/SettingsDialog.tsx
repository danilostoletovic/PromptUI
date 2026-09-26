import { useEffect, useRef, useState } from 'react';
import { X, KeyRound, Check, ExternalLink } from 'lucide-react';
import { clearConnection, connect, hasSessionKey } from '../services/connection';
import type { HealthStatus } from '../types/chat';
import license from '../../LICENSE?raw';

export function SettingsDialog({ health, onClose, onConnectionChange, disabled }: {
  health: HealthStatus | null; onClose: () => void; onConnectionChange: () => void; disabled: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const [key, setKey] = useState('');
  const [model, setModel] = useState(health?.hasApiKey ? health.model : 'gpt-4o');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { request.current?.abort(); element?.close(); };
  }, []);
  async function handleConnect(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setSaved(false);
    const controller = new AbortController(); request.current = controller;
    try {
      await connect(key, model, controller.signal);
      if (!controller.signal.aborted) { setKey(''); setSaved(true); onConnectionChange(); }
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Connection failed.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <dialog ref={dialog} className="settings-dialog" aria-labelledby="settings-title" onCancel={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }}>
    <div className="settings-content">
      <header className="settings-heading"><div><h2 id="settings-title">Settings</h2><p>Make PromptUI yours.</p></div><button className="header-icon-btn" aria-label="Close settings" onClick={onClose}><X size={20} /></button></header>
      <section className="settings-section">
        <h3><KeyRound size={17} /> AI connection</h3>
        <p>{hasSessionKey() ? 'Using your session API key.' : health?.hasApiKey ? 'Using the server’s API key. You can override it for this session.' : 'Connect your OpenAI API key to generate custom answers.'}</p>
        <form onSubmit={handleConnect}>
          <label htmlFor="api-key">OpenAI API key</label>
          <input id="api-key" type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="sk-…" autoComplete="off" spellCheck={false} required disabled={busy || disabled} />
          <label htmlFor="api-model">Model</label>
          <input id="api-model" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4o" autoComplete="off" spellCheck={false} required disabled={busy || disabled} />
          <p className="settings-hint">Use a Chat Completions compatible model available to your project. Your key stays in this tab’s memory and is sent through the backend to OpenAI. Reloading clears it.</p>
          {disabled && <p className="settings-hint">Stop the current response before changing the connection.</p>}
          {error && <p className="settings-error" role="alert">{error}</p>}
          {saved && <p className="settings-success" role="status"><Check size={16} /> Connected. Your next prompt will use OpenAI.</p>}
          <div className="settings-actions"><button className="primary-button" type="submit" disabled={busy || disabled || !key.trim() || !model.trim()}>{busy ? 'Checking connection…' : 'Connect & use key'}</button>
          {hasSessionKey() && <button type="button" className="secondary-button" disabled={busy || disabled} onClick={() => { clearConnection(); setSaved(false); setError(''); onConnectionChange(); }}>Remove session key</button>}</div>
        </form>
        <p className="settings-hint">API usage is billed to your OpenAI account. PromptUI does not sell credits or display an account balance.</p>
        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Manage API keys <ExternalLink size={12} /></a>
      </section>
      <section className="settings-section"><h3>Credits</h3><p>Created by <strong>Danilo Stoletovic</strong>.</p><p>Built with React, OpenUI, Vite, Bun, and Lucide. AI responses powered by OpenAI when connected.</p></section>
      <section className="settings-section"><h3>License</h3><p>PromptUI is open source under the MIT License.</p><details><summary>Read the MIT License</summary><pre className="license-text">{license}</pre></details><p className="settings-hint">Third-party libraries retain their own licenses.</p></section>
    </div>
  </dialog>;
}
