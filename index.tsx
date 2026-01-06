import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { 
  ArrowRight, Search, Zap, Activity, Calendar as CalIcon, 
  MessageSquare, Clock, ShieldAlert, ChevronRight, Send,
  Terminal, Database, Cpu, Command, Hash, BarChart3,
  Wifi, Battery, Layers, AlertCircle
} from "lucide-react";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- Types ---

interface Chunk {
  id: string;
  source: "claude" | "chatgpt" | "grok";
  title: string;
  content: string;
  timestamp: string;
  semanticScore: number;
  lexicalScore: number;
  tags: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// --- Mock Data ---

const MOCK_MEMORY: Chunk[] = [
  {
    id: "chk_1",
    source: "claude",
    title: "Project Alpha Architecture",
    content: "For the scalable backend of Project Alpha, we should stick to a microservices architecture using Go for high-throughput services and Python for the data science pipeline. The API gateway will handle authentication.",
    timestamp: "2024-10-15T10:30:00Z",
    semanticScore: 0.92,
    lexicalScore: 0.88,
    tags: ["architecture", "backend", "go", "python"]
  },
  {
    id: "chk_3",
    source: "claude",
    title: "Q4 Marketing Plan",
    content: "The Q4 marketing push will focus on 'Executive Intelligence'. We need to highlight the hybrid search capabilities and the secure on-premise deployment options. Budget allocation: 40% ads, 30% content, 30% events.",
    timestamp: "2024-12-01T09:00:00Z",
    semanticScore: 0.78,
    lexicalScore: 0.95,
    tags: ["marketing", "Q4", "budget"]
  },
  {
    id: "chk_6",
    source: "claude",
    title: "Team Sync Notes",
    content: "Action items: Sarah to finalize the Figma designs for the dashboard. Mike to optimize the Qdrant indexer params. Released v2.1 to staging.",
    timestamp: "2025-01-12T09:30:00Z",
    semanticScore: 0.65,
    lexicalScore: 0.90,
    tags: ["meeting", "notes", "team"]
  }
];

// --- Utilities ---

const Sparkline = ({ data, color = "#FFFFFF", height = 40 }: { data: number[], color?: string, height?: number }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      {/* Fill Area */}
      <polygon
        points={`${points} ${width},${height} 0,${height}`}
        fill={color}
        fillOpacity="0.1"
      />
    </svg>
  );
};

// --- Components ---

const Sidebar = ({ activeView, setView }: { activeView: string, setView: (v: string) => void }) => {
  const menuItems = [
    { id: 'overview', label: 'OVERVIEW', icon: Activity },
    { id: 'schedule', label: 'SCHEDULE', icon: CalIcon },
    { id: 'comms', label: 'COMMS', icon: MessageSquare },
    { id: 'tasks', label: 'TASKS', icon: Hash },
    { id: 'command', label: 'COMMAND', icon: Terminal, highlight: true },
    { id: 'system', label: 'SYSTEM', icon: Cpu },
  ];

  const [ping, setPing] = useState(24);

  useEffect(() => {
    const i = setInterval(() => setPing(Math.floor(Math.random() * 15) + 20), 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="w-64 h-full border-r border-white/10 flex flex-col justify-between p-6 bg-black z-20 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-20"></div>
      
      <div>
        <div className="flex items-center gap-3 mb-12">
           <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black tracking-tighter text-xs">
             EA
           </div>
           <h1 className="text-sm font-black tracking-widest text-white uppercase">SYSTEM</h1>
        </div>

        <div className="flex flex-col gap-1">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                text-left text-[10px] font-mono tracking-[0.2em] flex items-center group transition-all duration-300 h-10 px-2 border-l-2
                ${activeView === item.id 
                  ? 'text-white border-accent bg-white/5' 
                  : 'text-secondary border-transparent hover:text-white hover:bg-white/5 hover:border-white/20'}
              `}
            >
              <item.icon className={`w-3 h-3 mr-3 transition-colors ${activeView === item.id ? 'text-accent' : 'text-gray-600 group-hover:text-white'}`} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Network Status */}
        <div className="border border-white/10 p-3 bg-white/5">
           <div className="flex justify-between items-center mb-2">
             <span className="text-[9px] font-mono text-secondary uppercase">Network</span>
             <Wifi className="w-3 h-3 text-green-500" />
           </div>
           <div className="flex items-end gap-1 h-8">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-full bg-white/20 transition-all duration-500"
                  style={{ height: `${Math.random() * 100}%` }}
                ></div>
              ))}
           </div>
           <div className="flex justify-between mt-2 text-[9px] font-mono text-gray-500">
             <span>SECURE</span>
             <span>{ping}ms</span>
           </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(255,51,51,0.8)]"></div>
            <span className="text-[9px] font-bold text-accent tracking-widest">ONLINE</span>
          </div>
          <div className="text-secondary text-[10px] font-medium tracking-wide">Sven Arnarsson</div>
          <div className="text-gray-600 text-[9px] font-mono mt-1">ID: 99-AA-X1</div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit, trend }: { label: string, value: string, unit?: string, trend: number[] }) => (
  <div className="border border-white/10 p-5 bg-surface/50 h-32 flex flex-col justify-between group hover:border-white/30 transition-all hover:bg-white/5 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
       <ArrowRight className="w-3 h-3 text-white -rotate-45" />
    </div>
    <div className="text-[9px] font-mono text-secondary tracking-[0.15em] uppercase flex items-center gap-2">
      <div className="w-1 h-1 bg-secondary rounded-full"></div>
      {label}
    </div>
    <div className="flex items-end justify-between">
      <div>
        <span className="text-3xl font-light tracking-tight text-white tabular-nums">{value}</span>
        {unit && <span className="text-sm text-secondary ml-1 font-mono">{unit}</span>}
      </div>
      <div className="w-20 opacity-50 group-hover:opacity-100 transition-opacity">
        <Sparkline data={trend} height={30} color={trend[trend.length-1] > trend[0] ? "#4ade80" : "#ffffff"} />
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, right }: { title: string, right?: React.ReactNode }) => (
  <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-2">
    <h3 className="text-[10px] font-mono text-secondary tracking-[0.2em] uppercase flex items-center gap-2">
      <span className="w-3 h-[1px] bg-accent"></span>
      {title}
    </h3>
    {right}
  </div>
);

const SegmentedProgress = ({ value }: { value: number }) => (
  <div className="flex gap-0.5 h-1.5 w-full bg-white/5">
    {[...Array(20)].map((_, i) => (
      <div 
        key={i} 
        className={`flex-1 transition-colors duration-300 ${i < (value / 5) ? 'bg-white' : 'bg-transparent'}`}
      />
    ))}
  </div>
);

// --- Views ---

const OverviewView = ({ setView }: { setView: (v: string) => void }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 p-12 overflow-y-auto bg-black h-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-start mb-16">
        <div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-accent mb-2 tracking-widest">
            <span>06 JAN 2026</span>
            <span className="text-secondary">/</span>
            <span>TUESDAY</span>
          </div>
          <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-2">
            Sven <span className="text-gray-600">Arnarsson</span>
          </h2>
          <div className="flex gap-4 text-[10px] font-mono text-gray-500 tracking-wider">
            <span>LEVEL 5 CLEARANCE</span>
            <span>•</span>
            <span>LONDON_HQ</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-extralight text-white mb-1 tabular-nums tracking-tight">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span className="text-lg text-secondary ml-2">{time.getSeconds().toString().padStart(2, '0')}</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-green-500 tracking-widest uppercase">
            System Optimal
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-16">
        <StatCard label="Meetings" value="07" trend={[2,4,3,6,7,5,7]} />
        <StatCard label="Inbound" value="45" trend={[30,35,42,38,45,40,45]} />
        <StatCard label="Actions" value="03" trend={[8,5,6,4,2,3,3]} />
        <StatCard label="Velocity" value="92" unit="%" trend={[60,70,75,82,88,90,92]} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-20 mb-16">
        
        {/* Left Col */}
        <div className="space-y-16">
          {/* Agenda */}
          <div>
            <SectionHeader title="Agenda" right={<span className="text-[9px] font-mono text-secondary">T-MINUS 2HRS</span>} />
            <div className="space-y-1">
              {[
                { time: "10:00 — 12:00", title: "Board Strategy Review", tag: "PRIORITY", sub: "J. SMITH +2", active: true },
                { time: "14:00 — 15:00", title: "Product Launch", tag: "ROUTINE", sub: "MARKETING" },
                { time: "16:30 — 17:15", title: "Investor Call: Series B", tag: "PRIORITY", sub: "A. HOROWITZ" }
              ].map((item, i) => (
                <div key={i} className={`group flex justify-between items-center p-4 border border-transparent hover:border-white/20 hover:bg-white/5 transition-all ${item.active ? 'bg-white/5 border-l-2 border-l-accent' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-white animate-pulse' : 'bg-gray-800'}`}></div>
                    <div>
                      <div className="text-sm font-bold text-white mb-0.5">{item.title}</div>
                      <div className="text-[10px] text-gray-500 font-mono tracking-wide">{item.time} <span className="mx-1 text-gray-800">|</span> {item.sub}</div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 uppercase tracking-wide border ${item.tag === 'PRIORITY' ? 'border-accent text-accent bg-accent/10' : 'border-gray-700 text-gray-500'}`}>
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Communications */}
          <div>
            <SectionHeader title="Communications" />
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-4 border border-white/10 hover:border-white/30 transition-colors cursor-pointer">
                  <div className="text-[10px] text-secondary font-mono mb-2 uppercase">Unread</div>
                  <div className="text-2xl font-light text-white">23</div>
               </div>
               <div className="bg-white/5 p-4 border border-white/10 hover:border-white/30 transition-colors cursor-pointer">
                  <div className="text-[10px] text-accent font-mono mb-2 uppercase">Urgent</div>
                  <div className="text-2xl font-light text-accent">2</div>
               </div>
            </div>
            <div className="mt-4 flex items-center gap-3 p-3 bg-red-900/10 border border-red-500/20 text-red-200">
               <AlertCircle className="w-4 h-4" />
               <span className="text-xs">Legal requires signature on Series B Term Sheet.</span>
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-16">
           {/* Pending Logic */}
           <div>
            <SectionHeader title="Pending Decisions" />
            <div className="space-y-4">
              {[
                { title: "Q1 Marketing Budget", sub: "$2.5M Allocation", from: "CMO" },
                { title: "Microsoft Partnership", sub: "Data Sharing Agreement", from: "Legal" },
                { title: "Senior Engineer Hire", sub: "Offer Letter Approval", from: "HR" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-4 border-b border-white/5 group cursor-pointer hover:pl-4 transition-all duration-300">
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-[10px] font-bold bg-white/5 group-hover:bg-white group-hover:text-black transition-colors">
                        {item.from}
                     </div>
                     <div>
                       <div className="text-sm font-bold text-white mb-0.5">{item.title}</div>
                       <div className="text-[10px] text-secondary font-mono">{item.sub}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                    <span className="text-accent text-[9px] font-bold uppercase tracking-widest">Review</span>
                    <ChevronRight className="w-4 h-4 text-accent" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Tracks */}
          <div>
            <SectionHeader title="Active Tracks" />
            <div className="space-y-8">
              {[
                { label: "Q4 Roadmap", val: 75, status: "ON TRACK" },
                { label: "Series B Fundraising", val: 90, status: "FINALIZING" },
                { label: "Tokyo Expansion", val: 45, status: "DELAYED" },
              ].map((track, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-bold text-white mb-3 uppercase tracking-wider">
                    <span>{track.label}</span>
                    <span className={track.status === "DELAYED" ? "text-red-500" : "text-green-500"}>{track.status} ({track.val}%)</span>
                  </div>
                  <SegmentedProgress value={track.val} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Memory Intelligence */}
      <div className="mt-auto border-t border-white/10 pt-8 bg-gradient-to-t from-black to-transparent">
        <SectionHeader title="Memory Core" right={<div className="flex gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div></div>} />
        
        <div className="grid grid-cols-4 gap-8 mb-8">
          {[
            { label: "Conversations", val: "21,622" },
            { label: "Threads", val: "2,967" },
            { label: "Embedded", val: "20,921" },
            { label: "Memories", val: "2" },
          ].map((stat, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="text-[9px] font-mono text-secondary mb-2 uppercase tracking-widest group-hover:text-white transition-colors">{stat.label}</div>
              <div className="text-3xl font-light text-white group-hover:text-accent transition-colors tabular-nums">{stat.val}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 border-t border-white/10 pt-8">
          <button className="bg-white text-black px-6 py-3 text-[10px] font-bold tracking-[0.15em] hover:bg-gray-200 uppercase transition-colors flex items-center gap-2">
            <Send className="w-3 h-3" /> New Entry
          </button>
          <button onClick={() => setView('command')} className="border border-white/20 text-white px-6 py-3 text-[10px] font-bold tracking-[0.15em] hover:bg-white hover:text-black uppercase transition-all flex items-center gap-2">
             <Terminal className="w-3 h-3" /> Open Command
          </button>
        </div>
      </div>
    </div>
  );
};

const CommandView = () => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Message[]>([
    { 
      id: 'init',
      role: 'assistant', 
      content: "E.A./SYSTEM v4.2 Connected.\nMemory Core: Active (21,622 records)\n\nAwaiting directive.", 
      timestamp: new Date() 
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = input;
    const msgId = Date.now().toString();
    
    setInput("");
    setHistory(prev => [...prev, { id: msgId, role: 'user', content: userMsg, timestamp: new Date() }]);
    setIsProcessing(true);

    try {
      // 1. Simulate Memory Scan Visualization
      setHistory(prev => [...prev, { id: 'sys-' + msgId, role: 'system', content: "Scanning neural memory banks...", timestamp: new Date() }]);
      
      const relevantChunks = MOCK_MEMORY.filter(c => 
        c.content.toLowerCase().includes(userMsg.toLowerCase()) ||
        c.tags.some(t => userMsg.toLowerCase().includes(t))
      );
      
      await new Promise(r => setTimeout(r, 600)); // Cinematic delay

      if (relevantChunks.length > 0) {
         setHistory(prev => {
            const last = prev[prev.length - 1];
            if (last.role === 'system') {
                return [...prev.slice(0, -1), { ...last, content: `Identified ${relevantChunks.length} relevant memory fragments.` }];
            }
            return prev;
         });
         await new Promise(r => setTimeout(r, 400));
      } else {
         setHistory(prev => prev.filter(m => m.role !== 'system'));
      }

      // 2. Stream Response
      if (process.env.API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const context = relevantChunks.map(c => 
          `[REF: ${c.id} | ${c.source.toUpperCase()}]: ${c.content}`
        ).join("\n\n");

        const systemPrompt = `You are E.A./SYSTEM. A hyper-efficient executive operating system.
        Context: ${context || "No archival data found."}
        
        Directives:
        - Output strictly in formatted text.
        - Be concise, authoritative, and data-driven.
        - If referencing context, use [REF] markers.
        `;

        const assistantMsgId = 'ai-' + Date.now();
        setHistory(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }]);

        const response = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: [
              { role: 'user', parts: [{ text: systemPrompt + "\n\nQuery: " + userMsg }] }
            ]
        });

        let fullText = "";
        for await (const chunk of response) {
            const text = chunk.text();
            fullText += text;
            setHistory(prev => prev.map(m => 
                m.id === assistantMsgId ? { ...m, content: fullText } : m
            ));
        }
        
        setHistory(prev => prev.map(m => 
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        ));

      } else {
        // Mock fallback
        setTimeout(() => {
          setHistory(prev => [...prev, { id: 'err', role: 'assistant', content: "SYSTEM_ALERT: Neural Link Offline (Missing API Key).", timestamp: new Date() }]);
        }, 500);
      }

    } catch (err) {
      console.error(err);
      setHistory(prev => [...prev, { id: 'err', role: 'assistant', content: "CRITICAL_ERROR: Processing matrix interruption.", timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative animate-in zoom-in-95 duration-300">
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

       {/* Command Header */}
       <div className="p-8 border-b border-white/10 flex justify-between items-end bg-black/50 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-secondary tracking-widest mb-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              SECURE CHANNEL // ENCRYPTED
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Command Interface</h1>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <div className="text-[9px] font-mono text-secondary uppercase tracking-widest">CPU Load</div>
                <div className="text-white font-mono text-sm">12%</div>
             </div>
             <div className="text-right">
                <div className="text-[9px] font-mono text-secondary uppercase tracking-widest">Memory</div>
                <div className="text-white font-mono text-sm">64TB</div>
             </div>
          </div>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
          {history.map((msg) => (
            <div key={msg.id} className={`max-w-4xl ${msg.role === 'user' ? 'ml-auto' : ''} ${msg.role === 'system' ? 'mx-auto w-full text-center border-y border-white/5 py-2' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              
              {/* Message Header */}
              {msg.role !== 'system' && (
                  <div className={`flex items-center gap-3 mb-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <div className="text-[10px] font-mono text-secondary uppercase tracking-widest">
                        {msg.role === 'user' ? 'SVEN_ARNARSSON' : 'E.A./SYSTEM'}
                    </div>
                    <div className="text-[10px] text-gray-700 font-mono">
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </div>
                  </div>
              )}

              {/* Message Content */}
              {msg.role === 'system' ? (
                 <div className="text-[10px] font-mono text-accent tracking-widest animate-pulse flex items-center justify-center gap-2">
                    <Activity className="w-3 h-3" />
                    {msg.content}
                 </div>
              ) : (
                <div className={`relative text-sm leading-relaxed whitespace-pre-wrap font-mono ${
                    msg.role === 'user' 
                    ? 'text-white bg-white/5 p-4 border border-white/10 rounded-sm' 
                    : 'text-gray-300 pl-4 border-l-2 border-accent'
                }`}>
                    {msg.content}
                    {msg.isStreaming && <span className="inline-block w-2 h-4 bg-accent ml-1 animate-pulse align-middle"></span>}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
       </div>

       {/* Input Area */}
       <div className="p-8 border-t border-white/10 bg-black z-20">
          <form onSubmit={handleSend} className="relative mb-4 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ChevronRight className="w-4 h-4 text-accent animate-pulse" />
            </div>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter directive..."
              className="w-full bg-surface/50 border border-white/10 p-4 pl-10 pr-16 text-white text-sm focus:outline-none focus:border-white/40 focus:bg-white/5 transition-all font-mono placeholder-gray-700 tracking-wide rounded-none"
              autoFocus
            />
            <button type="submit" disabled={isProcessing} className="absolute right-2 top-2 bottom-2 px-4 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isProcessing ? 'BUSY' : 'EXECUTE'}
            </button>
          </form>
          
          <div className="flex gap-2 flex-wrap">
            {["STATUS REPORT", "ANALYZE Q4 METRICS", "INITIATE SEARCH", "PENDING APPROVALS"].map(cmd => (
              <button 
                key={cmd}
                onClick={() => setInput(cmd)} 
                className="border border-white/10 px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
              >
                {cmd}
              </button>
            ))}
          </div>
       </div>
    </div>
  );
};

// --- App Root ---

const App = () => {
  const [activeView, setActiveView] = useState('overview');

  return (
    <div className="flex h-screen bg-black text-white selection:bg-accent selection:text-white overflow-hidden font-sans">
      <Sidebar activeView={activeView} setView={setActiveView} />
      <div className="flex-1 flex flex-col relative">
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none scanline z-50 opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 pointer-events-none radial-vignette z-40"></div>
        
        {activeView === 'overview' && <OverviewView setView={setActiveView} />}
        {activeView === 'command' && <CommandView />}
        {!['overview', 'command'].includes(activeView) && (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary font-mono text-xs tracking-widest uppercase">
            <ShieldAlert className="w-12 h-12 mb-4 text-red-900 opacity-50" />
            <span>Module {activeView} Restricted</span>
            <span className="text-[9px] text-gray-700 mt-2">Authorization Level 5 Required</span>
          </div>
        )}
      </div>
      <style>{`
        .radial-vignette {
          background: radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.8) 100%);
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
