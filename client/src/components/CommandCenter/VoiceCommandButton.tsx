import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { useToast } from "@/components/ui/use-toast"; // Not available
import { trpc } from "@/lib/trpc";

interface VoiceCommandButtonProps {
  onCommand: (input: string) => void;
  isListening?: boolean;
}

/**
 * Voice Command Button Component
 * Captures speech input, converts to text, and triggers command execution
 * Uses Web Speech API (Chrome, Edge, Safari)
 */
export function VoiceCommandButton({ onCommand, isListening = false }: VoiceCommandButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  // const { toast } = useToast();

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[VoiceCommand] Web Speech API not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcriptSegment + " ";
        } else {
          interimTranscript += transcriptSegment;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      // Auto-execute on final result
      if (finalTranscript) {
        const cleanedInput = finalTranscript.trim();
        onCommand(cleanedInput);
        speakFeedback(`Executing: ${cleanedInput}`);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("[VoiceCommand] Recognition error:", event.error);
      console.error("Voice Recognition Error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onCommand]);

  /**
   * Start listening for voice input
   */
  const startListening = () => {
    if (!recognitionRef.current) {
      console.error("Voice commands not supported in this browser");
      return;
    }

    setTranscript("");
    recognitionRef.current.start();
    speakFeedback("Listening...");
  };

  /**
   * Stop listening
   */
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsRecording(false);
    }
  };

  /**
   * Text-to-speech feedback
   */
  const speakFeedback = (text: string) => {
    if (!("speechSynthesis" in window)) {
      console.warn("[VoiceCommand] Speech Synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={isRecording ? stopListening : startListening}
        variant={isRecording ? "destructive" : "outline"}
        size="sm"
        className="gap-2"
        title={isRecording ? "Stop listening" : "Start voice command"}
      >
        {isRecording ? (
          <>
            <MicOff className="w-4 h-4 animate-pulse" />
            Stop
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Voice
          </>
        )}
      </Button>

      {isSpeaking && (
        <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
      )}

      {transcript && (
        <span className="text-xs text-slate-400 truncate max-w-xs">
          {transcript}
        </span>
      )}
    </div>
  );
}
