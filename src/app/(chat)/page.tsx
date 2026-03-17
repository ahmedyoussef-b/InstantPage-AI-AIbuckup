'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api/client';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);

    try {
      const data = await api.chat(trimmed);
      setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Désolé, une erreur est survenue.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-chat-ai'
            }`}>
              {msg.role === 'ai' ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="bg-chat-ai p-4 rounded-lg">...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-chat-border bg-chat-input p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Message your assistant..."
            className="flex-1 bg-chat-bg p-3 rounded-lg border border-chat-border"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}