/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Send, Bot, User, Trash2, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Initialize chat session on first use
  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = genAI.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a helpful, creative, and intelligent AI assistant. Provide clear, concise, and accurate responses. Use markdown for formatting when appropriate.",
        },
      });
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        chatRef.current = genAI.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: "You are a helpful, creative, and intelligent AI assistant. Provide clear, concise, and accurate responses. Use markdown for formatting when appropriate.",
          },
        });
      }

      const response: GenerateContentResponse = await chatRef.current.sendMessage({
        message: userMessage.text,
      });

      const modelMessage: Message = {
        role: 'model',
        text: response.text || 'Sorry, I couldn\'t generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'model',
        text: 'An error occurred while communicating with the AI. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    chatRef.current = null; // Reset chat session
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Gemini Assistant</h1>
            <p className="text-xs text-slate-500 font-medium">Powered by Google AI</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
          title="Clear Chat"
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
            <div className="p-6 bg-white rounded-full shadow-inner border border-slate-100">
              <Bot size={48} className="text-indigo-400" />
            </div>
            <div className="max-w-xs">
              <h2 className="text-lg font-semibold text-slate-700">How can I help you today?</h2>
              <p className="text-sm text-slate-500">Ask me anything, from coding questions to creative writing.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-slate-200'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    <div className="prose prose-sm max-w-none prose-slate">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                    <div className={`text-[10px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 max-w-[75%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-indigo-600 border border-slate-200 flex items-center justify-center shadow-sm">
                <Bot size={16} />
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-sm text-slate-500 font-medium italic">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message here..."
            className="w-full p-4 pr-14 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200 min-h-[56px] max-h-32"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 ${
              !input.trim() || isLoading 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3">
          Gemini may display inaccurate info, including about people, so double-check its responses.
        </p>
      </footer>
    </div>
  );
}
