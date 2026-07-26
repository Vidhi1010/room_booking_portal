import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowRight, ArrowLeft, Bed, Loader2 } from "lucide-react";
import { defaultTheme } from "./themes";
import { API_BASE } from "./config";

const ROOM_ICONS = {
  "2bed": "🛏️🛏️",
  "2+1bed": "🛏️🛏️ + 🛏️",
  "4bed": "🛏️🛏️🛏️🛏️",
  "6bed": "🏠",
};

const ROOM_LABELS = {
  "2bed": "Private Double with Prasadam",
  "2+1bed": "Triple Room with Prasadam",
  "4bed": "Quad Room with Prasadam",
  "6bed": "Dormitory with Prasadam",
};

export default function RoomSelection() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const theme = defaultTheme;

  useEffect(() => {
    fetch(`${API_BASE}/get-rooms`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch rooms");
        return res.json();
      })
      .then((data) => {
        const roomList = Array.isArray(data) ? data : data.rooms || data.body || [];
        setRooms(roomList);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    const room = rooms.find((r) => r.room_type === selected);
    navigate("/checkout", { state: { room } });
  };

  return (
    <div
      className="min-h-screen relative"
      style={{ ...theme.cssVars, backgroundColor: "var(--t-bg)", color: "var(--t-text)" }}
    >
      {/* back button */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm font-medium transition-colors duration-200"
          style={{ color: "var(--t-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-muted)")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-4"
          >
            <Bed className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-accent-tag)" }}>
              Step 1 of 2
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            Select Your{" "}
            <span
              style={{
                background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Room
            </span>
          </h1>
          <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: "var(--t-text-muted)" }}>
            Choose the accommodation that suits you best. Prices shown are per person per night.
          </p>
        </motion.div>

        {/* loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        )}

        {/* error */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-full bg-amber-500 text-white font-semibold text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* room cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {rooms.map((room, i) => {
              const isSelected = selected === room.room_type;
              const soldOut = room.inventory <= 0;
              return (
                <motion.button
                  key={room.room_type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  disabled={soldOut}
                  onClick={() => setSelected(room.room_type)}
                  className={`relative text-left p-6 rounded-2xl transition-all duration-300 ${
                    soldOut ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02]"
                  }`}
                  style={{
                    border: isSelected
                      ? "2px solid var(--t-accent-from)"
                      : "1px solid var(--t-border-strong)",
                    backgroundColor: isSelected ? "var(--t-card-tint)" : "transparent",
                    boxShadow: isSelected ? "0 0 30px var(--t-glow1)" : "none",
                  }}
                >
                  {/* selected badge */}
                  {isSelected && (
                    <div
                      className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white"
                      style={{ background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))` }}
                    >
                      Selected
                    </div>
                  )}

                  {/* sold out badge */}
                  {soldOut && (
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                      Sold Out
                    </div>
                  )}

                  {/* room image */}
                  {room.img && (
                    <div className="w-full rounded-xl overflow-hidden mb-4">
                      <img
                        src={room.img}
                        alt={room.name}
                        className="w-full h-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* name & label */}
                  <h3 className="text-lg font-bold">{room.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted)" }}>
                    {ROOM_LABELS[room.room_type] || room.room_type}
                  </p>

                  {/* details row */}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" style={{ color: "var(--t-accent-from)" }} />
                      <span className="text-sm font-medium">Up to {room.capacity}</span>
                    </div>
                    <div
                      className="text-xl font-black"
                      style={{
                        background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      ₹{room.price}
                      <span className="text-xs font-medium" style={{ WebkitTextFillColor: "var(--t-text-muted)" }}>
                        /person
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* continue button */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex justify-center"
          >
            <button
              onClick={handleContinue}
              disabled={!selected}
              className={`group flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-lg transition-all duration-300 ${
                selected
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105"
                  : "bg-gray-300 cursor-not-allowed opacity-50"
              }`}
            >
              Continue to Checkout
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
