import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Loader2, MessageSquare, Phone, Video, Search, MoreVertical, Paperclip, Smile, Mic } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { io, Socket } from "socket.io-client";
import { askHussainChishti, Message } from "./lib/gemini.ts";
import { cn } from "./lib/utils.ts";

type ChatUser = "Hassan" | "Arshed";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<ChatUser>("Hassan");
  const [input, setInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("init_messages", (initialMessages: Message[]) => {
      setMessages(initialMessages);
    });

    socket.on("new_message", (message: Message) => {
      setMessages(prev => {
        // Prevent duplicates (especially if we implement optimistic updates later with real IDs)
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage: Partial<Message> = {
      role: "user",
      content: input,
      senderName: currentUser,
      timestamp: Date.now(),
    };

    setInput("");
    
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMessage),
      });
      
      const savedMessage = await response.json();

      // If message mentions Hussain
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("hussain") || lowerInput.includes("chishti")) {
        triggerAiResponse([...messages, savedMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const triggerAiResponse = async (history: Message[]) => {
    setIsAiLoading(true);
    try {
      const aiContent = await askHussainChishti(history);
      
      const aiMessage: Partial<Message> = {
        role: "assistant",
        content: aiContent,
        senderName: "Hussain Chishti",
        timestamp: Date.now(),
      };

      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiMessage),
      });
    } catch (error) {
      console.error("Failed to send AI message:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-page text-zinc-100 selection:bg-brand/30 font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-80 bg-surface-dim border-r border-border overflow-hidden">
        <div className="h-16 flex items-center justify-between px-6 bg-surface border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center font-serif text-lg italic text-white ring-2 ring-blue-500/20">
              H
            </div>
            <h2 className="font-serif italic text-blue-500 tracking-tight">Hassan Arshed</h2>
          </div>
          <div className="flex gap-4 text-zinc-500">
            <MessageSquare size={18} className="hover:text-blue-500 cursor-pointer transition-colors" />
            <MoreVertical size={18} className="hover:text-blue-500 cursor-pointer transition-colors" />
          </div>
        </div>
        
        <div className="p-4 border-b border-border bg-page/50">
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full bg-zinc-900 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-blue-500 placeholder-zinc-600 transition-all text-zinc-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 text-[10px] uppercase font-bold text-blue-500 tracking-[0.2em] opacity-80">
            Active User
          </div>
          <button 
            onClick={() => setCurrentUser("Hassan")}
            className={cn(
              "w-full flex items-center gap-4 p-4 transition-all duration-300",
              currentUser === "Hassan" 
                ? "bg-blue-900/10 border-l-4 border-blue-500" 
                : "border-l-4 border-transparent hover:bg-zinc-900/50"
            )}
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-serif italic text-lg shadow-inner">H</div>
            <div className="flex-1 text-left">
              <div className={cn("font-medium transition-colors", currentUser === "Hassan" ? "text-blue-100" : "text-zinc-300")}>Hassan</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Primary Profile</div>
            </div>
            {currentUser === "Hassan" && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
          </button>
          
          <button 
            onClick={() => setCurrentUser("Arshed")}
            className={cn(
              "w-full flex items-center gap-4 p-4 transition-all duration-300",
              currentUser === "Arshed" 
                ? "bg-red-900/10 border-l-4 border-red-500" 
                : "border-l-4 border-transparent hover:bg-zinc-900/50"
            )}
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-serif italic text-lg shadow-inner">A</div>
            <div className="flex-1 text-left">
              <div className={cn("font-medium transition-colors", currentUser === "Arshed" ? "text-red-100" : "text-zinc-300")}>Arshed</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Secondary Profile</div>
            </div>
            {currentUser === "Arshed" && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
          </button>

          <div className="mt-12 flex flex-col items-center p-6 text-center group">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/10 blur-xl rounded-full scale-150 animate-pulse duration-3000" />
              <Bot size={40} className="text-accent mb-4 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-red-50 font-serif italic text-sm tracking-wide">Hussain Chishti AI</h3>
            <p className="text-[11px] text-zinc-600 mt-2 px-4 leading-relaxed font-medium">
              "apki khidmat me hazir ho hukam kre k kia kam h"
            </p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <header className="h-[72px] bg-surface flex items-center justify-between px-8 border-b border-border shadow-2xl z-10 relative">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-serif text-xl italic text-white shadow-lg",
              currentUser === "Hassan" ? "bg-blue-600 shadow-blue-900/20" : "bg-red-600 shadow-red-900/20"
            )}>
               {currentUser[0]}
            </div>
            <div>
              <h1 className="text-blue-50 font-serif italic text-lg tracking-tight">Hassan Arshed Chats</h1>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                 <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Hussain Chishti AI Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 text-zinc-500 font-medium">
            <Video size={18} className="hidden sm:block cursor-pointer hover:text-blue-400 transition-colors" />
            <Phone size={18} className="hidden sm:block cursor-pointer hover:text-blue-400 transition-colors" />
            <Search size={18} className="cursor-pointer hover:text-blue-400 transition-colors" />
            <MoreVertical size={18} className="cursor-pointer hover:text-blue-400 transition-colors" />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative">
          <div className="relative z-10 p-6 md:p-12 lg:px-24 max-w-5xl mx-auto flex flex-col gap-6">
            <div className="self-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.25em] bg-zinc-900/80 px-4 py-1.5 rounded-full border border-border shadow-sm">
                Session Started
              </span>
            </div>

            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isMe = msg.senderName === currentUser;
                const isAi = msg.role === "assistant";
                
                if (isAi) {
                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="self-center w-full max-w-4xl py-6 my-2"
                    >
                      <div className="bg-red-950/20 border border-red-900/50 px-8 py-6 rounded-3xl flex items-center gap-6 shadow-[0_10px_40px_-15px_rgba(153,27,27,0.3)] backdrop-blur-sm">
                        <div className="w-14 h-14 min-w-[3.5rem] rounded-full bg-red-600 flex items-center justify-center font-serif italic text-2xl text-white shadow-xl">H</div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-2">Hussain Chishti AI</p>
                          <div className={cn(
                            "text-base leading-relaxed font-serif text-red-50 markdown-body",
                            msg.content.includes("bhaii mujhe bhook lg rhi h") ? "text-orange-300" : "italic"
                          )}>
                             <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex flex-col group max-w-[80%] sm:max-w-[65%]",
                      isMe ? "self-end items-end" : "self-start items-start"
                    )}
                  >
                    {!isMe && (
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">{msg.senderName}</span>
                    )}
                    
                    <div className={cn(
                      "px-5 py-3.5 rounded-[2rem] text-[15px] shadow-xl relative transition-transform duration-300 hover:scale-[1.01]",
                      isMe 
                        ? (msg.senderName === "Hassan" ? "bg-blue-600 shadow-blue-900/20" : "bg-red-600 shadow-red-900/20") + " text-white rounded-tr-none" 
                        : "bg-zinc-800 text-zinc-100 rounded-tl-none shadow-black/40"
                    )}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      
                      <div className={cn(
                        "flex items-center gap-1.5 mt-2 transition-opacity group-hover:opacity-100",
                        isMe ? "justify-end text-white/70" : "justify-start text-zinc-500"
                      )}>
                        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <div className="flex leading-none scale-75 opacity-70">
                            <svg viewBox="0 0 16 11" height="11" width="16" preserveAspectRatio="xMidYMid meet" version="1.1"><path fill="currentColor" d="M15.01,3.316l-0.478-0.372c-0.21-0.163-0.519-0.129-0.689,0.077L7.13,10.155l-3.32-3.882 c-0.178-0.209-0.493-0.241-0.708-0.075L2.61,6.591C2.396,6.758,2.361,7.067,2.531,7.266l4.24,4.952 c0.09,0.105,0.222,0.168,0.362,0.168c0.14,0.001,0.269-0.061,0.362-0.164L15.087,4.01C15.257,3.812,15.221,3.483,15.01,3.316z M12.8,3.323l-0.47-0.372c-0.21-0.165-0.521-0.128-0.691,0.081L5.803,11.39l-0.012-0.015L3.92,13.79 c-0.174,0.203-0.49,0.231-0.706,0.063l-0.485-0.376c-0.216-0.168-0.25-0.472-0.076-0.675l4.225-4.933c0.09-0.106,0.222-0.168,0.363-0.17 c0.14-0.003,0.272,0.059,0.366,0.163l6.505,7.636c0.17,0.2,0.134,0.51-0.076,0.677l-0.48,0.372c-0.21,0.162-0.519,0.129-0.689-0.077 l-5.26-6.17L7.13,10.155L12.8,3.323z"></path></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {isAiLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="self-center bg-zinc-900 border border-accent/20 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl backdrop-blur-md"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 blur-md rounded-full animate-pulse" />
                  <Loader2 className="w-4 h-4 text-accent animate-spin relative z-10" />
                </div>
                <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold italic font-serif text-red-50 mr-4">Hussain Chishti AI is reflecting...</span>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </section>

        <footer className="bg-page p-6 border-t border-border relative z-10 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.8)]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-[2rem] border border-border focus-within:border-brand/50 focus-within:shadow-[0_0_20px_-5px_rgba(59,130,246,0.1)] transition-all">
              <button className="p-3 text-zinc-500 hover:text-blue-500 transition-colors">
                <Smile size={24} />
              </button>
              
              <form onSubmit={handleSend} className="flex-1 flex items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask Hussain Chishti or message the group..."
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] py-2 text-zinc-100 placeholder:text-zinc-600 resize-none overflow-hidden max-h-32 scroll-none"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </form>

              <button 
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className={cn(
                  "px-8 py-2.5 rounded-2xl flex items-center justify-center font-medium transition-all shadow-lg active:scale-95 disabled:opacity-50",
                  input.trim() 
                    ? "bg-brand text-white hover:bg-brand-dark shadow-blue-900/40" 
                    : "bg-zinc-800 text-zinc-500"
                )}
              >
                Send
              </button>
            </div>
            
            <div className="flex justify-center mt-4 gap-12 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-600">
               <button className="hover:text-blue-500 transition-colors cursor-pointer">Emoji</button>
               <button className="hover:text-blue-500 transition-colors cursor-pointer">Documents</button>
               <button 
                onClick={() => {
                   const lowerInput = input.toLowerCase();
                   if (!lowerInput.includes("hussain")) {
                     setInput(prev => "Hussain Bhai, " + prev);
                   }
                }}
                className="text-accent hover:text-accent-dark transition-colors cursor-pointer"
               >
                 Summon AI (Hussain)
               </button>
            </div>
          </div>
        </footer>

        {/* Mobile floating user switcher */}
        <div className="md:hidden absolute bottom-32 right-6 flex flex-col gap-3 z-20">
          <button 
            onClick={() => setCurrentUser(currentUser === "Hassan" ? "Arshed" : "Hassan")}
            className={cn(
              "w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center text-white font-serif italic border-2 border-page active:scale-90 transition-all group",
              currentUser === "Hassan" ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-500"
            )}
          >
            <span className="text-xl font-bold">{currentUser[0]}</span>
            <span className="text-[8px] uppercase tracking-tighter opacity-60">Switch</span>
          </button>
        </div>
      </main>
    </div>
  );
}
