import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Bed,
  Bus,
  ExternalLink,
  ShieldAlert,
  User,
  Phone,
  MapPin,
  IndianRupee,
} from "lucide-react";
import { defaultTheme } from "./themes";
import { API_BASE } from "./config";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = defaultTheme;

  const room = location.state?.room;
  const primary = location.state?.primary;
  const members = location.state?.members || [];
  const transportOpted = location.state?.transportOpted || false;
  const selectedTransport = location.state?.selectedTransport || null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // redirect if no data
  if (!room || !primary) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ ...theme.cssVars, backgroundColor: "var(--t-bg)", color: "var(--t-text)" }}
      >
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: "var(--t-text-muted)" }}>
            No registration data found.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold"
          >
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  const totalOccupants = 1 + members.length;
  const roomTotal = room.price * totalOccupants;
  const transportTotal = transportOpted && selectedTransport ? selectedTransport.price * totalOccupants : 0;
  const totalAmount = roomTotal + transportTotal;
  const minPayment = 1 * totalOccupants;

  // UI state
  const [payAmount, setPayAmount] = useState(minPayment);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(null);

  const INPUT_STYLE = {
    backgroundColor: "var(--t-card-tint)",
    border: "1px solid var(--t-border-strong)",
    color: "var(--t-text)",
  };

  const startPolling = (orderId) => {
    setPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/get-booking?order_id=${encodeURIComponent(orderId)}`);
        if (!res.ok) return;
        const data = await res.json();
        const booking = Array.isArray(data) ? data[0] : data.booking || data;
        if (booking) {
          const status = booking.status || booking.payment_status;
          if (status === "partially_paid" || status === "fully_paid") {
            setPaymentStatus(status);
            setAmountPaid(booking.amount_paid || booking.amountPaid || 0);
            setPolling(false);
            clearInterval(pollingRef.current);
          }
        }
      } catch {
        // keep polling
      }
    }, 5000);
    // stop polling after 5 minutes
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        setPolling(false);
      }
    }, 5 * 60 * 1000);
  };

  const openRazorpay = (orderData) => {
    const options = {
      key: orderData.razorpay_key_id,
      amount: orderData.order.amount_in_paise,
      currency: orderData.order.currency,
      name: "Vraj Kartik Yatra 2026",
      description: `Booking for ${primary.name}`,
      order_id: orderData.order.order_id,
      prefill: {
        name: primary.name,
        contact: primary.contact_number,
      },
      theme: {
        color: "#f59e0b",
      },
      handler: () => {
        // payment successful via Razorpay callback - polling will pick it up
      },
      modal: {
        ondismiss: () => {
          // user closed modal, polling continues in background
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleSubmit = async () => {
    if (payAmount < minPayment) {
      setToast(`Minimum payment is ₹${minPayment} (₹2,000 per person)`);
      return;
    }
    if (payAmount > totalAmount) {
      setToast(`Amount cannot exceed total of ₹${totalAmount}`);
      return;
    }

    setSubmitting(true);
    setToast(null);

    // Step 1: Create booking
    const payload = {
      name: primary.name.trim(),
      age: Number(primary.age),
      contact_number: primary.contact_number.trim(),
      gender: primary.gender,
      chanting_rounds: Number(primary.chanting_rounds),
      preaching_area_connected: primary.preaching_area_connected.trim(),
      preferred_room_partner: primary.preferred_room_partner?.trim() || undefined,
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
      if (!res.ok) {
        setToast(data.error || "Booking failed. Please try again.");
        setSubmitting(false);
        return;
      }

      const createdBookingId = data?.booking?.id;
      setBookingId(createdBookingId);

      // Step 2: Create Razorpay order
      const orderRes = await fetch(`${API_BASE}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: createdBookingId, amount: payAmount }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setToast(orderData.error || "Failed to create payment order. Please try again.");
        setSubmitting(false);
        return;
      }

      // Step 3: Start polling before opening Razorpay
      startPolling(orderData.order.order_id);

      // Step 4: Open Razorpay modal
      setPaymentStatus("pending");
      openRazorpay(orderData);
    } catch {
      setToast("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{ ...theme.cssVars, backgroundColor: "var(--t-bg)", color: "var(--t-text)" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* back */}
        <button
          onClick={() => navigate("/register", { state: { room, primary, members, transportOpted, selectedTransport } })}
          className="flex items-center gap-2 text-sm font-medium mb-8 transition-colors"
          style={{ color: "var(--t-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-muted)")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registration
        </button>

        {/* heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-4">
            <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-accent-tag)" }}>
              Review & Pay
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            Booking{" "}
            <span
              style={{
                background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Summary
            </span>
          </h1>
          <p className="mt-3 text-base" style={{ color: "var(--t-text-muted)" }}>
            Review your booking details before making the payment.
          </p>
        </motion.div>

        {/* toast notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -40, x: "-50%" }}
              className="fixed top-6 left-1/2 z-[300] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl max-w-md"
              style={{ backgroundColor: "#1f1215", border: "1px solid rgba(239,68,68,0.3)" }}
              onAnimationComplete={() => {
                setTimeout(() => setToast(null), 4000);
              }}
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-red-200">{toast}</p>
              <button onClick={() => setToast(null)} className="ml-2 text-red-400 hover:text-red-200 transition-colors">
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!paymentStatus?.includes("paid") && (
          <>
            {/* ── Room Preview ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl mb-6"
              style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}
            >
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--t-accent-from)" }}>
                <Bed className="w-4 h-4" />
                Room Selected
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">{room.name} with Prasadam + Internal Travel</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--t-text-muted)" }}>
                      <Users className="w-4 h-4" style={{ color: "var(--t-accent-from)" }} />
                      Up to {room.capacity} guests
                    </div>
                    <div className="text-sm" style={{ color: "var(--t-text-muted)" }}>
                      ₹{room.price}/person
                    </div>
                  </div>
                </div>
                {room.img && (
                  <div className="w-32 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={room.img} alt={room.name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Guest Details Preview ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-6 rounded-2xl mb-6"
              style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}
            >
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--t-accent-from)" }}>
                <User className="w-4 h-4" />
                Guest Details
              </h2>

              {/* primary */}
              <div className="p-4 rounded-xl mb-3" style={{ backgroundColor: "var(--t-card-tint)", border: "1px solid var(--t-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))` }}>
                    Primary Guest
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span style={{ color: "var(--t-text-faint)" }}>Name</span>
                    <p className="font-semibold">{primary.name}</p>
                  </div>
                  <div>
                    <span style={{ color: "var(--t-text-faint)" }}>Age</span>
                    <p className="font-semibold">{primary.age}</p>
                  </div>
                  <div>
                    <span style={{ color: "var(--t-text-faint)" }}>Gender</span>
                    <p className="font-semibold">{primary.gender}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1" style={{ color: "var(--t-text-faint)" }}><Phone className="w-3 h-3" />Contact</span>
                    <p className="font-semibold">{primary.contact_number}</p>
                  </div>
                  <div>
                    <span style={{ color: "var(--t-text-faint)" }}>Chanting Rounds</span>
                    <p className="font-semibold">{primary.chanting_rounds}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1" style={{ color: "var(--t-text-faint)" }}><MapPin className="w-3 h-3" />Preaching Area</span>
                    <p className="font-semibold">{primary.preaching_area_connected}</p>
                  </div>
                </div>
                {primary.preferred_room_partner && (
                  <div className="mt-2 text-sm">
                    <span style={{ color: "var(--t-text-faint)" }}>Preferred Room Partner: </span>
                    <span className="font-semibold">{primary.preferred_room_partner}</span>
                  </div>
                )}
              </div>

              {/* additional members */}
              {members.map((member, i) => (
                <div key={i} className="p-4 rounded-xl mb-3" style={{ backgroundColor: "var(--t-card-tint)", border: "1px solid var(--t-border)" }}>
                  <span className="text-xs font-bold uppercase tracking-wider mb-2 inline-block" style={{ color: "var(--t-text-muted)" }}>
                    Member {i + 2}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span style={{ color: "var(--t-text-faint)" }}>Name</span>
                      <p className="font-semibold">{member.name}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--t-text-faint)" }}>Age</span>
                      <p className="font-semibold">{member.age}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--t-text-faint)" }}>Gender</span>
                      <p className="font-semibold">{member.gender}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--t-text-faint)" }}>Contact</span>
                      <p className="font-semibold">{member.contact_number}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--t-text-faint)" }}>Chanting Rounds</span>
                      <p className="font-semibold">{member.chanting_rounds}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* ── Transport Preview ── */}
            {transportOpted && selectedTransport && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl mb-6"
                style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}
              >
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--t-accent-from)" }}>
                  <Bus className="w-4 h-4" />
                  Transport
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{selectedTransport.name}</p>
                    <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>Delhi to Vraj - Round trip · per person</p>
                  </div>
                  <span className="text-lg font-black" style={{ color: "var(--t-accent-from)" }}>₹{selectedTransport.price}</span>
                </div>
              </motion.div>
            )}

            {/* ── Pricing Breakdown ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-6 rounded-2xl mb-6"
              style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}
            >
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--t-accent-from)" }}>
                Pricing Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--t-text-secondary)" }}>
                    Room ({totalOccupants} {totalOccupants > 1 ? "guests" : "guest"} × ₹{room.price})
                  </span>
                  <span className="font-semibold">₹{roomTotal}</span>
                </div>
                {transportOpted && selectedTransport && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--t-text-secondary)" }}>
                      Transport ({totalOccupants} × ₹{selectedTransport.price})
                    </span>
                    <span className="font-semibold">₹{transportTotal}</span>
                  </div>
                )}
                <div className="h-px" style={{ backgroundColor: "var(--t-border)" }} />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base">Total Amount</span>
                  <span
                    className="text-2xl font-black"
                    style={{
                      background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    ₹{totalAmount}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Payment Amount Input ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl mb-4"
              style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}
            >
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--t-accent-from)" }}>
                <IndianRupee className="w-4 h-4" />
                How much would you like to pay now?
              </h2>
              <p className="text-xs mb-4" style={{ color: "var(--t-text-muted)" }}>
                Minimum ₹2,000/person (₹{minPayment} total). You can pay the remaining amount later.
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--t-accent-from)" }}>₹</span>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    min={minPayment}
                    max={totalAmount}
                    className="w-full pl-8 pr-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/30"
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPayAmount(minPayment)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${payAmount === minPayment ? "bg-amber-500/20 border-amber-500/40" : ""}`}
                    style={{ border: "1px solid var(--t-border-strong)", color: "var(--t-text-secondary)" }}
                  >
                    Min
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(totalAmount)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${payAmount === totalAmount ? "bg-amber-500/20 border-amber-500/40" : ""}`}
                    style={{ border: "1px solid var(--t-border-strong)", color: "var(--t-text-secondary)" }}
                  >
                    Full
                  </button>
                </div>
              </div>
              {payAmount < minPayment && (
                <p className="text-red-500 text-xs mt-2">Minimum payment is ₹{minPayment}</p>
              )}
              {payAmount > totalAmount && (
                <p className="text-red-500 text-xs mt-2">Cannot exceed total amount of ₹{totalAmount}</p>
              )}
            </motion.div>

            {/* ── Booking Amount Note ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="p-5 rounded-2xl mb-4 text-center"
              style={{ backgroundColor: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
            >
              <p className="text-base font-bold" style={{ color: "var(--t-accent-from)" }}>
                💰 Book your seat today with just ₹2,000/person
              </p>
              <p className="text-sm mt-1.5" style={{ color: "var(--t-text-muted)" }}>
                Pay at least ₹{minPayment} now and settle the remaining balance later.
              </p>
            </motion.div>

            {/* ── Cancellation Policy ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-2xl mb-10 flex items-start gap-3"
              style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-600">No Cancellation Policy</p>
                <p className="text-xs mt-1" style={{ color: "var(--t-text-secondary)" }}>
                  Once confirmed, bookings cannot be cancelled or refunded. Please ensure all details are correct before proceeding.
                </p>
              </div>
            </motion.div>

            {/* ── Payment Section ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col items-center gap-3"
            >
              {!bookingId ? (
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || payAmount < minPayment || payAmount > totalAmount}
                    className="group flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Confirm & Pay ₹{payAmount}
                        <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-xs" style={{ color: "var(--t-text-faint)" }}>
                    Razorpay payment gateway will open for secure payment
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-5 rounded-2xl text-center w-full" style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                      <p className="text-sm font-semibold">Waiting for payment confirmation...</p>
                    </div>
                    <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>
                      Complete your payment of <strong>₹{payAmount}</strong> in the Razorpay window. This page will update automatically once payment is confirmed.
                    </p>
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
          </>
        )}

        {/* payment success */}
        {paymentStatus?.includes("paid") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
            <div className="p-6 rounded-2xl text-center w-full" style={{ backgroundColor: "var(--t-bg-alt)", border: "1px solid var(--t-border)" }}>
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <p className="text-xl font-bold text-green-600 mb-1">
                {paymentStatus === "fully_paid" ? "Payment Complete!" : "Payment Received!"}
              </p>
              <p className="text-sm mb-2" style={{ color: "var(--t-text-secondary)" }}>
                {paymentStatus === "fully_paid"
                  ? "Your full payment has been confirmed. Hare Krishna! 🙏"
                  : "We've received your payment. Our team will contact you for the remaining amount."}
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
          </motion.div>
        )}
      </div>
    </div>
  );
}
