import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mic, Send, Volume2, Copy, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AriaCommandCenter() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "aria"; content: string; sources?: string[] }>>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const askQuestionMutation = trpc.aria.askQuestion.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        // TODO: Upload audio to S3 and get URL, then pass to askQuestion
        toast.info("Voice recording captured (upload to S3 in next step)");
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started...");
    } catch (e) {
      toast.error("Microphone access denied");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  };

  const handleAskQuestion = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await askQuestionMutation.mutateAsync({
        question: userMessage,
        context: { systemStatus: true },
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "aria",
          content: result.response,
          sources: result.sources,
        },
      ]);
    } catch (e) {
      toast.error("Failed to get response from Aria");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChat = () => {
    const chatText = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const element = document.createElement("a");
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(chatText)}`);
    element.setAttribute("download", `aria-chat-${Date.now()}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Chat saved to file");
  };

  const handleClearChat = () => {
    if (confirm("Clear all messages?")) {
      setMessages([]);
      toast.success("Chat cleared");
    }
  };

  const handleSpeakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
      toast.success("Speaking...");
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">🧠 Aria Command Center</h1>
          <p className="text-slate-400">Your unified brain for the entire GigitekAI environment</p>
        </div>

        {/* Chat Container */}
        <div className="bg-slate-900 rounded-lg border border-cyan-500/30 h-96 overflow-y-auto mb-4 p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <p className="text-lg mb-2">👋 Welcome to Aria Command Center</p>
                <p className="text-sm">Ask me anything about your system, KB articles, or technical questions</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.role === "user" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-100 border border-cyan-500/20"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400 border-t border-slate-700 pt-2">
                      <p className="font-semibold mb-1">Sources:</p>
                      {msg.sources.slice(0, 3).map((src, i) => (
                        <p key={i}>• {src}</p>
                      ))}
                    </div>
                  )}
                  {msg.role === "aria" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleSpeakResponse(msg.content)}
                        className="text-xs hover:text-cyan-400"
                        title="Speak"
                      >
                        <Volume2 size={14} />
                      </button>
                      <button
                        onClick={() => handleCopyMessage(msg.content)}
                        className="text-xs hover:text-cyan-400"
                        title="Copy"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-cyan-500/20">
                <Loader2 className="animate-spin text-cyan-400" size={20} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
              placeholder="Ask Aria anything... (or use voice)"
              className="bg-slate-800 border-cyan-500/30 text-white placeholder-slate-500"
              disabled={isLoading}
            />
            <Button
              onClick={handleAskQuestion}
              disabled={isLoading || !input.trim()}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Send size={18} />
            </Button>
          </div>

          {/* Voice Controls */}
          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                variant="outline"
                className="border-cyan-500/30 hover:bg-slate-800"
              >
                <Mic size={18} className="mr-2" />
                Start Voice
              </Button>
            ) : (
              <Button onClick={handleStopRecording} className="bg-red-600 hover:bg-red-700">
                <Mic size={18} className="mr-2" />
                Stop Recording
              </Button>
            )}

            <Button onClick={handleSaveChat} variant="outline" className="border-cyan-500/30 hover:bg-slate-800">
              <Download size={18} className="mr-2" />
              Save Chat
            </Button>

            <Button onClick={handleClearChat} variant="outline" className="border-cyan-500/30 hover:bg-slate-800">
              <Trash2 size={18} className="mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Quick Commands */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            onClick={() => setInput("Show me open tickets")}
            variant="outline"
            className="border-cyan-500/30 hover:bg-slate-800 text-xs"
          >
            Open Tickets
          </Button>
          <Button
            onClick={() => setInput("What's our uptime today?")}
            variant="outline"
            className="border-cyan-500/30 hover:bg-slate-800 text-xs"
          >
            System Status
          </Button>
          <Button
            onClick={() => setInput("Find articles about Exchange")}
            variant="outline"
            className="border-cyan-500/30 hover:bg-slate-800 text-xs"
          >
            Search KB
          </Button>
          <Button
            onClick={() => setInput("How do I create a group in PowerShell?")}
            variant="outline"
            className="border-cyan-500/30 hover:bg-slate-800 text-xs"
          >
            Ask Technical
          </Button>
        </div>
      </div>
    </div>
  );
}
