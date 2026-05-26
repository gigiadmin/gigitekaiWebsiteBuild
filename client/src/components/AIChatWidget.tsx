import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, X, ChevronDown, Phone, MessageSquare, AlertCircle, Mic, Square, Upload, Download, Trash2 } from "lucide-react";
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
  const [isMinimized, setIsMinimized] = useState(false);
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
  // Ticket form state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    requesterName: "",
    requesterEmail: "",
    tags: "chatbot",
    priority: "medium",
    includeChatTranscript: true,
    description: "",
  });
  const [ticketFormErrors, setTicketFormErrors] = useState<Record<string, string>>({});
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
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
  
  // Context form states
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({ challenge: "", companySize: "" });
  
  const [showMigrationForm, setShowMigrationForm] = useState(false);
  const [migrationForm, setMigrationForm] = useState({ currentPlatform: "", targetPlatform: "", timeline: "" });
  
  const [showAutomationForm, setShowAutomationForm] = useState(false);
  const [automationForm, setAutomationForm] = useState({ processToAutomate: "", currentTool: "" });
  
  const [showSecurityForm, setShowSecurityForm] = useState(false);
  const [securityForm, setSecurityForm] = useState({ focus: "" });
  
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugForm, setBugForm] = useState({ description: "", affectedService: "" });
  
  const [showSpecialistForm, setShowSpecialistForm] = useState(false);
  const [specialistForm, setSpecialistForm] = useState({ name: "", company: "", email: "", reason: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [specialistSubmitting, setSpecialistSubmitting] = useState(false);

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
      setMessages((prev) => [...prev, { role: "assistant", message: "I'm having trouble connecting right now. Please try again in a moment, or reach us at support@gigitekai.com or call (727) 382-6909.", timestamp: Date.now() }]);
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

      // Auto-trigger specialist form if bot is connecting user to specialist
      if (response.openSpecialistForm) {
        setTimeout(() => {
          setShowSpecialistForm(true);
        }, 500);
      }

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
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-[opacity,transform] hover:scale-110 flex items-center justify-center text-white z-40"
          aria-label="Open chat"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full"></span>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 ${isMinimized ? 'w-72 sm:w-80 h-16' : 'w-[95vw] sm:w-[500px] h-[90vh] sm:h-[700px] max-h-[90vh]'} bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg shadow-2xl flex flex-col z-50 border border-cyan-500/20 transition-all duration-300`}>
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
            <div className="flex items-center gap-2">
              {!isMinimized && (
                <>
                  {/* Save Chat Button */}
                  <button
                    onClick={() => {
                      const transcript = messages
                        .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.message}`)
                        .join('\n\n');
                      const element = document.createElement('a');
                      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcript));
                      element.setAttribute('download', `chat-${new Date().toISOString().split('T')[0]}.txt`);
                      element.style.display = 'none';
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                      toast.success('Chat saved as file');
                    }}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    title="Save chat as file"
                    disabled={messages.length === 0}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  {/* Clear Chat Button */}
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all messages?')) {
                        setMessages([]);
                        if (sessionId) {
                          clearChatHistoryMutation.mutate({ sessionId });
                        }
                        toast.success('Chat cleared');
                      }
                    }}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    title="Clear chat"
                    disabled={messages.length === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {/* Minimize Button */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          {!isMinimized && (
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50 min-h-0"
          >
            {!hasInteracted && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-2 sm:px-4">
                <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                  <MessageSquare className="w-6 sm:w-8 h-6 sm:h-8 text-cyan-400" />
                </div>
                <h4 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Welcome to GigitekAI</h4>
                <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-6">Your AI-powered technology partner. How can I help you today?</p>

                {/* Quick Action Buttons */}
                <div ref={actionsMenuRef} className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  <button
                    onClick={() => setShowAssessmentForm(true)}
                    disabled={isLoading}
                    className="p-2 sm:p-3 bg-gradient-to-br from-purple-600/30 to-purple-700/30 hover:from-purple-600/50 hover:to-purple-700/50 rounded-lg border border-purple-500/30 text-white text-[10px] sm:text-xs font-medium transition-[opacity,transform] disabled:opacity-50"
                  >
                    <div className="text-base sm:text-lg mb-0.5 sm:mb-1">🧠</div>
                    AI Assessment
                  </button>
                  <button
                    onClick={() => setShowMigrationForm(true)}
                    disabled={isLoading}
                    className="p-2 sm:p-3 bg-gradient-to-br from-cyan-600/30 to-cyan-700/30 hover:from-cyan-600/50 hover:to-cyan-700/50 rounded-lg border border-cyan-500/30 text-white text-[10px] sm:text-xs font-medium transition-[opacity,transform] disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">☁️</div>
                    Cloud Migration
                  </button>
                  <button
                    onClick={() => setShowAutomationForm(true)}
                    disabled={isLoading}
                    className="p-2 sm:p-3 bg-gradient-to-br from-amber-600/30 to-amber-700/30 hover:from-amber-600/50 hover:to-amber-700/50 rounded-lg border border-amber-500/30 text-white text-[10px] sm:text-xs font-medium transition-[opacity,transform] disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">⚡</div>
                    Automation
                  </button>
                  <button
                    onClick={() => setShowSecurityForm(true)}
                    disabled={isLoading}
                    className="p-2 sm:p-3 bg-gradient-to-br from-green-600/30 to-green-700/30 hover:from-green-600/50 hover:to-green-700/50 rounded-lg border border-green-500/30 text-white text-[10px] sm:text-xs font-medium transition-[opacity,transform] disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">🛡️</div>
                    Security Audit
                  </button>
                  <button
                    onClick={() => setShowBugForm(true)}
                    disabled={isLoading}
                    className="p-2 sm:p-3 bg-gradient-to-br from-red-600/30 to-red-700/30 hover:from-red-600/50 hover:to-red-700/50 rounded-lg border border-red-500/30 text-white text-[10px] sm:text-xs font-medium transition-[opacity,transform] disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">🐛</div>
                    Report a Bug
                  </button>
                  <button
                    onClick={() => setShowTicketForm(true)}
                    disabled={isLoading}
                    className="p-2 sm:p-3 bg-gradient-to-br from-blue-600/30 to-blue-700/30 hover:from-blue-600/50 hover:to-blue-700/50 rounded-lg border border-blue-500/30 text-white text-[10px] sm:text-xs font-medium transition-[opacity,transform] disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">📧</div>
                    Submit Ticket
                  </button>
                  <button
                    onClick={() => sendQuickMessage("I have a general question")}
                    disabled={isLoading}
                    className="p-2 sm:p-3 bg-gradient-to-br from-teal-600/30 to-teal-700/30 hover:from-teal-600/50 hover:to-teal-700/50 rounded-lg border border-teal-500/30 text-white text-[10px] sm:text-xs font-medium transition-[opacity,transform] disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">❓</div>
                    General Help
                  </button>
                  <button
                    onClick={() => setShowSpecialistForm(true)}
                    disabled={isLoading}
                    className="p-2 sm:p-3 bg-gradient-to-br from-indigo-600/30 to-indigo-700/30 hover:from-indigo-600/50 hover:to-indigo-700/50 rounded-lg border border-indigo-500/30 text-white text-[10px] sm:text-xs font-medium transition-[opacity,transform] disabled:opacity-50"
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
          )}

          {/* Scroll Down Button */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 right-6 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-2 shadow-lg transition-[opacity,transform]"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}

          {/* Input Area - Fixed at bottom */}
          {!isMinimized && (
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
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 transition-[opacity,transform] flex items-center gap-2 text-sm"
                >
                  <Square className="w-4 h-4" />
                  {recordingTime}s
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  disabled={isLoading}
                  className="bg-slate-700 hover:bg-slate-600 text-cyan-400 hover:text-cyan-300 rounded-lg px-3 py-2 transition-[opacity,transform] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Record voice message"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-slate-700 hover:bg-slate-600 text-cyan-400 hover:text-cyan-300 rounded-lg px-3 py-2 transition-[opacity,transform] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg px-3 py-2 transition-[opacity,transform] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          )}
          
          {/* Privacy Disclaimer */}
          <div className="bg-slate-800 border-t border-cyan-500/20 px-4 py-3 text-xs text-gray-400 leading-relaxed">
            <p>By chatting here, you agree we and authorized partners may process, monitor, and record this chat and your data in line with our <a href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</a>.</p>
          </div>
          
          {/* Powered by GigitekAI Footer */}
          <div className="bg-slate-900 border-t border-cyan-500/20 px-4 py-2 flex items-center justify-center gap-2 text-xs text-gray-400">
            <span>🚀 Powered by</span>
            <span className="font-semibold text-cyan-400">GigitekAI</span>
            <span>⚡</span>
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

      {/* Ticket Form Modal */}
      <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <span>📋</span> Create Support Ticket
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Fill out the form below to create a support ticket
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Step 1: Subject */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs">1</span>
                Subject
              </label>
              <Input
                placeholder="Brief description of your issue"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              {ticketFormErrors.subject && <p className="text-red-400 text-sm mt-1">{ticketFormErrors.subject}</p>}
            </div>

            {/* Step 2: Requester Name */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs">2</span>
                Your Name
              </label>
              <Input
                placeholder="John Smith"
                value={ticketForm.requesterName}
                onChange={(e) => setTicketForm({ ...ticketForm, requesterName: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              {ticketFormErrors.requesterName && <p className="text-red-400 text-sm mt-1">{ticketFormErrors.requesterName}</p>}
            </div>

            {/* Step 3: Email */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs">3</span>
                Email
              </label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={ticketForm.requesterEmail}
                onChange={(e) => setTicketForm({ ...ticketForm, requesterEmail: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              {ticketFormErrors.requesterEmail && <p className="text-red-400 text-sm mt-1">{ticketFormErrors.requesterEmail}</p>}
            </div>

            {/* Step 4: Tags */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs">4</span>
                Category
              </label>
              <Select value={ticketForm.tags} onValueChange={(value) => setTicketForm({ ...ticketForm, tags: value })}>
                <SelectTrigger className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-cyan-500/30">
                  <SelectItem value="chatbot">Chatbot Issue</SelectItem>
                  <SelectItem value="support">Support Request</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Step 5: Priority */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs">5</span>
                Priority
              </label>
              <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm({ ...ticketForm, priority: value })}>
                <SelectTrigger className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-cyan-500/30">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Step 6: Include Chat Transcript */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs">6</span>
                Include Chat Transcript
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTicketForm({ ...ticketForm, includeChatTranscript: !ticketForm.includeChatTranscript })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    ticketForm.includeChatTranscript ? "bg-cyan-600" : "bg-slate-700"
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    ticketForm.includeChatTranscript ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
                <span className="text-gray-400 text-sm">{ticketForm.includeChatTranscript ? "On" : "Off"}</span>
              </div>
            </div>

            {/* Step 7: Description */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs">7</span>
                Description
              </label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 min-h-[100px]"
              />
              {ticketFormErrors.description && <p className="text-red-400 text-sm mt-1">{ticketFormErrors.description}</p>}
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setShowTicketForm(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-400 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitTicket}
                disabled={ticketSubmitting}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                {ticketSubmitting ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assessment Form */}
      <Dialog open={showAssessmentForm} onOpenChange={setShowAssessmentForm}>
        <DialogContent className="bg-slate-900 border border-cyan-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">🧠 AI Assessment</DialogTitle>
            <DialogDescription>Tell us about your IT environment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white font-medium mb-2 block">What's your main IT challenge?</label>
              <Textarea
                placeholder="e.g., Legacy systems, cloud migration, security concerns..."
                value={assessmentForm.challenge}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, challenge: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              {formErrors.challenge && <p className="text-red-400 text-sm mt-1">{formErrors.challenge}</p>}
            </div>
            <div>
              <label className="text-white font-medium mb-2 block">Company size</label>
              <Select value={assessmentForm.companySize} onValueChange={(value) => setAssessmentForm({ ...assessmentForm, companySize: value })}>
                <SelectTrigger className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-cyan-500/30">
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="200+">200+ employees</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.companySize && <p className="text-red-400 text-sm mt-1">{formErrors.companySize}</p>}
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAssessmentForm(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => {
                  const errors: Record<string, string> = {};
                  if (!assessmentForm.challenge.trim()) errors.challenge = "Please describe your challenge";
                  if (!assessmentForm.companySize) errors.companySize = "Please select company size";
                  
                  if (Object.keys(errors).length > 0) {
                    setFormErrors(errors);
                    return;
                  }
                  
                  sendQuickMessage(`I need an AI assessment. Challenge: ${assessmentForm.challenge}. Company size: ${assessmentForm.companySize}`);
                  setShowAssessmentForm(false);
                  setAssessmentForm({ challenge: "", companySize: "" });
                  setFormErrors({});
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cloud Migration Form */}
      <Dialog open={showMigrationForm} onOpenChange={setShowMigrationForm}>
        <DialogContent className="bg-slate-900 border border-cyan-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">☁️ Cloud Migration</DialogTitle>
            <DialogDescription>Tell us about your migration needs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white font-medium mb-2 block">Current platform</label>
              <Select value={migrationForm.currentPlatform} onValueChange={(value) => setMigrationForm({ ...migrationForm, currentPlatform: value })}>
                <SelectTrigger className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-cyan-500/30">
                  <SelectItem value="on-prem">On-Premises</SelectItem>
                  <SelectItem value="aws">AWS</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                  <SelectItem value="gcp">Google Cloud</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-white font-medium mb-2 block">Target platform</label>
              <Select value={migrationForm.targetPlatform} onValueChange={(value) => setMigrationForm({ ...migrationForm, targetPlatform: value })}>
                <SelectTrigger className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-cyan-500/30">
                  <SelectItem value="aws">AWS</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                  <SelectItem value="gcp">Google Cloud</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-white font-medium mb-2 block">Timeline</label>
              <Select value={migrationForm.timeline} onValueChange={(value) => setMigrationForm({ ...migrationForm, timeline: value })}>
                <SelectTrigger className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-cyan-500/30">
                  <SelectItem value="asap">ASAP (1-3 months)</SelectItem>
                  <SelectItem value="3-6">3-6 months</SelectItem>
                  <SelectItem value="6-12">6-12 months</SelectItem>
                  <SelectItem value="12+">12+ months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowMigrationForm(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => {
                  if (migrationForm.currentPlatform && migrationForm.targetPlatform && migrationForm.timeline) {
                    sendQuickMessage(`I need cloud migration help. From: ${migrationForm.currentPlatform}, To: ${migrationForm.targetPlatform}, Timeline: ${migrationForm.timeline}`);
                    setShowMigrationForm(false);
                    setMigrationForm({ currentPlatform: "", targetPlatform: "", timeline: "" });
                  }
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Automation Form */}
      <Dialog open={showAutomationForm} onOpenChange={setShowAutomationForm}>
        <DialogContent className="bg-slate-900 border border-cyan-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">⚡ Automation</DialogTitle>
            <DialogDescription>What would you like to automate?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white font-medium mb-2 block">Process to automate</label>
              <Textarea
                placeholder="e.g., User provisioning, report generation, ticket routing..."
                value={automationForm.processToAutomate}
                onChange={(e) => setAutomationForm({ ...automationForm, processToAutomate: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white font-medium mb-2 block">Current tool (if any)</label>
              <Input
                placeholder="e.g., Manual process, Excel, existing software..."
                value={automationForm.currentTool}
                onChange={(e) => setAutomationForm({ ...automationForm, currentTool: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAutomationForm(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => {
                  if (automationForm.processToAutomate) {
                    sendQuickMessage(`I want to automate: ${automationForm.processToAutomate}. Current tool: ${automationForm.currentTool || "Manual"}`);
                    setShowAutomationForm(false);
                    setAutomationForm({ processToAutomate: "", currentTool: "" });
                  }
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Audit Form */}
      <Dialog open={showSecurityForm} onOpenChange={setShowSecurityForm}>
        <DialogContent className="bg-slate-900 border border-cyan-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">🛡️ Security Audit</DialogTitle>
            <DialogDescription>What's your security focus?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white font-medium mb-2 block">Focus area</label>
              <Select value={securityForm.focus} onValueChange={(value) => setSecurityForm({ ...securityForm, focus: value })}>
                <SelectTrigger className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-cyan-500/30">
                  <SelectItem value="compliance">Compliance (HIPAA, SOC 2, PCI-DSS)</SelectItem>
                  <SelectItem value="threat">Threat Detection & Prevention</SelectItem>
                  <SelectItem value="access">Access Control & Identity</SelectItem>
                  <SelectItem value="full">Full Security Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSecurityForm(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => {
                  if (securityForm.focus) {
                    sendQuickMessage(`I need a security audit focused on: ${securityForm.focus}`);
                    setShowSecurityForm(false);
                    setSecurityForm({ focus: "" });
                  }
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report a Bug Form */}
      <Dialog open={showBugForm} onOpenChange={setShowBugForm}>
        <DialogContent className="bg-slate-900 border border-cyan-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">🐛 Report a Bug</DialogTitle>
            <DialogDescription>Help us fix the issue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white font-medium mb-2 block">Bug description</label>
              <Textarea
                placeholder="What went wrong? What did you expect?"
                value={bugForm.description}
                onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white font-medium mb-2 block">Affected service</label>
              <Select value={bugForm.affectedService} onValueChange={(value) => setBugForm({ ...bugForm, affectedService: value })}>
                <SelectTrigger className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-cyan-500/30">
                  <SelectItem value="chat">Chat Widget</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="portal">Customer Portal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowBugForm(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => {
                  if (bugForm.description) {
                    sendQuickMessage(`Bug report: ${bugForm.description}. Affected service: ${bugForm.affectedService || "General"}`);
                    setShowBugForm(false);
                    setBugForm({ description: "", affectedService: "" });
                  }
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Talk to a Specialist Form */}
      <Dialog open={showSpecialistForm} onOpenChange={setShowSpecialistForm}>
        <DialogContent className="bg-slate-900 border border-cyan-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">📞 Schedule a Call</DialogTitle>
            <DialogDescription>Connect with a GigitekAI specialist</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white font-medium mb-2 block">Name</label>
              <Input
                placeholder="Your name"
                value={specialistForm.name}
                onChange={(e) => setSpecialistForm({ ...specialistForm, name: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white font-medium mb-2 block">Company</label>
              <Input
                placeholder="Your company"
                value={specialistForm.company}
                onChange={(e) => setSpecialistForm({ ...specialistForm, company: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white font-medium mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={specialistForm.email}
                onChange={(e) => setSpecialistForm({ ...specialistForm, email: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white font-medium mb-2 block">Reason for call</label>
              <Select value={specialistForm.reason} onValueChange={(value) => setSpecialistForm({ ...specialistForm, reason: value })}>
                <SelectTrigger className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-cyan-500/30">
                  <SelectItem value="m365">M365 support inquiry</SelectItem>
                  <SelectItem value="pricing">Pricing for help desk</SelectItem>
                  <SelectItem value="audit">AI Readiness Audit</SelectItem>
                  <SelectItem value="demo">Product demo</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSpecialistForm(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => {
                  if (specialistForm.name && specialistForm.email && specialistForm.reason) {
                    captureLead.mutate({
                      sessionId: sessionId || 'widget-' + Date.now(),
                      name: specialistForm.name,
                      email: specialistForm.email,
                      company: specialistForm.company,
                      interest: specialistForm.reason,
                    });
                    toast.success("Thanks! A specialist will contact you soon.");
                    setShowSpecialistForm(false);
                    setSpecialistForm({ name: "", company: "", email: "", reason: "" });
                  } else {
                    toast.error("Please fill in all required fields");
                  }
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Schedule Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  async function handleSubmitTicket() {
    // Validate form
    const errors: Record<string, string> = {};
    if (!ticketForm.subject.trim()) errors.subject = "Subject is required";
    if (!ticketForm.requesterName.trim()) errors.requesterName = "Name is required";
    if (!ticketForm.requesterEmail.trim()) errors.requesterEmail = "Email is required";
    if (!ticketForm.description.trim()) errors.description = "Description is required";

    if (Object.keys(errors).length > 0) {
      setTicketFormErrors(errors);
      return;
    }

    setTicketSubmitting(true);
    try {
      // Get chat transcript if enabled
      let transcript = "";
      if (ticketForm.includeChatTranscript) {
        transcript = messages.map(m => `${m.role === "user" ? "You" : "AI"}: ${m.message}`).join("\n\n");
      }

      // Create ticket via tRPC
      await sendMessageMutation.mutateAsync({
        sessionId: sessionId || `local-${Date.now()}`,
        message: `[TICKET_SUBMISSION] Subject: ${ticketForm.subject}\nName: ${ticketForm.requesterName}\nEmail: ${ticketForm.requesterEmail}\nCategory: ${ticketForm.tags}\nPriority: ${ticketForm.priority}\nDescription: ${ticketForm.description}${transcript ? `\n\nChat Transcript:\n${transcript}` : ""}`
      });

      toast.success("Ticket created successfully! We'll be in touch soon.");
      setShowTicketForm(false);
      setTicketForm({
        subject: "",
        requesterName: "",
        requesterEmail: "",
        tags: "chatbot",
        priority: "medium",
        includeChatTranscript: true,
        description: "",
      });
      setTicketFormErrors({});
    } catch (error) {
      toast.error("Failed to create ticket. Please try again.");
      console.error("Ticket submission error:", error);
    } finally {
      setTicketSubmitting(false);
    }
  }
}
