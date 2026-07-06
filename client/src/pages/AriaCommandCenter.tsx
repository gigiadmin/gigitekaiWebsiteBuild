/**
 * Aria Command Center — GigitekAI Main Brain
 * Holographic sphere with real-time audio volume visualization
 * Fully responsive layout for mobile and desktop
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, Volume2, VolumeX, Download, Trash2, Brain, AlertCircle, CheckCircle, Clock, Zap, Activity } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Message = {
  id: string;
  role: "user" | "aria";
  content: string;
  sources?: string[];
  timestamp: Date;
  isVoice?: boolean;
};

type Stage = "idle" | "listening" | "transcribing" | "thinking" | "searching" | "responding";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "Ready",
  listening: "Listening...",
  transcribing: "Transcribing...",
  thinking: "Thinking...",
  searching: "Searching KB...",
  responding: "Responding...",
};

function pickEuropeanFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const priorities = [
    (v: SpeechSynthesisVoice) => /en[-_](GB|IE|AU)/i.test(v.lang) && /female|woman|fiona|kate|serena|victoria|moira|tessa/i.test(v.name),
    (v: SpeechSynthesisVoice) => /en[-_](GB|IE)/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /female|woman|fiona|kate|serena|victoria|moira|tessa|zira|hazel/i.test(v.name),
    (v: SpeechSynthesisVoice) => /en/i.test(v.lang),
  ];

  for (const test of priorities) {
    const match = voices.find(test);
    if (match) return match;
  }
  return voices[0] ?? null;
}

function speakAsAria(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const clean = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  const setVoice = () => {
    const voice = pickEuropeanFemaleVoice();
    if (voice) utterance.voice = voice;
  };
  setVoice();
  if (!utterance.voice) {
    window.speechSynthesis.onvoiceschanged = () => { setVoice(); };
  }

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

function HolographicSphere({ isActive, audioVolume = 0 }: { isActive: boolean; audioVolume: number }) {
  const volumeScale = 1 + audioVolume * 0.3;
  const volumeOpacity = 0.3 + audioVolume * 0.7;
  const glowIntensity = audioVolume * 100;

  return (
    <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center flex-shrink-0">
      <div 
        className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
        style={{ 
          animation: isActive ? "sphere-pulse 2s ease-in-out infinite" : "none",
          transform: `scale(${volumeScale})`,
          opacity: 0.3 + audioVolume * 0.4,
          transitionDuration: "75ms"
        }} 
      />
      <div 
        className="absolute inset-4 rounded-full border border-cyan-400/20"
        style={{ 
          animation: isActive ? "sphere-rotate 8s linear infinite" : "none",
          transform: `scale(${volumeScale})`,
          opacity: 0.2 + audioVolume * 0.3,
          transitionDuration: "75ms"
        }} 
      />
      <div 
        className="absolute inset-8 rounded-full border border-cyan-500/40"
        style={{ 
          animation: isActive ? "sphere-pulse 3s ease-in-out infinite" : "none",
          animationDelay: "0.5s",
          transform: `scale(${volumeScale})`,
          opacity: 0.4 + audioVolume * 0.5,
          transitionDuration: "75ms"
        }} 
      />

      <div 
        className="absolute inset-12 rounded-full bg-gradient-to-br from-cyan-400/40 to-cyan-600/20 blur-xl"
        style={{ 
          animation: isActive ? "sphere-glow 2s ease-in-out infinite" : "none",
          transform: `scale(${volumeScale})`,
          opacity: volumeOpacity,
          boxShadow: `0 0 ${20 + glowIntensity}px rgba(34, 211, 238, ${0.5 + audioVolume * 0.5})`,
          transitionDuration: "75ms"
        }} 
      />
      
      <div 
        className="absolute inset-16 rounded-full bg-cyan-500/30 blur-md"
        style={{
          transform: `scale(${volumeScale})`,
          opacity: 0.3 + audioVolume * 0.5,
          transitionDuration: "75ms"
        }}
      />
      <div 
        className="absolute inset-20 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg"
        style={{
          transform: `scale(${volumeScale})`,
          boxShadow: `0 0 ${30 + glowIntensity * 1.5}px rgba(34, 211, 238, ${0.6 + audioVolume * 0.4})`,
          transitionDuration: "75ms"
        }}
      />

      <div 
        className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-cyan-300 shadow-lg"
        style={{
          transform: `scale(${0.8 + audioVolume * 0.4})`,
          boxShadow: `0 0 ${15 + glowIntensity}px rgba(165, 243, 252, ${0.8 + audioVolume * 0.2})`,
          transitionDuration: "75ms"
        }}
      />
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-end gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[5px] h-[5px] rounded-full bg-cyan-400 inline-block"
          style={{ animation: `aria-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}

export default function AriaCommandCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const askMutation = trpc.aria.askQuestion.useMutation();

  useEffect(() => {
    const id = "aria-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes aria-bounce { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-5px);opacity:1} }
      @keyframes sphere-pulse { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.1);opacity:1} }
      @keyframes sphere-glow { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      @keyframes sphere-rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  const analyzeAudioVolume = useCallback(() => {
    if (!analyzerRef.current) return;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const normalizedVolume = Math.min(rms / 128, 1);

    setAudioVolume(normalizedVolume);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudioVolume);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        setAudioVolume(0);
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          setStage("transcribing");

          try {
            const placeholderId = `voice-${Date.now()}`;
            setMessages((prev) => [
              ...prev,
              { id: placeholderId, role: "user", content: "🎤 Voice message (transcribing...)", timestamp: new Date(), isVoice: true },
            ]);

            setStage("thinking");
            const result = await askMutation.mutateAsync({
              question: "voice",
              audioBase64: base64,
              context: { systemStatus: true },
            });

            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId
                  ? { ...m, content: `🎤 ${result.transcribedQuestion || "Voice message"}` }
                  : m
              )
            );

            setStage("responding");
            await new Promise((r) => setTimeout(r, 300));

            addMessage({ role: "aria", content: result.response, sources: result.sources, timestamp: new Date() });

            if (voiceEnabled) {
              setIsSpeaking(true);
              speakAsAria(result.response, () => setIsSpeaking(false));
            }
          } catch {
            toast.error("Voice processing failed");
          } finally {
            setStage("idle");
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setStage("listening");
      analyzeAudioVolume();
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAudioVolume(0);
    }
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || stage !== "idle") return;
    setInput("");
    addMessage({ role: "user", content: q, timestamp: new Date() });

    setStage("thinking");
    const stageTimer = setTimeout(() => setStage("searching"), 1000);

    try {
      const result = await askMutation.mutateAsync({ question: q, context: { systemStatus: true } });
      clearTimeout(stageTimer);
      setStage("responding");
      await new Promise((r) => setTimeout(r, 300));

      addMessage({ role: "aria", content: result.response, sources: result.sources, timestamp: new Date() });

      if (voiceEnabled) {
        setIsSpeaking(true);
        speakAsAria(result.response, () => setIsSpeaking(false));
      }
    } catch {
      clearTimeout(stageTimer);
      toast.error("Aria failed to respond");
    } finally {
      setStage("idle");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const saveChat = () => {
    const txt = messages.map((m) => `[${m.timestamp.toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const a = document.createElement("a");
    a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(txt)}`;
    a.download = `aria-chat-${Date.now()}.txt`;
    a.click();
    toast.success("Chat saved");
  };

  const clearChat = () => { if (confirm("Clear all messages?")) { setMessages([]); toast.success("Chat cleared"); } };

  const isProcessing = stage !== "idle";
  const isActive = isRecording || isSpeaking || isProcessing;

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const systemBoxes = [
    { label: "Open Tickets", icon: AlertCircle, count: "12", status: "healthy", query: "What are the currently open support tickets? Show me a summary of their status and priority." },
    { label: "System Status", icon: CheckCircle, count: "99.9%", status: "healthy", query: "What is the current system status? Are there any ongoing incidents or maintenance windows?" },
    { label: "Critical Issues", icon: AlertCircle, count: "1", status: "warning", query: "What are the critical system issues that need immediate attention? Provide details and recommended solutions." },
    { label: "Avg Resolution", icon: Clock, count: "2.4h", status: "healthy", query: "What is our average ticket resolution time? How can we improve it?" },
    { label: "KB Articles", icon: Zap, count: "932", status: "healthy", query: "Show me the most frequently accessed KB articles and trending topics." },
    { label: "PowerShell Help", icon: Activity, count: "Ready", status: "healthy", query: "What are the most useful PowerShell commands and scripts for M365 administration?" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">Aria Command Center</h1>
            <p className="text-xs text-slate-400 truncate">GigitekAI — AI Engineer · M365 · Azure</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => { if (isSpeaking) stopSpeaking(); setVoiceEnabled((v) => !v); }}
            className={`flex items-center gap-1 text-xs px-2 sm:px-3 py-1.5 rounded-full border transition-all ${
              voiceEnabled ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-slate-600 text-slate-500"
            }`}
          >
            {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span className="hidden sm:inline">{voiceEnabled ? "Voice On" : "Voice Off"}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 px-2 sm:px-3 py-1.5 rounded-full text-xs">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? "bg-yellow-400 animate-pulse" : isSpeaking ? "bg-green-400 animate-pulse" : "bg-cyan-400"}`} />
            <span className="text-slate-300 font-medium hidden sm:inline">{isSpeaking ? "Speaking..." : STAGE_LABEL[stage]}</span>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="text-slate-500 hover:text-red-400 ml-1">
                <VolumeX size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
        {/* Left: Holographic Sphere + System Status Grid - Full height on mobile */}
        <div className="flex-1 flex flex-col items-center justify-start lg:justify-center gap-6 sm:gap-8 min-h-0 lg:min-h-full">
          {/* Holographic Sphere - Large and prominent */}
          <div className="flex-shrink-0 pt-4 sm:pt-6 lg:pt-0">
            <HolographicSphere isActive={isActive} audioVolume={audioVolume} />
          </div>

          {/* System Status Grid - 2x3 on mobile, 3x2 on larger */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-xs sm:max-w-md flex-shrink-0">
            {systemBoxes.map((box) => {
              const Icon = box.icon;
              const statusColor = box.status === "healthy" 
                ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/20" 
                : "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20";
              const textColor = box.status === "healthy" ? "text-green-400" : "text-yellow-400";
              
              return (
                <button
                  key={box.label}
                  onClick={() => { setInput(box.query); inputRef.current?.focus(); }}
                  className={`p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${statusColor}`}
                >
                  <div className={`${textColor} mb-1`}><Icon size={14} className="sm:w-4 sm:h-4" /></div>
                  <h3 className="font-semibold text-xs mb-0.5 text-white">{box.label}</h3>
                  <p className="text-xs font-bold text-gray-200">{box.count}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Chat Messages - Full width on mobile, sidebar on desktop */}
        <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-cyan-500/20 pt-4 lg:pt-0 lg:pl-6 min-h-0">
          {/* Chat Header */}
          <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-cyan-500/20 flex-shrink-0">
            <h2 className="text-xs sm:text-sm font-semibold text-cyan-400 uppercase tracking-wider">Conversation</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-3 sm:mb-4 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-xs sm:text-sm py-6 sm:py-8">
                <p>Ask me anything...</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
                        message.role === "user"
                          ? "bg-cyan-500/20 border border-cyan-500/40 text-white"
                          : "bg-gray-800/50 border border-gray-700/50 text-gray-100"
                      }`}
                    >
                      {message.role === "aria" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-100 [&>*]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>p]:my-1 [&>code]:bg-gray-900 [&>code]:px-1 [&>code]:rounded">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 border border-gray-700/50 p-2 sm:p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs text-gray-400">{STAGE_LABEL[stage]}</span>
                        <TypingDots />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="space-y-2 border-t border-cyan-500/20 pt-3 sm:pt-4 flex-shrink-0">
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "default" : "outline"}
                size="sm"
                className={`flex-1 text-xs sm:text-sm ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 border-red-500"
                    : "border-cyan-500/30 hover:border-cyan-400"
                }`}
              >
                {isRecording ? <MicOff size={12} className="sm:w-4 sm:h-4 mr-1" /> : <Mic size={12} className="sm:w-4 sm:h-4 mr-1" />}
                {isRecording ? "Stop" : "Voice"}
              </Button>
              <Button
                onClick={clearChat}
                variant="outline"
                size="sm"
                className="border-cyan-500/30 hover:border-cyan-400"
              >
                <Trash2 size={12} className="sm:w-4 sm:h-4" />
              </Button>
              <Button
                onClick={saveChat}
                variant="outline"
                size="sm"
                className="border-cyan-500/30 hover:border-cyan-400"
              >
                <Download size={12} className="sm:w-4 sm:h-4" />
              </Button>
            </div>

            <div className="flex gap-1.5 sm:gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask Aria..."
                className="bg-gray-900/50 border-cyan-500/30 focus:border-cyan-400 text-white placeholder-gray-500 text-xs sm:text-sm"
                disabled={isProcessing}
              />
              <Button
                onClick={handleSend}
                disabled={isProcessing || !input.trim()}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                size="sm"
              >
                <Send size={12} className="sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
