/**
 * Aria Command Center — GigitekAI Main Brain
 * Live voice conversation with European woman's voice
 * System status boxes, push-to-talk, animated waveform, typing indicator
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, Volume2, VolumeX, Copy, Download, Trash2, Brain, AlertCircle, CheckCircle, Clock, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";

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

function VoiceWaveform({ active }: { active: boolean }) {
  const heights = [3, 6, 10, 14, 10, 6, 3];
  return (
    <span className="inline-flex items-center gap-[2px]">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full transition-all duration-150 ${active ? "bg-cyan-400" : "bg-slate-600"}`}
          style={{
            height: active ? undefined : `${h * 0.4}px`,
            animation: active ? `aria-wave 0.7s ease-in-out ${i * 0.08}s infinite alternate` : "none",
            minHeight: "3px",
          }}
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const askMutation = trpc.aria.askQuestion.useMutation();

  useEffect(() => {
    const id = "aria-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes aria-bounce { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-5px);opacity:1} }
      @keyframes aria-wave { from{height:3px} to{height:18px} }
      @keyframes aria-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
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
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

  // System Status Boxes
  const systemBoxes = [
    { label: "Open Tickets", icon: AlertCircle, count: "12", status: "healthy", cmd: "Show me open tickets" },
    { label: "System Status", icon: CheckCircle, count: "99.9%", status: "healthy", cmd: "What's our system uptime?" },
    { label: "Critical Issues", icon: AlertCircle, count: "1", status: "warning", cmd: "Show critical issues" },
    { label: "Avg Resolution", icon: Clock, count: "2.4h", status: "healthy", cmd: "What's our resolution rate?" },
    { label: "KB Articles", icon: Zap, count: "932", status: "healthy", cmd: "Search KB for printer issues" },
    { label: "PowerShell Help", icon: Zap, count: "Ready", status: "healthy", cmd: "How do I create a distribution group?" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Aria Command Center</h1>
            <p className="text-xs text-slate-400">GigitekAI — AI Engineer · M365 · Azure · Exchange</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (isSpeaking) stopSpeaking(); setVoiceEnabled((v) => !v); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
              voiceEnabled ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-slate-600 text-slate-500"
            }`}
          >
            {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            {voiceEnabled ? "Voice On" : "Voice Off"}
          </button>

          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? "bg-yellow-400 animate-pulse" : isSpeaking ? "bg-green-400 animate-pulse" : "bg-cyan-400"}`} />
            <span className="text-xs text-slate-300 font-medium">
              {isSpeaking ? "Speaking..." : STAGE_LABEL[stage]}
            </span>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="text-slate-500 hover:text-red-400 ml-1">
                <VolumeX size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* System Status Grid - Always Visible */}
      <div className="flex-shrink-0 border-b border-cyan-500/20 bg-slate-900/40 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sm font-semibold text-cyan-400 mb-4 uppercase tracking-wider">System Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {systemBoxes.map((box) => {
              const Icon = box.icon;
              const statusColor = box.status === "healthy" 
                ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/20" 
                : "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20";
              const textColor = box.status === "healthy" ? "text-green-400" : "text-yellow-400";
              
              return (
                <button
                  key={box.label}
                  onClick={() => { setInput(box.cmd); inputRef.current?.focus(); }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${statusColor}`}
                >
                  <div className={`${textColor} mb-2`}><Icon size={20} /></div>
                  <h3 className="font-semibold text-xs mb-1 text-white">{box.label}</h3>
                  <p className="text-sm font-bold text-gray-200">{box.count}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto p-6">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Hi, I'm Aria</h2>
            <p className="text-gray-400 mb-6">Your GigitekAI Command Center engineer. Click any system status box above or ask me anything about your environment — M365, Azure, Exchange, Teams, or any IT issue. Use voice or text.</p>
            
            <div className="w-full">
              <p className="text-xs text-gray-500 mb-3">Quick questions:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "How do I create a distribution group in PowerShell?",
                  "What's our system uptime?",
                  "Troubleshoot Teams call quality",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                    className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-w-4xl mx-auto flex-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md lg:max-w-2xl p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-cyan-500/20 border border-cyan-500/40 text-white"
                      : "bg-gray-800/50 border border-gray-700/50 text-gray-100"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-sm text-gray-400">{STAGE_LABEL[stage]}</span>
                    <TypingDots />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-cyan-500/20 p-6 bg-slate-900/60 backdrop-blur flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 mb-3">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "default" : "outline"}
              size="sm"
              className={`${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 border-red-500"
                  : "border-cyan-500/30 hover:border-cyan-400"
              }`}
            >
              {isRecording ? <MicOff size={16} className="mr-2" /> : <Mic size={16} className="mr-2" />}
              {isRecording ? "Stop" : "Voice"}
            </Button>
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              className="border-cyan-500/30 hover:border-cyan-400"
            >
              <Trash2 size={16} className="mr-2" />
              Clear
            </Button>
            <Button
              onClick={saveChat}
              variant="outline"
              size="sm"
              className="border-cyan-500/30 hover:border-cyan-400"
            >
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>

          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Aria anything — tickets, uptime, KB, PowerShell help..."
              className="bg-gray-900/50 border-cyan-500/30 focus:border-cyan-400 text-white placeholder-gray-500"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSend}
              disabled={isProcessing || !input.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
            >
              <Send size={16} />
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {["Open Tickets", "System Status", "KB Articles", "PowerShell Help"].map((cmd) => (
              <button
                key={cmd}
                onClick={() => { setInput(cmd); inputRef.current?.focus(); }}
                className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-all"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
