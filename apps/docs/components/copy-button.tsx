'use client';
import { useState } from 'react';
export function CopyButton({ text, label = 'Copy code' }: { text: string; label?: string }) {
  const [status, setStatus] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus('Copied'); }
    catch { setStatus('Could not copy. Select the code to copy it manually.'); }
  }
  return <span className="copy-control"><button type="button" className="hig-button" data-intent="secondary" onClick={copy}>{label}</button><span role="status" className="copy-status">{status}</span></span>;
}
