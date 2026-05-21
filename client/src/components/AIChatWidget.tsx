import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, X, ChevronDown, Phone, MessageSquare, AlertCircle, Mic, Square, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "@/components/GigitekMarkdown";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  message: string;
  timestamp: number;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: "", email: "", phone: "", company: "", preferredDate: "", preferredTime: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York", notes: "" });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [handoffComplete, setHandoffComplete] = useState(false);
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // File upload status
  const [uploadStatus, setUploadStatus] = useState<{ state: "idle" | "uploading" | "done"; fileName?: string } | null>(null);
  // Debounced query for proactive KB suggestions
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const initInProgressRef = useRef(false); // Prevent double-init race condition

  // tRPC hooks
  const getOrCreateSession = trpc.aibot.getOrCreateSession.useMutation({
    onError: (err: any) => {
      console.error("[Chat] Session init failed:", err);
    },
  });
  const sendMessageMutation = trpc.aibot.sendMessage.useMutation({
    onError: (err: any) => {
      console.error("[Chat] Message send failed:", err);
      toast.error("Failed to send message. Please try again.");
    },
    onSuccess: (data) => {
      console.log("[Chat] Message sent successfully");
    },
  });
  const escalate = trpc.aibot.escalateToHelpDesk.useMutation();
  const captureLead = trpc.aibot.captureLead.useMutation();
  const emailTranscriptMutation = trpc.aibot.emailTranscript.useMutation();
  const requestAgentTakeover = trpc.aibot.requestAgentTakeover.useMutation();
  const clearChatHistoryMutation = trpc.aibot.clearChatHistory.useMutation();
  const { data: historyData } = trpc.aibot.getHistory.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );
  const handoffMutation = trpc.chat.handoffFromBot.useMutation();
  const bookMeetingMutation = trpc.calendar.bookMeeting.useMutation({
    onSuccess: () => {
      setBookingSuccess(true);
    },
    onError: (err: any) => {
      toast.error(err.message || "Booking failed — please try again");
    },
  });
  const { user: authUser, isAuthenticated } = useAuth();

  // Proactive KB suggestions while user is typing
  const { data: kbSuggestionsData } = trpc.aibot.getProactiveKBSuggestions.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 10, staleTime: 5000 }
  );
  const kbSuggestions = kbSuggestionsData?.suggestions || [];

  // Search analytics tracking for Aria chat
  const recordAriaSearch = trpc.kbSearchAnalytics.recordSearch.useMutation();
  const recordAriaClick = trpc.kbSearchAnalytics.recordClick.useMutation();
  const lastAriaTrackedQuery = useRef("");

  // Track search when KB suggestions load
  useEffect(() => {
    if (debouncedQuery.length >= 10 && kbSuggestionsData) {
      const q = debouncedQuery.trim().toLowerCase();
      if (q !== lastAriaTrackedQuery.current) {
        lastAriaTrackedQuery.current = q;
        recordAriaSearch.mutate({
          query: q,
          resultsCount: kbSuggestions.length,
          source: "aria_chat",
        });
      }
    }
  }, [debouncedQuery, kbSuggestionsData]);

  // Generate Mon/Wed/Fri dates for the next 3 months
  const availableDates = useMemo(() => {
    const dates: Array<{ value: string; label: string }> = [];
    const now = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    const cur = new Date(now);
    cur.setDate(cur.getDate() + 1); // start tomorrow
    while (cur <= end) {
      const day = cur.getDay();
      if (day === 1 || day === 3 || day === 5) {
        const value = cur.toISOString().split("T")[0];
        const label = cur.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        dates.push({ value, label });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, []);

  const TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  ];

  // Initialize session with hard 5-second timeout to prevent infinite hang
  useEffect(() => {
    if (!isOpen || sessionId || initInProgressRef.current) return;

    const initSession = async () => {
      initInProgressRef.current = true;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        console.log("[Chat] Initializing session...");
        // Race between session init and 5-second timeout
        const result = await Promise.race([
          getOrCreateSession.mutateAsync({
            sessionId: localStorage.getItem("chatSessionId") || undefined,
          }),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error("Session init timeout")), 5000);
          }),
        ]);
        if (timeoutId) clearTimeout(timeoutId);
        console.log("[Chat] Session initialized:", result.sessionId);
        setSessionId(result.sessionId);
        localStorage.setItem("chatSessionId", result.sessionId);
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        if (error?.message === "Session init timeout") {
          // Generate a local fallback session ID so the chat is still usable
          const fallbackId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          console.warn("[Chat] Session init timed out, using fallback ID:", fallbackId);
          setSessionId(fallbackId);
          localStorage.setItem("chatSessionId", fallbackId);
        } else {
          console.error("Failed to initialize chat session:", error);
          // Still generate fallback so chat is usable
          const fallbackId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          setSessionId(fallbackId);
          localStorage.setItem("chatSessionId", fallbackId);
        }
      } finally {
        initInProgressRef.current = false;
      }
    };

    console.log("[Chat] Opening chat, initializing session...");
    initSession();
  }, [isOpen, sessionId]);

  // Debug: Log whenever sessionId changes
  useEffect(() => {
    console.log("[Chat] sessionId state updated to:", sessionId, "button should be", sessionId ? "enabled" : "disabled");
  }, [sessionId]);

  // Load history
  useEffect(() => {
    if (sessionId && historyData?.messages && historyData.messages.length > 0) {
      console.log("[Chat] Loading history:", historyData.messages.length, "messages");
      setMessages(historyData.messages as ChatMessage[]);
    }
  }, [historyData, sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) {
      console.log("[Chat] Chat opened and session ready, focusing input");
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, sessionId]);

  // Listen for openAIChat event from ChatTriggerManager
  useEffect(() => {
    const handleOpenChat = () => {
      console.log("[Chat] openAIChat event received");
      setIsOpen(true);
    };
    window.addEventListener('openAIChat', handleOpenChat);
    return () => window.removeEventListener('openAIChat', handleOpenChat);
  }, []);

  // Log when sessionId changes
  useEffect(() => {
    if (sessionId) {
      console.log("[Chat] SessionId is now set:", sessionId);
    }
  }, [sessionId]);

  // Scroll detection for "scroll down" button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollDown(!isNearBottom);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Message Handlers ────────────────────────────────────────────────────────

  const sendQuickMessage = async (quickMessage: string) => {
    setHasInteracted(true);
    setMessages((prev) => [...prev, { role: "user", message: quickMessage, timestamp: Date.now() }]);
    setIsLoading(true);

    // Ensure session exists (same pattern as handleSendMessage)
    let ensuredSessionId = sessionId;
    if (!ensuredSessionId) {
      console.log("[Chat] Quick message: session not ready, initializing...");
      try {
        const result = await getOrCreateSession.mutateAsync({});
        ensuredSessionId = result.sessionId;
        setSessionId(ensuredSessionId);
        localStorage.setItem("chatSessionId", ensuredSessionId);
      } catch (error) {
        console.error("[Chat] Quick message: failed to init session:", error);
        // Use fallback session so chat is still usable
        ensuredSessionId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setSessionId(ensuredSessionId);
        localStorage.setItem("chatSessionId", ensuredSessionId);
      }
    }

    try {
      const response = await sendMessageMutation.mutateAsync({ sessionId: ensuredSessionId, message: quickMessage });
      setMessages((prev) => [...prev, { role: "assistant", message: response.message, timestamp: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", message: "I'm having trouble connecting right now. Please try again in a moment, or reach us at support@gigitekai.com or call (727) 382-5776.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recording handler
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        
        await handleTranscribeAudio(audioBlob);
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("[Chat] Microphone access denied:", error);
      toast.error("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Upload a Blob/File to S3 via the /api/upload/aria multipart endpoint
  const uploadToS3 = async (blob: Blob, fileName: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob, fileName);
    const response = await fetch("/api/upload/aria", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }
    const data = await response.json();
    if (!data.success || !data.url) throw new Error("Upload returned no URL");
    return data.url;
  };

  const handleTranscribeAudio = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      toast.info("Uploading audio for transcription...");
      
      // Step 1: Upload audio blob to S3 to get a real URL the server can fetch
      const audioUrl = await uploadToS3(audioBlob, `voice-${Date.now()}.webm`);
      
      // Step 2: Send the S3 URL to the transcription endpoint
      const response = await fetch("/api/trpc/aibot.transcribeVoiceMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { audioUrl } }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Transcription failed");
      }
      
      const data = await response.json();
      const transcribedText = data.result?.data?.json?.text || data.result?.text || "";
      
      if (transcribedText) {
        setInputValue(transcribedText);
        toast.success("Voice transcribed — review and press Send");
        // Auto-expand textarea to show full transcription
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.style.height = "auto";
            const newHeight = Math.min(inputRef.current.scrollHeight, 200);
            inputRef.current.style.height = newHeight + "px";
            inputRef.current.focus();
            // Move cursor to end
            inputRef.current.selectionStart = transcribedText.length;
            inputRef.current.selectionEnd = transcribedText.length;
          }
        }, 50);
      } else {
        toast.error("Could not transcribe audio. Please try again.");
      }
    } catch (error) {
      console.error("[Chat] Transcription error:", error);
      toast.error("Failed to transcribe voice message.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      setUploadStatus({ state: "uploading", fileName: file.name });
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(file.type)) {
        setUploadStatus(null);
        toast.error("File type not supported. Allowed: PDF, images, Word documents");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadStatus(null);
        toast.error("File size exceeds 5MB limit");
        return;
      }
      // Upload real file bytes to S3
      const fileUrl = await uploadToS3(file, file.name);
      setUploadStatus({ state: "done", fileName: file.name });
      // Show in chat and notify AI about the uploaded file
      setMessages((prev) => [...prev, { role: "user", message: `📎 Uploaded: [${file.name}](${fileUrl})`, timestamp: Date.now() }]);
      toast.success(`✅ File uploaded: ${file.name}`);
      // Auto-send a message to Aria asking it to review the file
      if (sessionId) {
        const ensuredSessionId = sessionId;
        const reviewMsg = `I've uploaded a file for your review: ${file.name} (${fileUrl}). Please analyze it.`;
        setMessages((prev) => [...prev, { role: "user", message: reviewMsg, timestamp: Date.now() }]);
        try {
          await sendMessageMutation.mutateAsync({ sessionId: ensuredSessionId, message: reviewMsg });
        } catch (e) {
          console.error("[Chat] Auto-review message failed:", e);
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Clear status after 4 seconds
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (error) {
      console.error("[Chat] File upload error:", error);
      setUploadStatus(null);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    console.log("[Chat] handleSendMessage called, state:", { inputValue: inputValue.trim(), sessionId: !!sessionId, isLoading, sessionIdValue: sessionId });
    if (!inputValue.trim()) {
      return;
    }
    
    setIsLoading(true);
    
    // If sessionId is not set, initialize it first
    let ensuredSessionId = sessionId;
    if (!ensuredSessionId) {
      console.log("[Chat] Session not initialized, initializing now...");
      try {
        const result = await getOrCreateSession.mutateAsync({});
        ensuredSessionId = result.sessionId;
        setSessionId(ensuredSessionId);
        localStorage.setItem("chatSessionId", ensuredSessionId);
      } catch (error) {
        console.error("[Chat] Failed to initialize session:", error);
        toast.error("Failed to initialize chat session. Please try again.");
        setIsLoading(false);
        return;
      }
    }
    
    console.log("[Chat] Sending message:", inputValue);
    const userMessage = inputValue.trim();
    setInputValue("");
    setHasInteracted(true);
    setMessages((prev) => [...prev, { role: "user", message: userMessage, timestamp: Date.now() }]);

    try {
      console.log("[Chat] Calling sendMessage mutation with ensuredSessionId:", ensuredSessionId);
      const response = await sendMessageMutation.mutateAsync({ sessionId: ensuredSessionId, message: userMessage });
      console.log("[Chat] Got response:", response.message.substring(0, 50));
      setMessages((prev) => [...prev, { role: "assistant", message: response.message, timestamp: Date.now() }]);

      if (response.shouldEscalate && response.messageCount && response.messageCount > 2) {
        setTimeout(() => {
          toast.info("Our support team is ready", {
            description: "Would you like to speak with a specialist?",
            action: { label: "Yes, connect me", onClick: () => handleEscalate("User requested escalation") },
          });
        }, 1000);
      }
    } catch (error) {
      console.error("[Chat] Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async (reason: string) => {
    if (!sessionId) return;
    try {
      await escalate.mutateAsync({ sessionId, reason, priority: "medium" });

      // If user is authenticated, attempt live chat handoff
      if (isAuthenticated && authUser) {
        try {
          const handoffResult = await handoffMutation.mutateAsync({
            aiSessionId: sessionId,
            summary: `[Handoff] Reason: ${reason}. User ${authUser.name || authUser.email || ""} transferred from AI assistant.`,
          });
          setHandoffComplete(true);
          toast.success("Connected to live support", {
            description: "You've been transferred to our admin team.",
          });
          // Add system message to AI chat
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              message: "You have been connected to our support team. A specialist will be with you shortly.",
              timestamp: Date.now(),
            },
          ]);
        } catch (error) {
          console.error("Handoff failed:", error);
          toast.info("Escalated to support", {
            description: "Your request has been escalated. Our team will contact you soon.",
          });
        }
      }
    } catch (error) {
      console.error("Escalation failed:", error);
      toast.error("Failed to escalate. Please try again.");
    }
  };

  const handleEmailTranscript = async () => {
    if (!sessionId || !authUser?.email) return;
    try {
      await emailTranscriptMutation.mutateAsync({ sessionId, email: authUser.email });
      toast.success("Transcript sent to your email");
    } catch (error) {
      toast.error("Failed to send transcript");
    }
  };

  const handleClearHistory = async () => {
    if (!sessionId) return;
    try {
      await clearChatHistoryMutation.mutateAsync({ sessionId });
      setMessages([]);
      setHasInteracted(false);
      toast.success("Chat history cleared");
    } catch (error) {
      toast.error("Failed to clear history");
    }
  };

  const handleCaptureLead = async () => {
    if (!sessionId || !authUser?.email) return;
    try {
      await captureLead.mutateAsync({
        sessionId,
        name: authUser?.name || "",
        email: authUser.email,
        phone: "",
        company: "",
      });
      toast.success("Lead information captured");
    } catch (error) {
      toast.error("Failed to capture lead");
    }
  };

  const handleBookMeeting = async () => {
    if (!sessionId || !bookingForm.preferredDate || !bookingForm.preferredTime) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await bookMeetingMutation.mutateAsync({
        name: bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        company: bookingForm.company,
        preferredDate: bookingForm.preferredDate,
        preferredTime: bookingForm.preferredTime,
        timezone: bookingForm.timezone,
      });
      toast.success("Meeting booked successfully");
      setShowBookingModal(false);
      setBookingForm({ name: "", email: "", phone: "", company: "", preferredDate: "", preferredTime: "", timezone: bookingForm.timezone, notes: "" });
    } catch (error) {
      toast.error("Failed to book meeting");
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center text-white z-40"
          aria-label="Open chat"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full"></span>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg shadow-2xl flex flex-col z-50 border border-cyan-500/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-t-lg border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">GigitekAI Assistant</h3>
                <p className="text-xs text-cyan-400">AI-powered support • Always online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50 min-h-0"
          >
            {!hasInteracted && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-cyan-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Welcome to GigitekAI</h4>
                <p className="text-gray-400 text-sm mb-6">Your AI-powered technology partner. How can I help you today?</p>

                {/* Quick Action Buttons */}
                <div ref={actionsMenuRef} className="grid grid-cols-2 gap-2 w-full">
                  <button
                    onClick={() => sendQuickMessage("Tell me about your AI Assessment service")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-purple-600/30 to-purple-700/30 hover:from-purple-600/50 hover:to-purple-700/50 rounded-lg border border-purple-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">🧠</div>
                    AI Assessment
                  </button>
                  <button
                    onClick={() => sendQuickMessage("How can you help with cloud migration?")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-cyan-600/30 to-cyan-700/30 hover:from-cyan-600/50 hover:to-cyan-700/50 rounded-lg border border-cyan-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">☁️</div>
                    Cloud Migration
                  </button>
                  <button
                    onClick={() => sendQuickMessage("What automation services do you offer?")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-amber-600/30 to-amber-700/30 hover:from-amber-600/50 hover:to-amber-700/50 rounded-lg border border-amber-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">⚡</div>
                    Automation
                  </button>
                  <button
                    onClick={() => sendQuickMessage("Tell me about your security audit services")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-green-600/30 to-green-700/30 hover:from-green-600/50 hover:to-green-700/50 rounded-lg border border-green-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">🛡️</div>
                    Security Audit
                  </button>
                  <button
                    onClick={() => sendQuickMessage("I need to report a bug")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-red-600/30 to-red-700/30 hover:from-red-600/50 hover:to-red-700/50 rounded-lg border border-red-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">🐛</div>
                    Report a Bug
                  </button>
                  <button
                    onClick={() => sendQuickMessage("I want to submit a support ticket")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-blue-600/30 to-blue-700/30 hover:from-blue-600/50 hover:to-blue-700/50 rounded-lg border border-blue-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">📧</div>
                    Submit Ticket
                  </button>
                  <button
                    onClick={() => sendQuickMessage("I have a general question")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-teal-600/30 to-teal-700/30 hover:from-teal-600/50 hover:to-teal-700/50 rounded-lg border border-teal-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">❓</div>
                    General Help
                  </button>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-indigo-600/30 to-indigo-700/30 hover:from-indigo-600/50 hover:to-indigo-700/50 rounded-lg border border-indigo-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">📞</div>
                    Talk to a specialist
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-cyan-600 text-white rounded-br-none"
                      : "bg-slate-700 text-gray-100 rounded-bl-none"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.message}</Streamdown>
                  ) : (
                    <p className="text-sm">{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll Down Button */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 right-6 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-2 shadow-lg transition-all"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}

          {/* Input Area - Fixed at bottom */}
          <div className="bg-slate-800 border-t border-cyan-500/20 p-4 flex flex-col gap-2">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                  // Debounce KB suggestion query
                  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                  debounceTimerRef.current = setTimeout(() => {
                    setDebouncedQuery(e.target.value);
                  }, 300);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                  // Shift+Enter inserts newline (default textarea behavior)
                }}
                placeholder="Ask anything... (Shift+Enter for new line)"
                className="flex-1 bg-slate-700 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm resize-none overflow-hidden min-h-[38px]"
                style={{ height: "38px" }}
              />
              {isRecording ? (
                <button
                  onClick={handleStopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 transition-all flex items-center gap-2 text-sm"
                >
                  <Square className="w-4 h-4" />
                  {recordingTime}s
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  disabled={isLoading}
                  className="bg-slate-700 hover:bg-slate-600 text-cyan-400 hover:text-cyan-300 rounded-lg px-3 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Record voice message"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-slate-700 hover:bg-slate-600 text-cyan-400 hover:text-cyan-300 rounded-lg px-3 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Upload file (PDF, images, documents)"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg px-3 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {/* Upload status indicator */}
            {uploadStatus && (
              <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md ${
                uploadStatus.state === "uploading"
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-green-500/10 text-green-400"
              }`}>
                {uploadStatus.state === "uploading" ? (
                  <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                ) : (
                  <span className="flex-shrink-0">✅</span>
                )}
                <span className="truncate">
                  {uploadStatus.state === "uploading"
                    ? `Uploading ${uploadStatus.fileName}...`
                    : `${uploadStatus.fileName} uploaded successfully`}
                </span>
              </div>
            )}
            {isLoading && !uploadStatus && (
              <div className="flex items-center gap-2 text-cyan-400 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>AI is thinking...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Schedule a Meeting</DialogTitle>
            <DialogDescription className="text-gray-400">
              Connect with one of our specialists
            </DialogDescription>
          </DialogHeader>
          {bookingSuccess ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Meeting Booked!</h3>
              <p className="text-gray-400 text-sm">
                We'll send you a confirmation email shortly.
              </p>
              <Button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingSuccess(false);
                }}
                className="mt-4 bg-cyan-600 hover:bg-cyan-700"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={bookingForm.name}
                onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="email"
                placeholder="Your email"
                value={bookingForm.email}
                onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="tel"
                placeholder="Your phone"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Company"
                value={bookingForm.company}
                onChange={(e) => setBookingForm({ ...bookingForm, company: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <Select value={bookingForm.preferredDate} onValueChange={(value) => setBookingForm({ ...bookingForm, preferredDate: value })}>
                <SelectTrigger className="bg-slate-800 border-cyan-500/30 text-white">
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-cyan-500/30">
                  {availableDates.map((date) => (
                    <SelectItem key={date.value} value={date.value} className="text-white hover:bg-cyan-600">
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={bookingForm.preferredTime} onValueChange={(value) => setBookingForm({ ...bookingForm, preferredTime: value })}>
                <SelectTrigger className="bg-slate-800 border-cyan-500/30 text-white">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-cyan-500/30">
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time} className="text-white hover:bg-cyan-600">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Additional notes"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <Button
                onClick={handleBookMeeting}
                disabled={bookMeetingMutation.isPending}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {bookMeetingMutation.isPending ? "Booking..." : "Book Meeting"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
