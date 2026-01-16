"use client";

import { FC, useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CookingStep } from "@/app/app/page";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  currentStep: CookingStep;
  onStepComplete: (step: CookingStep) => void;
  onJumpToStep?: (step: CookingStep) => void;
}

const stepPrompts: Record<CookingStep, string> = {
  describe: "describe your trading strategy or what you want to achieve...",
  cook: "refining your strategy...",
  taste: "verifying your strategy...",
  serve: "your strategy is live!",
};

const stepNames: Record<CookingStep, string> = {
  describe: "describe",
  cook: "cook",
  taste: "taste",
  serve: "serve",
};

export const ChatPanel: FC<ChatPanelProps> = ({
  currentStep,
  onStepComplete,
  onJumpToStep,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Use a ref to always have the latest step value for API calls
  const effectiveStepRef = useRef<CookingStep>(currentStep);
  
  // Track the previous step to show transition messages
  const prevStepRef = useRef<CookingStep>(currentStep);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update the ref whenever currentStep changes from props
  useEffect(() => {
    effectiveStepRef.current = currentStep;
    inputRef.current?.focus();
    
    // Show phase transition message (but not on initial render)
    if (prevStepRef.current !== currentStep && messages.length > 0) {
      // Get helpful guidance for each phase
      const phaseGuidance: Record<CookingStep, string> = {
        describe: "tell me what strategy you want to create",
        cook: "gathering the details for your strategy",
        taste: "review your strategy config before deploying",
        serve: "your strategy is being deployed",
      };
      
      const transitionMessage: Message = {
        id: `transition-${Date.now()}`,
        role: "system",
        content: `— ${stepNames[currentStep]} — ${phaseGuidance[currentStep]}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, transitionMessage]);
    }
    prevStepRef.current = currentStep;
  }, [currentStep, messages.length]);

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

    // Use the ref to get the current step (most up-to-date value)
    const stepToUse = effectiveStepRef.current;

    try {
      // Filter out system messages for the API call
      const apiMessages = [...messages, userMessage]
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          step: stepToUse,
        }),
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
                // Handle specific step advancement (jump directly to a step)
                if (parsed.advanceToStep) {
                  const newStep = parsed.advanceToStep as CookingStep;
                  // Update the ref immediately so next API call uses new step
                  effectiveStepRef.current = newStep;
                  
                  if (onJumpToStep) {
                    onJumpToStep(newStep);
                  } else {
                    onStepComplete(stepToUse);
                  }
                }
                // Legacy support for generic step complete
                if (parsed.stepComplete) {
                  onStepComplete(stepToUse);
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
          content: "sorry, something went wrong. please try again.",
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
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto terminal-scroll p-6 space-y-4">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="font-mono text-white/30 text-xs mb-4">
              step {currentStep === "describe" ? "01" : currentStep === "cook" ? "02" : currentStep === "taste" ? "03" : "04"}
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-3 lowercase">
              {currentStep === "describe" && "what do you want to cook?"}
              {currentStep === "cook" && "let's refine the recipe"}
              {currentStep === "taste" && "time to taste test"}
              {currentStep === "serve" && "ready to serve?"}
            </h3>
            <p className="text-white/50 max-w-md mx-auto lowercase">
              {currentStep === "describe" &&
                "describe your trading idea in natural language. be specific about tokens, conditions, and goals."}
              {currentStep === "cook" &&
                "i'll help you refine the parameters and logic of your strategy."}
              {currentStep === "taste" &&
                "let's test your strategy against live market data before executing."}
              {currentStep === "serve" &&
                "review the final strategy and confirm to execute on solana."}
            </p>
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
              className={`flex ${
                message.role === "user" 
                  ? "justify-end" 
                  : message.role === "system" 
                  ? "justify-center" 
                  : "justify-start"
              }`}
            >
              {message.role === "system" ? (
                <div className="text-center py-2 px-4">
                  <span className="text-xs text-accent-pink/70 font-mono uppercase tracking-wider">
                    {message.content}
                  </span>
                </div>
              ) : (
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    message.role === "user"
                      ? "bg-accent-pink text-black"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === "user" ? "text-black/40" : "text-white/30"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}
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
            <div className="bg-white/10 rounded-2xl px-5 py-3">
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
                    className="w-2 h-2 bg-white/50 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={stepPrompts[currentStep]}
            disabled={isLoading}
            rows={1}
            className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 pr-14 text-white placeholder-white/30 resize-none focus:outline-none focus:border-accent-pink/50 transition-colors disabled:opacity-50"
            style={{ minHeight: "56px", maxHeight: "200px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent-pink rounded-lg flex items-center justify-center text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent-pink/80 transition-colors"
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
        <div className="flex items-center justify-between mt-3 text-xs text-white/30">
          <span>press enter to send, shift+enter for new line</span>
          <span className="font-mono">powered by claude</span>
        </div>
      </div>
    </div>
  );
};
