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
    <div className="flex flex-col h-full" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div
              className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
              style={{
                backgroundColor: "rgba(255, 77, 0, 0.1)",
                clipPath:
                  "polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)",
              }}
            >
              <svg
                className="w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E57B3A"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3
              className="text-2xl text-white mb-3"
              style={{ fontFamily: "TWKEverett-Regular, sans-serif" }}
            >
              What would you like to trade?
            </h3>
            <p
              className="text-white/60 max-w-md mx-auto"
              style={{ fontFamily: "BaselGrotesk-Regular, sans-serif" }}
            >
              Describe your trading strategy in natural language. I&apos;ll help
              you configure and deploy it on Solana.
            </p>
            <div
              className="mt-8 text-white/40 text-sm space-y-2"
              style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
            >
              <p className="font-medium text-white/50">Examples:</p>
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
                className={`max-w-[80%] px-5 py-3 ${
                  message.role === "user"
                    ? "bg-[#E57B3A] text-white"
                    : "bg-white/5 text-white border border-white/10"
                }`}
                style={{ borderRadius: 0 }}
              >
                <p
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ fontFamily: "BaselGrotesk-Regular, sans-serif" }}
                >
                  {message.content}
                </p>
                <div
                  className={`text-xs mt-2 ${
                    message.role === "user" ? "text-white/70" : "text-white/40"
                  }`}
                  style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
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
            <div
              className="bg-white/5 border border-white/10 px-5 py-3"
              style={{ borderRadius: 0 }}
            >
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
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#E57B3A" }}
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
              className="flex items-center gap-2 px-6 py-3 border transition-colors r1x-button"
              style={{
                backgroundColor: "rgba(229, 123, 58, 0.1)",
                borderColor: "rgba(229, 123, 58, 0.3)",
                color: "#E57B3A",
                fontFamily: "TWKEverettMono-Regular, monospace",
              }}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>CREATE NEW STRATEGY</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div
        className="border-t border-white/10 p-4"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your trading strategy..."
            disabled={isLoading}
            rows={1}
            className="w-full bg-white/5 border border-white/10 px-5 py-4 pr-14 text-white placeholder-white/40 resize-none focus:outline-none focus:border-[#E57B3A] transition-colors disabled:opacity-50"
            style={{
              minHeight: "56px",
              maxHeight: "200px",
              borderRadius: 0,
              fontFamily: "BaselGrotesk-Regular, sans-serif",
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: "#E57B3A",
              clipPath:
                "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
            }}
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
        <div
          className="flex items-center justify-between mt-3 text-xs text-white/40"
          style={{ fontFamily: "TWKEverettMono-Regular, monospace" }}
        >
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Powered by Claude</span>
        </div>
      </div>
    </div>
  );
};
