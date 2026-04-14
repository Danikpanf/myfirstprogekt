'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { api, getToken } from '@/lib/api';
import { useSession } from '@/store/session';

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; displayName: string };
};

export default function ChatPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const router = useRouter();
  const { user } = useSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001', []);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    api<{ items: Msg[] }>(`/chats/order/${orderId}/messages`).then((r) => setMessages(r.items));
  }, [user, orderId, router]);

  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;
    const socket: Socket = io(apiUrl, {
      transports: ['websocket'],
      auth: { token },
    });
    socket.emit('join', { orderId });
    socket.on('message.created', (msg: Msg) => {
      setMessages((m) => [...m, msg]);
    });
    return () => {
      socket.disconnect();
    };
  }, [apiUrl, orderId, user]);

  const send = async () => {
    if (!text.trim()) return;
    await api(`/chats/order/${orderId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: text.trim() }),
    });
    setText('');
  };

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: '70vh' }}>
      <h1 className="mb-4 text-xl font-bold">Чат по сделке</h1>
      <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.sender.id === user.id
                ? 'ml-8 bg-accent/15'
                : 'mr-8 bg-zinc-100 dark:bg-zinc-900'
            }`}
          >
            <div className="text-xs text-zinc-500">{m.sender.displayName}</div>
            {m.content}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Сообщение…"
        />
        <button
          type="button"
          onClick={send}
          className="rounded-xl bg-accent px-4 py-2 text-white"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
