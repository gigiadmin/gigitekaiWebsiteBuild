import { useState } from "react";
import { MessageCircle, X, Trash2, Volume2, ChevronDown } from "lucide-react";

export default function AriaAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  const assistantOptions = [
    { icon: "🧠", label: "AI Assessment", color: "bg-purple-900" },
    { icon: "☁️", label: "Cloud Migration", color: "bg-cyan-900" },
    { icon: "⚡", label: "Automation", color: "bg-amber-900" },
    { icon: "🛡️", label: "Security Audit", color: "bg-green-900" },
    { icon: "🐛", label: "Report a Bug", color: "bg-red-900" },
    { icon: "📋", label: "Submit Ticket", color: "bg-blue-900" },
    { icon: "❓", label: "General Help", color: "bg-teal-900" },
    { icon: "📞", label: "Call Now", color: "bg-purple-800" },
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-2xl flex flex-col max-h-[600px] backdrop-blur-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 p-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                💬
              </div>
              <div>
                <h3 className="font-semibold text-white">GigitekAI Assistant</h3>
                <p className="text-xs text-cyan-300">AI-powered support • Always online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-slate-800 rounded transition-colors">
                <Volume2 className="w-4 h-4 text-slate-400" />
              </button>
              <button className="p-1 hover:bg-slate-800 rounded transition-colors">
                <Trash2 className="w-4 h-4 text-slate-400" />
              </button>
              <button className="p-1 hover:bg-slate-800 rounded transition-colors">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Welcome Message */}
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-white text-center">
                Welcome to GigitekAI
              </h2>
              <p className="text-sm text-slate-300 text-center">
                Your AI-powered technology partner. How can I help you today?
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3">
              {assistantOptions.map((option, i) => (
                <button
                  key={i}
                  disabled
                  className={`${option.color} p-4 rounded-lg text-center space-y-2 opacity-60 cursor-not-allowed transition-all hover:opacity-70`}
                >
                  <div className="text-2xl">{option.icon}</div>
                  <div className="text-xs font-medium text-white">{option.label}</div>
                </button>
              ))}
            </div>

            {/* Coming Soon Message */}
            <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-4 text-center space-y-2">
              <p className="text-sm text-cyan-300 font-semibold">
                🚀 Powered by GigitekAI
              </p>
              <p className="text-xs text-slate-400">
                Full Aria AI Assistant launching soon. Stay tuned!
              </p>
            </div>
          </div>

          {/* Chat Input (Disabled) */}
          <div className="border-t border-slate-700 p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask anything... (Coming Soon)"
                disabled
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 placeholder:text-slate-600 cursor-not-allowed opacity-50"
              />
              <button
                disabled
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg p-2 cursor-not-allowed opacity-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Chat functionality coming with official launch
            </p>
          </div>
        </div>
      )}
    </>
  );
}
