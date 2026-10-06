import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Input, Spin, message } from "antd";
import { API_BASE, isLocal } from "./config";

const MOCK_FEEDBACK = {
  yatra_name: "Vraj Dham Yatra (mock)",
  feedback_enabled: true,
  questions: [
    { id: "name", label: "Name", type: "text", required: true, order: 1 },
    { id: "prasadam", label: "Rate us on Prasadam", type: "rating", required: true, order: 2 },
    { id: "sessions", label: "Rate us on Sessions", type: "rating", required: true, order: 3 },
    { id: "stay", label: "Rate us on Accommodation", type: "rating", required: false, order: 4 },
    { id: "transport", label: "Rate us on Transport", type: "rating", required: false, order: 5 },
    { id: "best", label: "What did you like the most?", type: "textarea", required: false, order: 6 },
    { id: "improve", label: "What can we improve?", type: "textarea", required: false, order: 7 },
    { id: "city", label: "Which city are you from?", type: "text", required: false, order: 8 },
  ],
};

const HERO_IMAGE = "/banner/IMG_8072.jpg";

const RATINGS = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😐", label: "Fair" },
  { value: 3, emoji: "🙂", label: "Good" },
  { value: 4, emoji: "😊", label: "Very good" },
  { value: 5, emoji: "🤩", label: "Excellent" },
];

const isAnswered = (v) => v !== undefined && v !== 0 && String(v).trim() !== "";

export default function FeedbackPage() {
  const [searchParams] = useSearchParams();
  // On localhost, use mock data unless ?mock=0 is passed to hit the real API.
  const useMock = isLocal && searchParams.get("mock") !== "0";
  const [yatraId, setYatraId] = useState(searchParams.get("yatra_id"));
  const [yatraName, setYatraName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [missingId, setMissingId] = useState(null);
  const scrollRef = useRef(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const orderedQuestions = useMemo(
    () => [...questions].sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)),
    [questions]
  );
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const showForm = !loading && !error && !done && questions.length > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (useMock) {
          await new Promise((r) => setTimeout(r, 400));
          if (cancelled) return;
          setYatraName(MOCK_FEEDBACK.yatra_name);
          setQuestions(MOCK_FEEDBACK.questions);
          return;
        }
        let id = yatraId;
        if (!id) {
          const res = await fetch(`${API_BASE}/get-yatras`);
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.yatras || data.body || [];
          id = list[0]?.id;
          if (!id) throw new Error("No yatra found");
          if (!cancelled) setYatraId(id);
        }
        const res = await fetch(`${API_BASE}/yatra-feedback?yatra_id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Failed to load feedback form");
        if (cancelled) return;
        setYatraName(data.yatra_name || "");
        setQuestions(data.feedback_enabled === false ? [] : data.questions || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setAnswer = (id, v) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    if (missingId === id) setMissingId(null);
  };

  const submit = async () => {
    const missing = orderedQuestions.find((q) => q.required && !isAnswered(answers[q.id]));
    if (missing) {
      message.error(`Please answer: ${missing.label}`);
      setMissingId(missing.id);
      document.getElementById(`q-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const cleaned = {};
    for (const q of questions) {
      const v = answers[q.id];
      if (v === undefined || v === 0 || (typeof v === "string" && !v.trim())) continue;
      cleaned[q.id] = typeof v === "string" ? v.trim() : v;
    }
    setSubmitting(true);
    try {
      if (useMock) {
        await new Promise((r) => setTimeout(r, 600));
        console.log("[mock] feedback submitted", cleaned);
        setDone(true);
        scrollToTop();
        return;
      }
      const res = await fetch(`${API_BASE}/yatra-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yatra_id: yatraId, answers: cleaned }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to submit");
      setDone(true);
      scrollToTop();
    } catch (e) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] text-[#2D1810] lg:h-screen lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <style>{`
        @keyframes fbFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes fbPop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .fb-fade { animation: fbFadeUp .4s ease-out both; }
        .fb-pop { animation: fbPop .5s ease-out both; }
      `}</style>

      <aside className="relative h-60 sm:h-72 lg:h-screen overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c0f08]/95 via-[#1c0f08]/45 to-[#1c0f08]/10" />
        <Link to="/" className="absolute top-4 left-5 lg:top-8 lg:left-10 text-white/80 hover:text-white text-sm">← Home</Link>
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10 text-white">
          {yatraName && <div className="text-amber-300 text-xs sm:text-sm font-semibold tracking-wider uppercase">{yatraName}</div>}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mt-1 mb-0">
            {done ? "Thank you for sharing!" : "How was your yatra?"}
          </h1>
          {!done && (
            <p className="text-white/75 mt-2 mb-0 text-sm sm:text-base max-w-md">
              Your feedback helps us serve devotees better. It takes about a minute.
            </p>
          )}
          {showForm && (
            <div className="hidden lg:block mt-8 max-w-sm">
              <ProgressBar answered={answeredCount} total={questions.length} progress={progress} light />
            </div>
          )}
        </div>
      </aside>

      <div ref={scrollRef} className="lg:h-screen lg:overflow-y-auto">
      <main className="w-full max-w-2xl mx-auto lg:mx-0 px-5 sm:px-8 lg:px-14 pb-10 lg:py-12">
        {loading ? (
          <div className="flex justify-center py-20"><Spin size="large" /></div>
        ) : error ? (
          <StatusCard emoji="🙏" title="Unable to load feedback form" text={error} />
        ) : done ? (
          <ThankYou />
        ) : !questions.length ? (
          <StatusCard emoji="🪔" title="Feedback is not active yet" text="Please check back after the yatra. We'd love to hear from you!" />
        ) : (
          <>
            <div className="lg:hidden sticky top-0 z-10 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 bg-[#FDF8F0]/95 backdrop-blur border-b border-[rgba(45,24,16,0.06)]">
              <ProgressBar answered={answeredCount} total={questions.length} progress={progress} />
            </div>

            <div>
              {orderedQuestions.map((q, i) => (
                <div
                  key={q.id}
                  id={`q-${q.id}`}
                  className="fb-fade py-7 border-b border-[rgba(45,24,16,0.08)] last:border-b-0"
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                >
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-amber-600 font-semibold text-sm tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <div className="flex-1">
                      <span className="text-base sm:text-lg font-semibold leading-snug">{q.label}</span>
                      {q.required ? (
                        <span className="text-amber-600 ml-1">*</span>
                      ) : (
                        <span className="text-xs text-[#9C8B78] ml-2">Optional</span>
                      )}
                      {missingId === q.id && <div className="text-xs text-red-600 mt-1">Please answer this question</div>}
                    </div>
                  </div>
                  {q.type === "rating" ? (
                    <RatingPicker value={answers[q.id] || 0} onChange={(v) => setAnswer(q.id, v)} />
                  ) : q.type === "textarea" ? (
                    <Input.TextArea
                      rows={4}
                      maxLength={2000}
                      showCount
                      placeholder="Share your thoughts…"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      style={{ borderRadius: 12, padding: "10px 14px", fontSize: 15 }}
                    />
                  ) : (
                    <Input
                      size="large"
                      maxLength={2000}
                      placeholder="Type your answer"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      style={{ borderRadius: 12 }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 -mx-5 sm:-mx-8 px-5 sm:px-8 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#FDF8F0] via-[#FDF8F0] to-transparent">
              <Button
                type="primary"
                size="large"
                block
                loading={submitting}
                onClick={submit}
                style={{ height: 52, borderRadius: 14, fontWeight: 600, fontSize: 16, border: "none", background: "#2D1810" }}
              >
                Submit feedback
              </Button>
            </div>
          </>
        )}
      </main>
      </div>
    </div>
  );
}

function ProgressBar({ answered, total, progress, light }) {
  return (
    <>
      <div className={`flex justify-between text-xs mb-1.5 ${light ? "text-white/70" : "text-[#6B5744]"}`}>
        <span>{answered} of {total} answered</span>
        <span>{progress}%</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${light ? "bg-white/20" : "bg-[rgba(45,24,16,0.08)]"}`}>
        <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </>
  );
}

function RatingPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {RATINGS.map((r) => {
        const selected = value === r.value;
        return (
          <button
            key={r.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(r.value)}
            className={`flex flex-col items-center gap-1 rounded-xl py-3 border transition-all duration-150 cursor-pointer ${
              selected
                ? "bg-amber-50 border-amber-500 ring-2 ring-amber-200"
                : "bg-white border-[rgba(45,24,16,0.12)] hover:border-amber-300"
            } ${value && !selected ? "opacity-50" : ""}`}
          >
            <span className={`text-2xl sm:text-3xl transition-transform ${selected ? "scale-110" : ""}`}>{r.emoji}</span>
            <span className={`text-[11px] sm:text-xs font-medium ${selected ? "text-amber-700" : "text-[#6B5744]"}`}>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatusCard({ emoji, title, text }) {
  return (
    <div className="fb-fade text-center py-16">
      <div className="text-5xl mb-4">{emoji}</div>
      <h2 className="text-xl font-semibold m-0">{title}</h2>
      <p className="text-[#6B5744] mt-2 mb-6">{text}</p>
      <Link to="/" className="text-amber-700 font-medium">Back to home →</Link>
    </div>
  );
}

function ThankYou() {
  return (
    <div className="fb-fade text-center py-16">
      <div className="fb-pop mx-auto w-16 h-16 rounded-full bg-amber-500 text-white text-3xl flex items-center justify-center shadow-lg shadow-amber-200">
        ✓
      </div>
      <h2 className="text-xl font-semibold mt-5 mb-1">Your feedback has been submitted</h2>
      <p className="text-[#6B5744] mb-8">Thank you for helping us make every yatra better. Hare Krishna! 🙏</p>
      <Link
        to="/"
        className="inline-block px-6 py-3 rounded-xl bg-[#2D1810] text-white font-medium hover:bg-[#3d2216] transition-colors"
      >
        Go to Home
      </Link>
    </div>
  );
}
