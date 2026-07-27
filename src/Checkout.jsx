import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  UserPlus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Bed,
  Bus,
  ExternalLink,
} from "lucide-react";
import { defaultTheme } from "./themes";
import { API_BASE } from "./config";

const GENDER_OPTIONS = ["Male", "Female"];

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
});

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const room = location.state?.room;
  const theme = defaultTheme;

  // scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // redirect if no room selected
  if (!room) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ ...theme.cssVars, backgroundColor: "var(--t-bg)", color: "var(--t-text)" }}
      >
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: "var(--t-text-muted)" }}>
            No room selected.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold"
          >
            Select a Room
          </button>
        </div>
      </div>
    );
  }

  const maxMembers = room.capacity - 1; // primary user takes 1 slot

  // primary user form
  const [primary, setPrimary] = useState({
    name: "",
    age: "",
    contact_number: "",
    gender: "",
    chanting_rounds: "",
    preaching_area_connected: "",
    preferred_room_partner: "",
  });

  // additional members
  const [members, setMembers] = useState([]);

  // transport
  const [transportOptions, setTransportOptions] = useState([]);
  const [transportOpted, setTransportOpted] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState(null);

  // user names for room partner autocomplete
  const [userNames, setUserNames] = useState([]);

  // fetch transport options
  useEffect(() => {
    fetch(`${API_BASE}/get-transport`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : data.transport || data.body || [];
        setTransportOptions(list);
        if (list.length === 1) setSelectedTransport(list[0]);
      })
      .catch(() => {});

    // fetch user names
    fetch(`${API_BASE}/get-users`)
      .then((res) => res.ok ? res.json() : { users: [] })
      .then((data) => {
        const names = Array.isArray(data?.users) ? data.users : [];
        setUserNames(names);
      })
      .catch(() => {});
  }, []);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { success: bool, message: string }
  const [errors, setErrors] = useState({});
  const [bookingId, setBookingId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [polling, setPolling] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const RAZORPAY_LINK = "https://razorpay.me/@govindam-tkb";

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

    members.forEach((m, i) => {
      if (!m.name.trim()) errs[`member_${i}_name`] = "Required";
      if (!m.age || m.age < 1 || m.age > 120) errs[`member_${i}_age`] = "Valid age required";
      if (!m.contact_number.trim() || m.contact_number.length < 10)
        errs[`member_${i}_contact_number`] = "Valid phone required";
      if (!m.gender) errs[`member_${i}_gender`] = "Required";
      if (m.chanting_rounds === "" || m.chanting_rounds < 0)
        errs[`member_${i}_chanting_rounds`] = "Required";
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setResult(null);

    const payload = {
      name: primary.name.trim(),
      age: Number(primary.age),
      contact_number: primary.contact_number.trim(),
      gender: primary.gender,
      chanting_rounds: Number(primary.chanting_rounds),
      preaching_area_connected: primary.preaching_area_connected.trim(),
      preferred_room_partner: primary.preferred_room_partner.trim() || undefined,
      room_id: room.id,
      transport_opted: transportOpted,
      transport_id: transportOpted && selectedTransport?.id ? selectedTransport.id : undefined,
      members: members.length
        ? members.map((m) => ({
            name: m.name.trim(),
            contact_number: m.contact_number.trim(),
            age: Number(m.age),
            gender: m.gender,
            chanting_rounds: Number(m.chanting_rounds),
          }))
        : undefined,
    };

    try {
      const res = await fetch(`${API_BASE}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        const id = data?.booking?.id;
        setBookingId(id);
        setPaymentStatus("pending");
        // show modal with payment instructions
        setShowPaymentModal(true);
      } else {
        setResult({ success: false, message: data.error || "Booking failed. Please try again." });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please check your connection." });
    } finally {
      setSubmitting(false);
    }
  };

  const startPolling = (id) => {
    setPolling(true);
    const contactNum = primary.contact_number.trim();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/get-booking?contact_number=${encodeURIComponent(contactNum)}`);
        if (!res.ok) return;
        const data = await res.json();
        const bookings = Array.isArray(data) ? data : data.bookings || data.body || [];
        const booking = bookings.find((b) => b.id === id || b.booking_id === id || b.bookingId === id);
        if (booking) {
          const status = booking.status || booking.payment_status;
          if (status === "partially_paid" || status === "fully_paid") {
            setPaymentStatus(status);
            setAmountPaid(booking.amount_paid || booking.amountPaid || 0);
            setPolling(false);
            clearInterval(interval);
          }
        }
      } catch {
        // keep polling on network errors
      }
    }, 5000);
    // stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
    }, 5 * 60 * 1000);
  };

  const totalOccupants = 1 + members.length;
  const roomTotal = room.price * totalOccupants;
  const transportTotal = transportOpted && selectedTransport ? selectedTransport.price * totalOccupants : 0;
  const totalAmount = roomTotal + transportTotal;

  return (
    <div
      className="min-h-screen relative"
      style={{ ...theme.cssVars, backgroundColor: "var(--t-bg)", color: "var(--t-text)" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* back */}
        <button
          onClick={() => navigate("/register")}
          className="flex items-center gap-2 text-sm font-medium mb-8 transition-colors"
          style={{ color: "var(--t-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-muted)")}
        >
          <ArrowLeft className="w-4 h-4" />
          Change Room
        </button>

        {/* heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-4">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-accent-tag)" }}>
              Step 2 of 2
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            Guest{" "}
            <span
              style={{
                background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Details
            </span>
          </h1>
        </motion.div>

        {/* room summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl mb-10"
          style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex items-center gap-3">
            <Bed className="w-5 h-5" style={{ color: "var(--t-accent-from)" }} />
            <div>
              <p className="font-bold">{`${room.name} with Prasadam`}</p>
              <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>
                Up to {room.capacity} guests · ₹{room.price}/person
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>
              {totalOccupants} guest{totalOccupants > 1 ? "s" : ""}{transportOpted ? " + transport" : ""}
            </p>
            <p
              className="text-xl font-black"
              style={{
                background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ₹{totalAmount}
            </p>
          </div>
        </motion.div>

        {/* success / error result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-start gap-3 p-5 rounded-2xl mb-8 ${
                result.success
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold ${result.success ? "text-green-700" : "text-red-700"}`}>
                  {result.success ? "Booking Confirmed!" : "Booking Failed"}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--t-text-secondary)" }}>
                  {result.message}
                </p>
                {result.success && (
                  <button
                    onClick={() => navigate("/")}
                    className="mt-3 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold"
                  >
                    Back to Home
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* form */}
        {!result?.success && !paymentStatus?.includes("paid") && (
          <form onSubmit={(e) => e.preventDefault()}>
            {/* primary guest */}
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
                  1
                </span>
                Primary Guest
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <InputField
                  label="Full Name"
                  value={primary.name}
                  onChange={(v) => updatePrimary("name", v)}
                  placeholder="Enter your name"
                  error={errors.name}
                  required
                />
                <InputField
                  label="Age"
                  type="number"
                  value={primary.age}
                  onChange={(v) => updatePrimary("age", v)}
                  placeholder="Age"
                  error={errors.age}
                  required
                />
                <InputField
                  label="Contact Number"
                  type="tel"
                  value={primary.contact_number}
                  onChange={(v) => updatePrimary("contact_number", v)}
                  placeholder="10-digit phone"
                  error={errors.contact_number}
                  required
                />
                <SelectField
                  label="Gender"
                  value={primary.gender}
                  onChange={(v) => updatePrimary("gender", v)}
                  options={GENDER_OPTIONS}
                  error={errors.gender}
                  required
                />
                <InputField
                  label="Chanting Rounds"
                  type="number"
                  value={primary.chanting_rounds}
                  onChange={(v) => updatePrimary("chanting_rounds", v)}
                  placeholder="Daily rounds"
                  error={errors.chanting_rounds}
                  required
                />
                <SelectField
                  label="Preaching Area"
                  value={primary.preaching_area_connected}
                  onChange={(v) => updatePrimary("preaching_area_connected", v)}
                  options={["Gita Essence", "ISKCON Jia Sarai", "ISKCON Srinagar", "Siksharthakam"]}
                  error={errors.preaching_area_connected}
                  required
                />
              </div>
              <div className="mb-8">
                <AutocompleteField
                  label="Preferred Room Partner"
                  value={primary.preferred_room_partner}
                  onChange={(v) => updatePrimary("preferred_room_partner", v)}
                  suggestions={userNames}
                  placeholder="Start typing a name..."
                />
              </div>
            </motion.div>

            {/* divider */}
            <div className="h-px mb-8" style={{ backgroundColor: "var(--t-border)" }} />

            {/* additional members */}
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
                    2
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
                <p className="text-sm py-6 text-center rounded-2xl" style={{ color: "var(--t-text-faint)", backgroundColor: "var(--t-card-tint)" }}>
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
                      <button
                        type="button"
                        onClick={() => removeMember(i)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="Full Name"
                        value={member.name}
                        onChange={(v) => updateMember(i, "name", v)}
                        placeholder="Member name"
                        error={errors[`member_${i}_name`]}
                        required
                      />
                      <InputField
                        label="Age"
                        type="number"
                        value={member.age}
                        onChange={(v) => updateMember(i, "age", v)}
                        placeholder="Age"
                        error={errors[`member_${i}_age`]}
                        required
                      />
                      <InputField
                        label="Contact Number"
                        type="tel"
                        value={member.contact_number}
                        onChange={(v) => updateMember(i, "contact_number", v)}
                        placeholder="10-digit phone"
                        error={errors[`member_${i}_contact_number`]}
                        required
                      />
                      <SelectField
                        label="Gender"
                        value={member.gender}
                        onChange={(v) => updateMember(i, "gender", v)}
                        options={GENDER_OPTIONS}
                        error={errors[`member_${i}_gender`]}
                        required
                      />
                      <InputField
                        label="Chanting Rounds"
                        type="number"
                        value={member.chanting_rounds}
                        onChange={(v) => updateMember(i, "chanting_rounds", v)}
                        placeholder="Daily rounds"
                        error={errors[`member_${i}_chanting_rounds`]}
                        required
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* divider */}
            <div className="h-px mb-8" style={{ backgroundColor: "var(--t-border)" }} />

            {/* transport opt-in */}
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
                    3
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
                        <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>per person · round trip</p>
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

            {/* registration note */}
            <div className="p-4 rounded-xl text-center mb-4" style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--t-accent-from)" }}>💰 Book your seat today with just ₹500</p>
              <p className="text-xs mt-1" style={{ color: "var(--t-text-muted)" }}>Pay the registration amount now and settle the remaining balance later.</p>
            </div>

            {/* submit */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col items-center gap-3"
            >
              {/* total summary */}
              <div className="text-center mb-4 space-y-1">
                <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>
                  Room: {totalOccupants} guest{totalOccupants > 1 ? "s" : ""} × ₹{room.price} = ₹{roomTotal}
                </p>
                {transportOpted && selectedTransport && (
                  <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>
                    Transport: {totalOccupants} × ₹{selectedTransport.price} = ₹{transportTotal}
                  </p>
                )}
                <p
                  className="text-3xl font-black"
                  style={{
                    background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Total: ₹{totalAmount}
                </p>
              </div>

              {/* payment step */}
              {!bookingId ? (
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={submitting || polling}
                    className="group flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Booking...
                      </>
                    ) : (
                      <>
                        Pay ₹{totalAmount}
                        <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-xs" style={{ color: "var(--t-text-faint)" }}>
                    Booking will be created, then you'll be redirected to Razorpay
                  </p>
                </div>
              ) : paymentStatus === "partially_paid" || paymentStatus === "fully_paid" ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 rounded-2xl text-center w-full" style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}>
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
                    <p className="text-xl font-bold text-green-600 mb-1">
                      {paymentStatus === "fully_paid" ? "Payment Complete!" : "Payment Received!"}
                    </p>
                    <p className="text-sm mb-2" style={{ color: "var(--t-text-secondary)" }}>
                      {paymentStatus === "fully_paid"
                        ? "Your full payment has been confirmed. Hare Krishna! 🙏"
                        : "We've received a partial payment. Our team will contact you for the remaining amount."}
                    </p>
                    <div className="mt-3 inline-block px-5 py-2 rounded-full" style={{ backgroundColor: "var(--t-card-tint)", border: "1px solid var(--t-border)" }}>
                      <span className="text-sm" style={{ color: "var(--t-text-muted)" }}>Amount Paid: </span>
                      <span className="text-lg font-black" style={{ color: "var(--t-accent-from)" }}>₹{amountPaid}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/")}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold transition-all hover:scale-105"
                  >
                    Back to Home
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-5 rounded-2xl text-center w-full" style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                      <p className="text-sm font-semibold">Waiting for payment confirmation...</p>
                    </div>
                    <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>
                      Complete your payment of <strong>₹{totalAmount}</strong> on Razorpay. This page will update automatically once payment is confirmed.
                    </p>
                    <div className="mt-3 px-4 py-2 rounded-xl text-xs font-medium" style={{ backgroundColor: "var(--t-card-tint)", border: "1px solid var(--t-border)", color: "var(--t-text-secondary)" }}>
                      ⚠️ Please enter <strong>{primary.contact_number}</strong> as your contact number on the Razorpay payment page for easy tracking of your payment.
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(RAZORPAY_LINK, "_blank", "noopener")}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold underline"
                      style={{ color: "var(--t-accent-from)" }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open payment link again
                    </button>
                  </div>
                  {polling && (
                    <p className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--t-text-faint)" }}>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Checking payment status...
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </form>
        )}
      </div>

      {/* payment instructions modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => {}}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-8 rounded-3xl text-center"
              style={{ backgroundColor: "var(--t-bg)", border: "1px solid var(--t-border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-bold mb-2">Booking Created!</h3>
              <p className="text-sm mb-4" style={{ color: "var(--t-text-secondary)" }}>
                Your booking has been created successfully. Please proceed to make the payment of <strong>₹{totalAmount}</strong>.
              </p>
              <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--t-accent-from)" }}>⚠️ Important</p>
                <p className="text-xs" style={{ color: "var(--t-text-secondary)" }}>
                  Please enter <strong>{primary.contact_number}</strong> as your contact number on the Razorpay payment page. This helps us track your payment automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.open(RAZORPAY_LINK, "_blank", "noopener");
                  setShowPaymentModal(false);
                  startPolling(bookingId);
                }}
                className="group flex items-center justify-center gap-2 w-full px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105"
              >
                Proceed to Payment
                <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="mt-3 text-[11px]" style={{ color: "var(--t-text-faint)" }}>
                You'll be redirected to Razorpay
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
