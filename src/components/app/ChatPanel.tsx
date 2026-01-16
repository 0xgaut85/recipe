"use client";

import { FC, useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TradingStep } from "@/app/app/page";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  currentStep: TradingStep;
  onProgressUpdate: (step: TradingStep) => void;
}

export const ChatPanel: FC<ChatPanelProps> = ({
  currentStep,
  onProgressUpdate,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastCreatedStrategy, setLastCreatedStrategy] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const startNewStrategy = () => {
    setMessages([]);
    setLastCreatedStrategy(null);
    onProgressUpdate("describe");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.content) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMessage = updated[updated.length - 1];
                    if (lastMessage.role === "assistant") {
                      lastMessage.content += parsed.content;
                    }
                    return updated;
                  });
                }
                
                if (parsed.progress) {
                  onProgressUpdate(parsed.progress as TradingStep);
                  
                  if (parsed.progress === "deploy") {
                    setLastCreatedStrategy("Strategy deployed!");
                  }
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-claude-orange/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-claude-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-semibold text-ink mb-3">
              What would you like to trade?
            </h3>
            <p className="text-ink/50 max-w-md mx-auto">
              Describe your trading strategy in natural language. I&apos;ll help you configure and deploy it on Solana.
            </p>
            <div className="mt-8 text-ink/40 text-sm space-y-2">
              <p className="font-medium text-ink/50">Examples:</p>
              <p>Snipe new pairs with &apos;AI&apos; in the name, 0.1 SOL each</p>
              <p>Buy 0.5 SOL of BONK</p>
              <p>Create a strategy to buy when RSI drops below 30</p>
            </div>
          </motion.div>
        )}

        {/* Message List */}
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-5 py-3 ${
                  message.role === "user"
                    ? "bg-ink text-white"
                    : "bg-ink/5 text-ink border border-ink/10"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
                <div
                  className={`text-xs mt-2 ${
                    message.role === "user" ? "text-white/50" : "text-ink/30"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-ink/5 border border-ink/10 rounded-xl px-5 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 bg-claude-orange rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />

        {/* New Strategy Button */}
        {lastCreatedStrategy && currentStep === "deploy" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center py-4"
          >
            <button
              onClick={startNewStrategy}
              className="flex items-center gap-2 px-6 py-3 bg-claude-orange/10 border border-claude-orange/30 rounded-xl text-claude-orange hover:bg-claude-orange/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Create New Strategy</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-ink/10 p-4 bg-white">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your trading strategy..."
            disabled={isLoading}
            rows={1}
            className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 pr-14 text-ink placeholder-ink/40 resize-none focus:outline-none focus:border-claude-orange/50 transition-colors disabled:opacity-50"
            style={{ minHeight: "56px", maxHeight: "200px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-claude-orange rounded-lg flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-claude-orange-dark transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </form>
        <div className="flex items-center justify-between mt-3 text-xs text-ink/30">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="font-mono">Powered by Claude</span>
        </div>
      </div>
    </div>
  );
};
