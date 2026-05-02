import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import 'highlight.js/styles/github-dark.min.css';
import hljs from 'highlight.js';
import { Paperclip, Send, Cpu, Loader2, Mic, Volume2, VolumeX, Download, Upload } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  isMarkdown: boolean;
  timestamp: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      sender: 'agent',
      text: 'I am an autonomous agent. Give me a task, and I will use memory, web search, calculations, and notes to complete it. What would you like me to do?',
      isMarkdown: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [status, setStatus] = useState('Initialising...');
  const [isSpinning, setIsSpinning] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentModel, setCurrentModel] = useState('gemma-2b-it-q4f16_1-MLC');
  const [typing, setTyping] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // refs for closures
  const isVoiceEnabledRef = useRef(isVoiceEnabled);
  useEffect(() => {
    isVoiceEnabledRef.current = isVoiceEnabled;
  }, [isVoiceEnabled]);

  const workerRef = useRef<Worker | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const initWorker = useCallback((modelId: string) => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    setStatus(`Loading ${modelId}...`);
    setIsSpinning(true);
    setIsReady(false);

    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, data } = e.data;
      switch (type) {
        case 'PROGRESS':
        case 'THINKING':
          setStatus(data);
          setIsSpinning(true);
          break;
        case 'READY':
          setStatus('Ready');
          setIsSpinning(false);
          setIsReady(true);
          break;
        case 'DONE':
          setTyping(false);
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              sender: 'agent',
              text: data,
              isMarkdown: true,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsProcessing(false);
          setStatus('Idle');
          setIsSpinning(false);
          if (isVoiceEnabledRef.current && 'speechSynthesis' in window) {
            // Strip markdown formatting for cleaner speech synthesis
            const textToSpeak = data.replace(/[*#_`]/g, '').replace(/\[.*\]\(.*\)/g, '');
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            window.speechSynthesis.speak(utterance);
          }
          break;
        case 'EXPORT_DATA':
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `swap_agent_memory_${new Date().getTime()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          setStatus('Export Complete');
          setIsSpinning(false);
          break;
        case 'ERROR':
          setTyping(false);
          setStatus('Error: ' + data);
          setIsSpinning(false);
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              sender: 'system',
              text: 'â\u009A\u00A0 ' + data,
              isMarkdown: false,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsProcessing(false);
          break;
      }
    };

    worker.onerror = (err) => {
      console.error(err);
      setStatus('Worker crashed');
      setIsSpinning(false);
    };

    worker.postMessage({ type: 'INIT', modelId });
  }, []);

  useEffect(() => {
    initWorker(currentModel);
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [currentModel, initWorker]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    if (newModel === currentModel) return;
    setCurrentModel(newModel);
    setMessages([{
      id: crypto.randomUUID(),
      sender: 'agent',
      text: `Switching to ${e.target.options[e.target.selectedIndex].text}...`,
      isMarkdown: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isProcessing || !isReady) return;

    setIsProcessing(true);
    setInputValue('');
    
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'user',
        text,
        isMarkdown: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    
    setTyping(true);
    workerRef.current?.postMessage({ type: 'TASK', payload: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workerRef.current) return;

    setStatus(`Reading ${file.name}...`);
    setIsSpinning(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      workerRef.current?.postMessage({ 
        type: 'INGEST_FILE', 
        payload: { name: file.name, content: event.target?.result } 
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workerRef.current) return;
    setStatus(`Restoring DB...`);
    setIsSpinning(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        workerRef.current?.postMessage({ type: 'IMPORT_MEMORY', payload: data });
      } catch (err) {
        setStatus('Invalid backup file');
        setIsSpinning(false);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!workerRef.current) return;
    setStatus('Exporting DB...');
    setIsSpinning(true);
    workerRef.current.postMessage({ type: 'EXPORT_MEMORY' });
  };

  const handleMic = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInputValue(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.sender === 'agent' && msg.isMarkdown) {
      const htmlContent = marked.parse(msg.text);
      // We parse safely by injecting the HTML
      // Post processing for highlight.js can be done in a useEffect, but standard marked outputs simple pre/codes.
      return <div className="markdown-body text-[0.95rem] leading-[1.4]" dangerouslySetInnerHTML={{ __html: htmlContent as string }} />;
    }
    return <span className="text-[0.95rem] leading-[1.4] whitespace-pre-wrap">{msg.text}</span>;
  };

  return (
    <div className="relative w-full h-screen bg-[#0a0b14] text-white font-sans overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full h-full p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <header className="flex items-center justify-between bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-2 font-semibold select-none cursor-default">
          <svg viewBox="0 0 100 100" width="28" height="28">
            <path d="M20 50 L40 30 L60 30 L80 50 L60 70 L40 70 Z" fill="none" stroke="var(--accent)" strokeWidth="3" />
            <path d="M20 50 L40 70 L60 70 L80 50 L60 30 L40 30 Z" fill="none" stroke="#00a3ff" strokeWidth="2" opacity="0.8" />
            <circle cx="42" cy="50" r="4" fill="var(--accent)" />
            <circle cx="58" cy="50" r="4" fill="#00a3ff" />
          </svg>
          <span className="text-lg tracking-tight">SWAP Core</span>
        </div>
        
        <div className="flex items-center justify-between min-w-[200px]">
          <div className="flex flex-col items-end">
             <p className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Model</p>
             <div className="flex items-center gap-1 mt-0.5">
               <Cpu size={12} className="text-emerald-400" />
               <select 
                 className="bg-transparent border-none text-xs font-medium outline-none cursor-pointer text-white appearance-none text-right"
                 value={currentModel}
                 onChange={handleModelChange}
               >
                 <option value="gemma-2b-it-q4f16_1-MLC" className="bg-[#0a0b14]">Gemma 2B</option>
                 <option value="SmolLM-1.7B-Instruct-v0.2-q4f16_1-MLC" className="bg-[#0a0b14]">SmolLM 1.7B</option>
                 <option value="Llama-3.2-3B-Instruct-q4f16_1-MLC" className="bg-[#0a0b14]">Llama 3.2 3B</option>
               </select>
             </div>
          </div>
          <div className="w-px h-8 bg-white/10 mx-4"></div>
          <div className="flex flex-col items-end min-w-[80px]">
            <p className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-0.5">Status</p>
            <div className="text-[11px] flex items-center gap-1.5 font-medium text-emerald-400">
              {isSpinning && <Loader2 size={12} className="animate-spin" />}
              <span className="truncate max-w-[120px]">{status}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 flex flex-col gap-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-4 md:p-6 overflow-hidden relative">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col gap-6 pr-2 webkit-overflow-scrolling-touch">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[85%] animate-[fadeIn_0.2s_ease] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}
          >
            <div className={`px-4 py-3 border backdrop-blur-lg break-words ${msg.sender === 'user' ? 'bg-white/5 border-white/5 rounded-2xl rounded-tr-none' : 'bg-white/10 border-white/20 rounded-2xl rounded-tl-none'} shadow-lg`}>
              {renderMessageContent(msg)}
            </div>
            <div className={`text-[10px] text-white/40 mt-1 select-none font-mono ${msg.sender === 'user' ? 'mr-2' : 'ml-2'}`}>
              {msg.sender === 'user' ? 'USR' : 'AGT'} • {msg.timestamp}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex flex-col max-w-[85%] self-start animate-[fadeIn_0.2s_ease]">
            <div className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl rounded-tl-none backdrop-blur-lg w-max shadow-lg shadow-black/20">
              <div className="flex items-center gap-2 h-5">
                <Loader2 size={14} className="animate-spin text-white/60" />
                <span className="text-[11px] text-white/60 uppercase tracking-widest">Processing...</span>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Input Area */}
        <div className="mt-auto relative pt-4 shrink-0 flex items-end gap-2">
          <div className="flex items-center bg-black/20 border border-white/10 rounded-2xl p-1 mb-0.5 shrink-0 overflow-x-auto max-w-[150px] md:max-w-none no-scrollbar">
            <label className="p-2 text-white/40 cursor-pointer hover:text-white hover:bg-white/10 transition-colors rounded-xl shrink-0" title="Upload Document">
              <Paperclip size={18} />
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".txt,.md,.json" 
                onChange={handleFileUpload}
              />
            </label>
            <button 
              onClick={handleMic}
              className={`p-2 cursor-pointer transition-colors rounded-xl shrink-0 ${isListening ? 'text-red-400 bg-red-400/10 animate-pulse' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              title="Voice Input"
            >
              <Mic size={18} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1 shrink-0"></div>
            <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`p-2 cursor-pointer transition-colors rounded-xl shrink-0 ${isVoiceEnabled ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`} title="Toggle Voice Response">
              {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button onClick={handleExport} className="p-2 text-white/40 cursor-pointer transition-colors hover:text-white hover:bg-white/10 rounded-xl shrink-0" title="Backup Base Data">
              <Download size={18} />
            </button>
            <label className="p-2 text-white/40 cursor-pointer transition-colors hover:text-white hover:bg-white/10 rounded-xl flex items-center shrink-0" title="Restore Data">
              <Upload size={18} />
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
          </div>
          
          <div className="flex-1 relative">
            <textarea 
              rows={1}
              disabled={!isReady || isProcessing}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isReady ? "Command Agent..." : "Initializing Systems..."}
              className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 md:py-4 pl-4 md:pl-6 pr-14 focus:outline-none focus:border-white/30 text-sm placeholder:text-white/30 resize-none max-h-[120px] overflow-y-auto block leading-normal transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={!isReady || isProcessing || !inputValue.trim()}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 bg-gradient-to-tr from-blue-500 to-emerald-400 hover:opacity-90 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:grayscale transition-all shadow-lg"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
