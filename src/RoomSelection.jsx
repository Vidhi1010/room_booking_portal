import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ArrowRight, ArrowLeft, Bed, Loader2, UserPlus, Trash2, Bus } from "lucide-react";
import { defaultTheme } from "./themes";
import { API_BASE } from "./config";

const GENDER_OPTIONS = ["Male", "Female"];

const ROOM_LABELS = {
  "2bed": "Private Double with Prasadam and Internal Travel",
  "2+1bed": "Triple Room with Prasadam and Internal Travel",
  "4bed": "Quad Room with Prasadam and Internal Travel",
  "6bed": "Dormitory with Prasadam and Internal Travel",
};

const INPUT_STYLE = {
  backgroundColor: "var(--t-card-tint)",
  border: "1px solid var(--t-border-strong)",
  color: "var(--t-text)",
};

function InputField({ label, value, onChange, type = "text", placeholder, error, required }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/30 ${error ? "ring-2 ring-red-400/50" : ""}`}
        style={INPUT_STYLE}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, error, required }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/30 ${error ? "ring-2 ring-red-400/50" : ""}`}
        style={INPUT_STYLE}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function AutocompleteField({ label, value, onChange, suggestions, placeholder, error }) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const q = value.toLowerCase();
      setFiltered(suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8));
    } else {
      setFiltered([]);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/30 ${error ? "ring-2 ring-red-400/50" : ""}`}
        style={INPUT_STYLE}
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-xl shadow-lg text-sm"
          style={{ backgroundColor: "var(--t-bg)", border: "1px solid var(--t-border-strong)" }}
        >
          {filtered.map((item) => (
            <li
              key={item}
              onClick={() => { onChange(item); setOpen(false); }}
              className="px-4 py-2.5 cursor-pointer transition-colors hover:bg-amber-500/10"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const emptyMember = () => ({
  name: "",
  contact_number: "",
  age: "",
  gender: "",
  chanting_rounds: "",
  facilitator_name: "",
});

export default function RoomSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = defaultTheme;

  // Restore state if coming back from checkout
  const savedState = location.state;

  // rooms
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(savedState?.room?.room_type || null);

  // primary user form
  const [primary, setPrimary] = useState(savedState?.primary || {
    name: "",
    age: "",
    contact_number: "",
    gender: "",
    chanting_rounds: "",
    preaching_area_connected: "",
    facilitator_name: "",
    preferred_room_partner: "",
  });

  // additional members
  const [members, setMembers] = useState(savedState?.members || []);

  // transport
  const [transportOptions, setTransportOptions] = useState([]);
  const [transportOpted, setTransportOpted] = useState(savedState?.transportOpted || false);
  const [selectedTransport, setSelectedTransport] = useState(savedState?.selectedTransport || null);

  // user names for room partner autocomplete
  const [userNames, setUserNames] = useState([]);

  // validation
  const [errors, setErrors] = useState({});

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

    fetch(`${API_BASE}/get-transport`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : data.transport || data.body || [];
        setTransportOptions(list);
        if (!savedState?.selectedTransport && list.length === 1) setSelectedTransport(list[0]);
      })
      .catch(() => {});

    fetch(`${API_BASE}/get-users`)
      .then((res) => res.ok ? res.json() : { users: [] })
      .then((data) => {
        const names = Array.isArray(data?.users) ? data.users : [];
        setUserNames(names);
      })
      .catch(() => {});
  }, []);

  const selectedRoom = rooms.find((r) => r.room_type === selectedRoomType);
  const maxMembers = selectedRoom ? selectedRoom.capacity - 1 : 0;

  const updatePrimary = (field, value) => {
    setPrimary((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const addMember = () => {
    if (members.length >= maxMembers) return;
    setMembers((m) => [...m, emptyMember()]);
  };

  const updateMember = (index, field, value) => {
    setMembers((m) => m.map((mem, i) => (i === index ? { ...mem, [field]: value } : mem)));
    if (errors[`member_${index}_${field}`]) {
      setErrors((e) => ({ ...e, [`member_${index}_${field}`]: null }));
    }
  };

  const removeMember = (index) => {
    setMembers((m) => m.filter((_, i) => i !== index));
  };

  // trim members if room capacity changes
  useEffect(() => {
    if (selectedRoom && members.length > selectedRoom.capacity - 1) {
      setMembers((m) => m.slice(0, selectedRoom.capacity - 1));
    }
  }, [selectedRoomType]);

  const validate = () => {
    const errs = {};
    if (!primary.name.trim()) errs.name = "Required";
    if (!primary.age || primary.age < 1 || primary.age > 120) errs.age = "Valid age required";
    if (!primary.contact_number.trim() || primary.contact_number.length < 10)
      errs.contact_number = "Valid phone required";
    if (!primary.gender) errs.gender = "Required";
    if (primary.chanting_rounds === "" || primary.chanting_rounds < 0)
      errs.chanting_rounds = "Required";
    if (!primary.preaching_area_connected.trim())
      errs.preaching_area_connected = "Required";
    if (!primary.facilitator_name.trim())
      errs.facilitator_name = "Required";
    if (!selectedRoomType) errs.room = "Please select a room";

    members.forEach((m, i) => {
      if (!m.name.trim()) errs[`member_${i}_name`] = "Required";
      if (!m.age || m.age < 1 || m.age > 120) errs[`member_${i}_age`] = "Valid age required";
      if (!m.contact_number.trim() || m.contact_number.length < 10)
        errs[`member_${i}_contact_number`] = "Valid phone required";
      if (!m.gender) errs[`member_${i}_gender`] = "Required";
      if (m.chanting_rounds === "" || m.chanting_rounds < 0)
        errs[`member_${i}_chanting_rounds`] = "Required";
      if (!m.facilitator_name.trim()) errs[`member_${i}_facilitator_name`] = "Required";
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    navigate("/checkout", {
      state: {
        room: selectedRoom,
        primary,
        members,
        transportOpted,
        selectedTransport,
      },
    });
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-4">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-accent-tag)" }}>
              Registration
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            Register for{" "}
            <span
              style={{
                background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Vraj Yatra
            </span>
          </h1>
          <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: "var(--t-text-muted)" }}>
            Fill in your details and select your preferred room to proceed.
          </p>
        </motion.div>

        {/* ── Section 1: Primary Guest Details ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))` }}
            >
              1
            </span>
            Primary Guest
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <InputField label="Full Name" value={primary.name} onChange={(v) => updatePrimary("name", v)} placeholder="Enter your name" error={errors.name} required />
            <InputField label="Age" type="number" value={primary.age} onChange={(v) => updatePrimary("age", v)} placeholder="Age" error={errors.age} required />
            <InputField label="Contact Number" type="tel" value={primary.contact_number} onChange={(v) => updatePrimary("contact_number", v)} placeholder="10-digit phone" error={errors.contact_number} required />
            <SelectField label="Gender" value={primary.gender} onChange={(v) => updatePrimary("gender", v)} options={GENDER_OPTIONS} error={errors.gender} required />
            <InputField label="Chanting Rounds" type="number" value={primary.chanting_rounds} onChange={(v) => updatePrimary("chanting_rounds", v)} placeholder="Daily rounds" error={errors.chanting_rounds} required />
            <SelectField label="Preaching Area" value={primary.preaching_area_connected} onChange={(v) => updatePrimary("preaching_area_connected", v)} options={["Gita Essence", "ISKCON Jia Sarai", "ISKCON Srinagar", "Siksharthakam"]} error={errors.preaching_area_connected} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <InputField label="Facilitator Name" value={primary.facilitator_name} onChange={(v) => updatePrimary("facilitator_name", v)} placeholder="Enter facilitator name" error={errors.facilitator_name} required />
            <AutocompleteField label="Preferred Room Partner" value={primary.preferred_room_partner} onChange={(v) => updatePrimary("preferred_room_partner", v)} suggestions={userNames} placeholder="Start typing a name..." />
          </div>
        </motion.div>

        {/* divider */}
        <div className="h-px mb-8" style={{ backgroundColor: "var(--t-border)" }} />

        {/* ── Section 2: Room Selection ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))` }}
            >
              2
            </span>
            Select Your Room
          </h2>
          {errors.room && (
            <p className="text-red-500 text-sm mb-4">{errors.room}</p>
          )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              {rooms.map((room, i) => {
                const isSelected = selectedRoomType === room.room_type;
                const soldOut = room.inventory <= 0;
                return (
                  <motion.button
                    key={room.room_type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    disabled={soldOut}
                    onClick={() => setSelectedRoomType(room.room_type)}
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
                    {isSelected && (
                      <div
                        className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white"
                        style={{ background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))` }}
                      >
                        Selected
                      </div>
                    )}
                    {soldOut && (
                      <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                        Sold Out
                      </div>
                    )}
                    {room.img && (
                      <div className="w-full rounded-xl overflow-hidden mb-4">
                        <img src={room.img} alt={room.name} className="w-full h-auto object-contain" loading="lazy" />
                      </div>
                    )}
                    <h3 className="text-lg font-bold">{room.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted)" }}>
                      {ROOM_LABELS[room.room_type] || room.room_type}
                    </p>
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
        </motion.div>

        {/* divider */}
        <div className="h-px mb-8" style={{ backgroundColor: "var(--t-border)" }} />

        {/* ── Section 3: Additional Members ── */}
        {selectedRoom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))` }}
                >
                  3
                </span>
                Additional Members
                <span className="text-sm font-normal" style={{ color: "var(--t-text-muted)" }}>
                  ({members.length}/{maxMembers})
                </span>
              </h2>
              {members.length < maxMembers && (
                <button
                  type="button"
                  onClick={addMember}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: "var(--t-card-tint)",
                    border: "1px solid var(--t-border-strong)",
                    color: "var(--t-accent-from)",
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </button>
              )}
            </div>

            {members.length === 0 && (
              <p className="text-sm py-6 text-center rounded-2xl mb-8" style={{ color: "var(--t-text-faint)", backgroundColor: "var(--t-card-tint)" }}>
                No additional members added. You can add up to {maxMembers} more.
              </p>
            )}

            <AnimatePresence>
              {members.map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-5 rounded-2xl"
                  style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold">Member {i + 2}</h3>
                    <button type="button" onClick={() => removeMember(i)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Full Name" value={member.name} onChange={(v) => updateMember(i, "name", v)} placeholder="Member name" error={errors[`member_${i}_name`]} required />
                    <InputField label="Age" type="number" value={member.age} onChange={(v) => updateMember(i, "age", v)} placeholder="Age" error={errors[`member_${i}_age`]} required />
                    <InputField label="Contact Number" type="tel" value={member.contact_number} onChange={(v) => updateMember(i, "contact_number", v)} placeholder="10-digit phone" error={errors[`member_${i}_contact_number`]} required />
                    <SelectField label="Gender" value={member.gender} onChange={(v) => updateMember(i, "gender", v)} options={GENDER_OPTIONS} error={errors[`member_${i}_gender`]} required />
                    <InputField label="Chanting Rounds" type="number" value={member.chanting_rounds} onChange={(v) => updateMember(i, "chanting_rounds", v)} placeholder="Daily rounds" error={errors[`member_${i}_chanting_rounds`]} required />
                    <InputField label="Facilitator Name" value={member.facilitator_name} onChange={(v) => updateMember(i, "facilitator_name", v)} placeholder="Enter facilitator name" error={errors[`member_${i}_facilitator_name`]} required />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* divider */}
            <div className="h-px mb-8" style={{ backgroundColor: "var(--t-border)" }} />
          </motion.div>
        )}

        {/* ── Section 4: Transport ── */}
        {transportOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))` }}
              >
                {selectedRoom ? "4" : "3"}
              </span>
              Transport
            </h2>
            {transportOptions.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (transportOpted && selectedTransport === t) {
                    setTransportOpted(false);
                    setSelectedTransport(null);
                  } else {
                    setTransportOpted(true);
                    setSelectedTransport(t);
                  }
                }}
                className="w-full flex items-center justify-between p-5 rounded-2xl transition-all duration-300"
                style={{
                  border: transportOpted && selectedTransport === t
                    ? "2px solid var(--t-accent-from)"
                    : "1px solid var(--t-border-strong)",
                  backgroundColor: transportOpted && selectedTransport === t
                    ? "var(--t-card-tint)"
                    : "transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <Bus className="w-5 h-5" style={{ color: "var(--t-accent-from)" }} />
                  <div className="text-left">
                    <p className="font-bold">{t.name}</p>
                    <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>per person · Delhi to Vraj - round trip</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black" style={{ color: "var(--t-accent-from)" }}>₹{t.price}</span>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: transportOpted && selectedTransport === t ? "var(--t-accent-from)" : "var(--t-border-strong)",
                    }}
                  >
                    {transportOpted && selectedTransport === t && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--t-accent-from)" }} />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {/* continue button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex justify-center"
        >
          <button
            onClick={handleContinue}
            className="group flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-lg transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105"
          >
            Continue to Checkout
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
