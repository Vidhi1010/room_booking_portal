import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle } from "lucide-react";
import { API_BASE } from "./config";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hare Krishna! 🙏 Ask me anything about Kartik Vraj Yatra 2026." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setMessages((m) => [...m, { role: "bot", text: data.answer || data.response || "Sorry, I couldn't understand that." }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {open && (
        <div
          className="flex flex-col shadow-2xl rounded-2xl overflow-hidden"
          style={{
            width: 360,
            maxWidth: "calc(100vw - 48px)",
            height: 480,
            maxHeight: "calc(100vh - 100px)",
            backgroundColor: "#1a1a2e",
            border: "1px solid rgba(251,191,36,0.2)",
          }}
        >
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600">
            <span className="text-white font-bold text-sm">Yatra Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { backgroundColor: "rgba(251,191,36,0.15)", color: "#fbbf24", borderBottomRightRadius: 4 }
                      : { backgroundColor: "rgba(255,255,255,0.08)", color: "#e5e5e5", borderBottomLeftRadius: 4 }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-3 rounded-2xl flex items-center gap-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-amber-400"
                      style={{
                        animation: "typingDot 1.4s infinite",
                        animationDelay: `${i * 0.2}s`,
                        opacity: 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* input */}
          <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about the yatra..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#e5e5e5", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white disabled:opacity-40 transition-all hover:scale-105"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>

      {/* floating toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
