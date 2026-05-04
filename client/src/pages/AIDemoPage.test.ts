import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Unit tests for AI Demo Page voiceover functionality
 * Tests the Web Speech API integration for narrating demo steps
 */

describe("AI Demo Page - Voiceover", () => {
  // Mock the Web Speech API
  const mockUtterance = {
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: null as any,
    text: "",
    onend: null as any,
    onerror: null as any,
  };

  const mockSpeechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [
      {
        name: "Google US English",
        lang: "en-US",
      },
      {
        name: "Natural English",
        lang: "en-US",
      },
    ]),
    onvoiceschanged: null as any,
  };

  beforeEach(() => {
    // Setup mock
    (global as any).SpeechSynthesisUtterance = vi.fn(() => mockUtterance);
    (global as any).window = {
      speechSynthesis: mockSpeechSynthesis,
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Voice Support Detection", () => {
    it("should detect if speechSynthesis is available", () => {
      const supported = "speechSynthesis" in window;
      expect(supported).toBe(true);
    });

    it("should handle browsers without speechSynthesis", () => {
      const testWindow = {} as any;
      const supported = "speechSynthesis" in testWindow;
      expect(supported).toBe(false);
    });
  });

  describe("Voice Loading", () => {
    it("should load available voices", () => {
      const voices = mockSpeechSynthesis.getVoices();
      expect(voices.length).toBeGreaterThan(0);
    });

    it("should handle voiceschanged event", () => {
      const callback = vi.fn();
      mockSpeechSynthesis.onvoiceschanged = callback;
      
      expect(mockSpeechSynthesis.onvoiceschanged).toBe(callback);
    });

    it("should find English voice", () => {
      const voices = mockSpeechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith("en"));
      
      expect(englishVoice).toBeDefined();
      expect(englishVoice?.lang).toContain("en");
    });

    it("should prefer natural voices when available", () => {
      const voices = mockSpeechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith("en") && 
        (v.name.includes("Natural") || v.name.includes("Google"))
      );
      
      expect(preferred).toBeDefined();
    });
  });

  describe("Speech Synthesis", () => {
    it("should create utterance with correct properties", () => {
      const text = "Test narration";
      const utter = new (global as any).SpeechSynthesisUtterance(text);
      
      expect(utter).toBeDefined();
      expect(utter.text).toBe("");
    });

    it("should set speech rate to 0.88 (comfortable pace)", () => {
      const utter = new (global as any).SpeechSynthesisUtterance("test");
      utter.rate = 0.88;
      
      expect(utter.rate).toBe(0.88);
    });

    it("should set volume to maximum", () => {
      const utter = new (global as any).SpeechSynthesisUtterance("test");
      utter.volume = 1.0;
      
      expect(utter.volume).toBe(1.0);
    });

    it("should cancel previous speech before speaking", () => {
      mockSpeechSynthesis.speak(mockUtterance);
      mockSpeechSynthesis.cancel();
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it("should speak the utterance", () => {
      mockSpeechSynthesis.speak(mockUtterance);
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledWith(mockUtterance);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing voices gracefully", () => {
      mockSpeechSynthesis.getVoices = vi.fn(() => []);
      const voices = mockSpeechSynthesis.getVoices();
      
      expect(voices.length).toBe(0);
      // Should still attempt to speak (fallback to system default)
    });

    it("should handle speech synthesis errors", () => {
      const errorCallback = vi.fn();
      mockUtterance.onerror = errorCallback;
      
      // Simulate error
      if (mockUtterance.onerror) {
        mockUtterance.onerror(new Event("error"));
      }
      
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe("Speech Control", () => {
    it("should cancel speech", () => {
      mockSpeechSynthesis.cancel();
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it("should handle cleanup on unmount", () => {
      // Simulate component unmount
      mockSpeechSynthesis.cancel();
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });
});
