import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle } from "lucide-react";
import { API_BASE } from "./config";

const QUICK_QUESTIONS = [
  { label: "📋 Booking Status", action: "booking_status" },
  { 
    label: "🏠 Room Options",
    answer: "🏠 Available Room Types:\n\n🛏️ Twin Bed Room (2 bed)\n🛏️ 2+1 Bed Room (3 bed)\n👨‍👩‍👧‍👦 Family Room (4 bed)\n🏢 Dormitory (6 bed)\n\n💡 Price: ₹3,500 – ₹5,500 per person\n✅ All include Accommodation, Prasadam & Internal Travel"
  },
  {
    label: "📅 Yatra Dates",
    answer: "📅 ISKCON Vrindavan Dham Yatra 2026\n\n📍 Dates: 2nd Oct (9 AM) → 4th Oct (5 PM)\n⏳ Duration: 3 Days\n🔒 Registration Deadline: 15th Sept 2026\n\n⚡ Seats are limited — register early!"
  },
  {
    label: "💰 Pricing",
    answer: "💰 Yatra Pricing (per person):\n\n🏢 Dormitory — ₹3,500\n👨‍👩‍👧‍👦 Family / 2+1 Bed — ₹4,500\n🛏️ Twin Bed — ₹5,500\n\n✅ Includes: Accommodation + Prasadam + Internal Travel\n🚌 Delhi ↔ Vraj Transport: ₹800 extra\n\n💡 Book with just ₹2,000 advance!"
  },
  {
    label: "🚌 Transport",
    answer: "🚌 Transport Details:\n\n✅ Delhi ↔ Vraj round-trip AC bus\n💰 Cost: ₹800 per person\n📍 Internal travel within Vraj is included in all packages\n\n🗺️ Covers: Vrindavan, Mathura, Govardhan & Barsana"
  },
];

const BOOKING_KEYWORDS = [
  "booking", "status", "payment", "booked", "paid",
  "remaining", "balance", "mera booking", "meri booking",
  "registration", "confirm", "kitna bacha", "kitna dena",
];

function isBookingQuery(message) {
  const lower = message.toLowerCase();
  return BOOKING_KEYWORDS.some((k) => lower.includes(k));
}

function formatBooking(booking) {
  const paid = booking.amount_paid || 0;
  const total = booking.total_amount || 0;
  const remaining = total - paid;
  const lines = [
    `🏠 Room: ${booking.room_name || booking.room_type || "—"}`,
    `👥 Occupants: ${booking.total_occupants || 1}`,
    `💰 Total: ₹${total}`,
    `✅ Paid: ₹${paid}`,
    remaining > 0 ? `⏳ Remaining: ₹${remaining}` : null,
    `📌 Status: ${(booking.status || "pending").replace(/_/g, " ")}`,
  ];
  const text = lines.filter(Boolean).join("\n");

  if (booking.status !== "fully_paid" && booking.id) {
    const payUrl = `${window.location.origin}/checkout?booking_id=${booking.id}`;
    return { text: text + "\n\n💳 Complete your payment here:", link: payUrl };
  }
  return { text };
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hare Krishna! 🙏 Ask me anything about Kartik Vraj Yatra 2026." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingPhone, setAwaitingPhone] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addBot = (text, link) => setMessages((m) => [...m, { role: "bot", text, link }]);
  const addUser = (text) => setMessages((m) => [...m, { role: "user", text }]);

  const fetchBookingStatus = async (phone) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get-booking?contact_number=${encodeURIComponent(phone)}`);
      if (!res.ok) { addBot("No booking found for this number. Please check and try again."); return; }
      const data = await res.json();
      const bookings = data.bookings || (Array.isArray(data) ? data : []);
      if (!bookings.length) { addBot("No booking found for this number. Please check and try again."); return; }
      const parts = bookings.map((b, i) => {
        const formatted = formatBooking(b);
        return { text: (bookings.length > 1 ? `— Booking ${i + 1} —\n` : "") + formatted.text, link: formatted.link };
      });
      const combinedText = parts.map((p) => p.text).join("\n\n");
      const firstLink = parts.find((p) => p.link)?.link;
      addBot(combinedText, firstLink);
    } catch {
      addBot("Something went wrong while fetching your booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendToApi = async (question) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      addBot(data.answer || data.response || "Sorry, I couldn't understand that.");
    } catch {
      addBot("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q) => {
    if (loading) return;
    if (q.action === "booking_status") {
      addUser("What is my booking status?");
      addBot("Please enter your 10-digit phone number used during registration:");
      setAwaitingPhone(true);
      return;
    }
    addUser(q.label);
    if (q.answer) {
      addBot(q.answer);
      return;
    }
    sendToApi(q.question);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    addUser(text);
    setInput("");

    if (awaitingPhone) {
      const phone = text.replace(/\D/g, "");
      if (phone.length < 10) {
        addBot("That doesn't look like a valid phone number. Please enter a 10-digit number:");
        return;
      }
      setAwaitingPhone(false);
      await fetchBookingStatus(phone);
      return;
    }

    if (isBookingQuery(text)) {
      addBot("Please enter your 10-digit phone number used during registration:");
      setAwaitingPhone(true);
      return;
    }

    await sendToApi(text);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {open && (
        <div
          className="flex flex-col shadow-2xl rounded-2xl overflow-hidden"
          style={{
            width: 360,
            maxWidth: "calc(100vw - 48px)",
            height: 520,
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
                  {msg.link && (
                    <a
                      href={msg.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-white no-underline hover:scale-105 transition-transform"
                    >
                      Complete Payment →
                    </a>
                  )}
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

          {/* quick questions */}
          <div className="px-3 pt-2 overflow-x-auto chatbot-no-scrollbar" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex gap-2 w-max">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => handleQuickQuestion(q)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all hover:scale-105 disabled:opacity-40"
                  style={{ backgroundColor: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* input */}
          <div className="px-3 py-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={awaitingPhone ? "Enter phone number..." : "Ask about the yatra..."}
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
        .chatbot-no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .chatbot-no-scrollbar::-webkit-scrollbar { display: none; }
        .chatbot-tooltip {
          animation: tooltipFade 4s ease-in-out forwards;
        }
        @keyframes tooltipFade {
          0% { opacity: 0; transform: translateX(8px); }
          10% { opacity: 1; transform: translateX(0); }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* floating toggle button */}
      {!open && (
        <div className="flex items-center gap-2">
          {showTooltip && (
            <span
              className="chatbot-tooltip px-3 py-2 rounded-xl text-xs font-medium shadow-lg whitespace-nowrap"
              style={{ backgroundColor: "#fff", color: "#333", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
            >
              Need help with the yatra? 🙏
            </span>
          )}
          <button
            onClick={() => { setOpen(true); setShowTooltip(false); }}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
