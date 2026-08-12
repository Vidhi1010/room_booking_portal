import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const theme = defaultTheme;

  const bookingIdParam = searchParams.get("booking_id");
  const [fetchedBooking, setFetchedBooking] = useState(null);
  const [fetchingBooking, setFetchingBooking] = useState(!!bookingIdParam);

  useEffect(() => {
    if (!bookingIdParam) return;
    setFetchingBooking(true);
    fetch(`${API_BASE}/get-booking?booking_id=${encodeURIComponent(bookingIdParam)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const booking = data.booking || (Array.isArray(data.bookings) ? data.bookings[0] : null) || (Array.isArray(data) ? data[0] : data);
        if (!booking || !booking.id) throw new Error("Not found");
        setFetchedBooking(booking);
      })
      .catch(() => {
        navigate("/register", { replace: true, state: { warning: "No booking found for that ID" } });
      })
      .finally(() => setFetchingBooking(false));
  }, [bookingIdParam, navigate]);

  const resolvedExistingBooking = fetchedBooking || location.state?.existingBooking || null;
  const payRemaining = !!fetchedBooking || (location.state?.payRemaining || false);

  const room = payRemaining
    ? { name: resolvedExistingBooking?.room_name, room_type: resolvedExistingBooking?.room_type, id: resolvedExistingBooking?.room_id, price: resolvedExistingBooking?.total_occupants ? Math.round((resolvedExistingBooking?.total_amount || 0) / resolvedExistingBooking.total_occupants) : 0, capacity: resolvedExistingBooking?.total_occupants }
    : location.state?.room;
  const primary = payRemaining
    ? { name: "—", contact_number: resolvedExistingBooking?.primary_contact }
    : location.state?.primary;
  const members = payRemaining ? [] : (location.state?.members || []);
  const transportOpted = payRemaining ? (resolvedExistingBooking?.transport_opted || false) : (location.state?.transportOpted || false);
  const selectedTransport = payRemaining && resolvedExistingBooking?.transport_name
    ? { name: resolvedExistingBooking.transport_name, id: resolvedExistingBooking.transport_id, price: 0 }
    : (payRemaining ? null : (location.state?.selectedTransport || null));

  const totalOccupants = payRemaining ? (resolvedExistingBooking?.total_occupants || 1) : (1 + members.length);
  const roomTotal = room?.price ? room.price * totalOccupants : 0;
  const transportTotal = transportOpted && selectedTransport ? selectedTransport.price * totalOccupants : 0;
  const totalAmount = payRemaining ? (resolvedExistingBooking?.total_amount || 0) : (roomTotal + transportTotal);
  const alreadyPaid = payRemaining ? (resolvedExistingBooking?.amount_paid || 0) : 0;
  const remainingAmount = totalAmount - alreadyPaid;
  const minPayment = payRemaining
    ? Math.min(2000 * totalOccupants, remainingAmount)
    : 2000 * totalOccupants;

  // UI state
  const [payAmount, setPayAmount] = useState(minPayment);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [toast, setToast] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(null);

  // Sync derived values into state once resolved
  useEffect(() => {
    if (resolvedExistingBooking?.id) setBookingId(resolvedExistingBooking.id);
    setAmountPaid(alreadyPaid);
  }, [resolvedExistingBooking, alreadyPaid]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const INPUT_STYLE = {
    backgroundColor: "var(--t-card-tint)",
    border: "1px solid var(--t-border-strong)",
    color: "var(--t-text)",
  };

  // Show loader while fetching booking by ID
  if (fetchingBooking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ ...theme.cssVars, backgroundColor: "var(--t-bg)", color: "var(--t-text)" }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // redirect if no data
  if ((!room || !primary) && !payRemaining) {
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
      setToast(`Minimum payment is ₹${minPayment}${!payRemaining ? " (₹2,000 per person)" : ""}`);
      return;
    }
    if (payAmount > (payRemaining ? remainingAmount : totalAmount)) {
      setToast(`Amount cannot exceed ${payRemaining ? "remaining" : "total"} of ₹${payRemaining ? remainingAmount : totalAmount}`);
      return;
    }

    setSubmitting(true);
    setToast(null);

    try {
      let createdBookingId = bookingId;

      // For new bookings, create booking first
      if (!payRemaining) {
        const payload = {
          name: primary.name.trim(),
          age: Number(primary.age),
          contact_number: primary.contact_number.trim(),
          gender: primary.gender,
          chanting_rounds: Number(primary.chanting_rounds),
          preaching_area_connected: primary.preaching_area_connected.trim(),
          facilitator_name: primary.facilitator_name?.trim() || undefined,
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
                facilitator_name: m.facilitator_name?.trim() || undefined,
              }))
            : undefined,
        };

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

        createdBookingId = data?.booking?.id;
        setBookingId(createdBookingId);
      }

      // Create Razorpay order
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

      // Start polling before opening Razorpay
      startPolling(orderData.order.order_id);

      // Open Razorpay modal
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
          onClick={() => navigate(payRemaining ? "/" : "/register", payRemaining ? undefined : { state: { room, primary, members, transportOpted, selectedTransport } })}
          className="flex items-center gap-2 text-sm font-medium mb-8 transition-colors"
          style={{ color: "var(--t-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-muted)")}
        >
          <ArrowLeft className="w-4 h-4" />
          {payRemaining ? "Back to Home" : "Back to Registration"}
        </button>

        {/* heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-4">
            <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-accent-tag)" }}>
              {payRemaining ? "Pay Remaining" : "Review & Pay"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            {payRemaining ? "Complete Your " : "Booking "}
            <span
              style={{
                background: `linear-gradient(to right, var(--t-accent-from), var(--t-accent-to))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {payRemaining ? "Payment" : "Summary"}
            </span>
          </h1>
          <p className="mt-3 text-base" style={{ color: "var(--t-text-muted)" }}>
            {payRemaining
              ? "Pay the remaining balance for your existing booking."
              : "Review your booking details before making the payment."}
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
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{room?.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--t-text-muted)" }}>
                      <Users className="w-4 h-4" style={{ color: "var(--t-accent-from)" }} />
                      {totalOccupants} {totalOccupants > 1 ? "guests" : "guest"}
                    </div>
                    {!payRemaining && (
                    <div className="text-sm font-semibold" style={{ color: "var(--t-accent-from)" }}>
                      ₹{room?.price}/person
                    </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--t-border)" }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--t-text-muted)" }}>What's Included</p>
                    <ul className="space-y-1.5 text-sm" style={{ color: "var(--t-text-secondary)" }}>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                        <span>Yatra Fees <span style={{ color: "var(--t-text-faint)" }}>(seminar hall + lecture hall facilities)</span></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                        <span>3 days Prasadam</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                        <span>Internal Travel <span style={{ color: "var(--t-text-faint)" }}>(bus facilities within Vraj)</span></span>
                      </li>
                    </ul>
                  </div>
                </div>
                {room?.img && (
                  <div className="w-32 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={room.img} alt={room?.name} className="w-full h-full object-cover" />
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
                {payRemaining ? "Booking Details" : "Guest Details"}
              </h2>

              {payRemaining ? (
                <div className="p-4 rounded-xl" style={{ backgroundColor: "var(--t-card-tint)", border: "1px solid var(--t-border)" }}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span style={{ color: "var(--t-text-faint)" }}>Primary Contact</span>
                      <p className="font-semibold">{resolvedExistingBooking?.primary_contact}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--t-text-faint)" }}>Total Occupants</span>
                      <p className="font-semibold">{resolvedExistingBooking?.total_occupants}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--t-text-faint)" }}>Room</span>
                      <p className="font-semibold">{resolvedExistingBooking?.room_name}</p>
                    </div>
                    {resolvedExistingBooking?.transport_name && (
                      <div>
                        <span style={{ color: "var(--t-text-faint)" }}>Transport</span>
                        <p className="font-semibold">{resolvedExistingBooking.transport_name}</p>
                      </div>
                    )}
                    {resolvedExistingBooking?.transport_price != null && (
                      <div>
                        <span style={{ color: "var(--t-text-faint)" }}>Transport Price</span>
                        <p className="font-semibold">₹{resolvedExistingBooking.transport_price}</p>
                      </div>
                    )}
                    <div>
                      <span style={{ color: "var(--t-text-faint)" }}>Status</span>
                      <p className="font-semibold capitalize">{resolvedExistingBooking?.status?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                </div>
              ) : (
              <>
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
                  <div>
                    <span style={{ color: "var(--t-text-faint)" }}>Facilitator</span>
                    <p className="font-semibold">{primary.facilitator_name}</p>
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
              </>
              )}
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
                {!payRemaining && (
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--t-text-secondary)" }}>
                    Room ({totalOccupants} {totalOccupants > 1 ? "guests" : "guest"} × ₹{room?.price})
                  </span>
                  <span className="font-semibold">₹{roomTotal}</span>
                </div>
                )}
                {!payRemaining && transportOpted && selectedTransport && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--t-text-secondary)" }}>
                      Transport ({totalOccupants} × ₹{selectedTransport.price})
                    </span>
                    <span className="font-semibold">₹{transportTotal}</span>
                  </div>
                )}
                {!payRemaining && <div className="h-px" style={{ backgroundColor: "var(--t-border)" }} />}
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
                {payRemaining && (
                  <>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--t-text-secondary)" }}>Already Paid</span>
                      <span className="font-semibold text-green-500">- ₹{alreadyPaid}</span>
                    </div>
                    <div className="h-px" style={{ backgroundColor: "var(--t-border)" }} />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base">Remaining Amount</span>
                      <span className="text-xl font-black" style={{ color: "var(--t-accent-from)" }}>₹{remainingAmount}</span>
                    </div>
                  </>
                )}
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
                {payRemaining ? "Pay Remaining Amount" : "How much would you like to pay now?"}
              </h2>
              <p className="text-xs mb-4" style={{ color: "var(--t-text-muted)" }}>
                {payRemaining
                  ? `Remaining amount: ₹${remainingAmount}${alreadyPaid > 0 ? ` (Already paid: ₹${alreadyPaid})` : ""}. Minimum ₹${minPayment}.`
                  : `Minimum ₹2,000/person (₹${minPayment} total). You can pay the remaining amount later.`}
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--t-accent-from)" }}>₹</span>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    min={minPayment}
                    max={payRemaining ? remainingAmount : totalAmount}
                    className="w-full pl-8 pr-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/30"
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="flex gap-2">
                  {!payRemaining && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(minPayment)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${payAmount === minPayment ? "bg-amber-500/20 border-amber-500/40" : ""}`}
                      style={{ border: "1px solid var(--t-border-strong)", color: "var(--t-text-secondary)" }}
                    >
                      Min
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPayAmount(payRemaining ? remainingAmount : totalAmount)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${payAmount === (payRemaining ? remainingAmount : totalAmount) ? "bg-amber-500/20 border-amber-500/40" : ""}`}
                    style={{ border: "1px solid var(--t-border-strong)", color: "var(--t-text-secondary)" }}
                  >
                    Full
                  </button>
                </div>
              </div>
              {payAmount < minPayment && (
                <p className="text-red-500 text-xs mt-2">Minimum payment is ₹{minPayment}</p>
              )}
              {payAmount > (payRemaining ? remainingAmount : totalAmount) && (
                <p className="text-red-500 text-xs mt-2">Cannot exceed {payRemaining ? "remaining" : "total"} amount of ₹{payRemaining ? remainingAmount : totalAmount}</p>
              )}
            </motion.div>

            {/* ── Booking Amount Note ── */}
            {!payRemaining && (
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
            )}

            {/* ── Yatra Schedule ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36 }}
              className="p-5 rounded-2xl mb-4 flex items-start gap-3"
              style={{ backgroundColor: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
            >
              <span className="text-lg flex-shrink-0">🗓️</span>
              <div className="text-sm" style={{ color: "var(--t-text-secondary)" }}>
                <p><strong>Yatra starts:</strong> 2nd October, 9:00 AM</p>
                <p className="mt-1"><strong>Yatra ends:</strong> 4th October, 7:00 PM</p>
              </div>
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
              {!bookingId || payRemaining ? (
                <div className="flex flex-col items-center gap-4">
                  <label className="flex items-start gap-3 cursor-pointer select-none max-w-md">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded accent-amber-500 flex-shrink-0"
                    />
                    <span className="text-sm" style={{ color: "var(--t-text-secondary)" }}>
                      I agree to the no cancellation/no refund policy.
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !agreed || payAmount < minPayment || payAmount > (payRemaining ? remainingAmount : totalAmount)}
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
