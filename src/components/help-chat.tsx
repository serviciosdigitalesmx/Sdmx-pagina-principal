'use client';

import { useMemo, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

type QuickOption = {
  id: string;
  label: string;
  message: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    content:
      'Elige una opción para seguir. Si no te resuelve, te paso con un agente.'
  }
];

const quickOptions: QuickOption[] = [
  { id: 'trial', label: 'Quiero una prueba', message: 'Quiero activar la prueba gratis de 14 días.' },
  { id: 'pricing', label: 'Ver precios', message: 'Quiero ver precios y planes.' },
  { id: 'account', label: 'Crear cuenta', message: 'Necesito crear mi cuenta.' },
  { id: 'login', label: 'No puedo entrar', message: 'No puedo iniciar sesión.' },
  { id: 'billing', label: 'Cobros', message: 'Tengo una duda sobre cobros o factura.' },
  { id: 'agent', label: 'Hablar con agente', message: 'Necesito que me contacte un agente humano.' }
];

export function HelpChat() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL?.trim() ?? '', []);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [handoff, setHandoff] = useState(false);

  const pushAssistantMessage = (content: string) => {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content
      }
    ]);
  };

  const sendMessage = async (contentOverride?: string) => {
    const content = (contentOverride ?? input).trim();
    if (!content || status === 'sending') return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setStatus('sending');

    if (/agente/i.test(content)) {
      setHandoff(true);
      setStatus('idle');
      pushAssistantMessage('Te paso con un agente. Un momento.');
      return;
    }

    if (!apiUrl) {
      pushAssistantMessage('No puedo conectar el backend ahora. Si quieres, te paso con un agente.');
      setStatus('error');
      return;
    }

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: content })
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { reply?: string };

      const reply = data.reply?.trim() || 'No lo resolví por aquí. Te paso con un agente.';
      pushAssistantMessage(reply);
      if (/agente|humano|soporte|transfer/i.test(reply)) {
        setHandoff(true);
      }
      setStatus('idle');
    } catch {
      pushAssistantMessage('No pude resolverlo automático. Te paso con un agente.');
      setHandoff(true);
      setStatus('error');
    }
  };

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="mb-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Ayuda</p>
        <h2 className="text-2xl font-semibold text-white">Chatbot de soporte</h2>
        <p className="text-sm leading-6 text-zinc-300">
          Selecciona una opción rápida. Si no se resuelve, te canalizamos con un agente.
        </p>
      </div>

      <div className="flex h-[420px] flex-col rounded-[1.5rem] border border-white/10 bg-zinc-950/80">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === 'user'
                  ? 'ml-auto bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-100'
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => sendMessage(option.message)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/10"
                disabled={status === 'sending' || handoff}
              >
                {option.label}
              </button>
            ))}
          </div>

          {!handoff ? (
            <>
              <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-zinc-400">
                Escribe solo si hace falta
              </label>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-400"
                placeholder="Si no encuentras tu caso, escríbelo aquí."
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  {status === 'sending'
                    ? 'Enviando...'
                    : status === 'error'
                      ? 'Sin conexión al backend'
                      : 'Opciones primero, texto después'}
                </p>
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={status === 'sending'}
                >
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-sm font-semibold text-emerald-200">Transferencia en curso</p>
              <p className="mt-1 text-sm text-zinc-200">
                Un agente humano continuará la conversación por correo o canal interno.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
