import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ChatBoxProps {
  messages: { playerId: string; playerName: string; text: string }[];
  onSendMessage: (message: string) => void;
  currentPlayerId: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, currentPlayerId }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow mb-4 p-4 border rounded-md">
        {messages.map((message, index) => (
          <div key={index} className={`mb-2 ${message.playerId === currentPlayerId ? 'text-blue-600 dark:text-blue-300' : 'text-purple-600 dark:text-purple-300'}`}>
            <span className="font-bold">{message.playerName}: </span>
            <span>{message.text}</span>
          </div>
        ))}
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow mr-2"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

