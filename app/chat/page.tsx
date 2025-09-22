'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');

    // Aquí integrarás con tu Supabase/IA después
    setTimeout(() => {
      const botMessage: Message = {
        id: Date.now().toString(),
        text: `Respuesta a: ${input}`,
        sender: 'bot',
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    }, 1000);
  };

  return (
    <Card className="flex flex-col h-screen p-4">
      <div className="py-4">
        <h1 className="text-2xl font-bold">AI Chat</h1>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.sender === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex gap-2 mt-4">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button onClick={handleSendMessage}>
          Send
        </Button>
      </div>
    </Card>
  );
}