import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Input, Rate, Spin, message } from "antd";
import { API_BASE } from "./config";

const RATING_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

const isAnswered = (v) => v !== undefined && v !== 0 && String(v).trim() !== "";

export default function FeedbackPage() {
  const [searchParams] = useSearchParams();
  const [yatraId, setYatraId] = useState(searchParams.get("yatra_id"));
  const [yatraName, setYatraName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);

  // Quick rating questions first to make starting easy; stable sort keeps admin order otherwise.
  const orderedQuestions = useMemo(
    () => [...questions].sort((a, b) => (b.type === "rating") - (a.type === "rating")),
    [questions]
  );
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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

  const setAnswer = (id, v) => setAnswers((a) => ({ ...a, [id]: v }));

  const submit = async () => {
    const missing = orderedQuestions.find((q) => q.required && !isAnswered(answers[q.id]));
    if (missing) {
      message.error(`Please answer: ${missing.label}`);
      setActiveId(missing.id);
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
      const res = await fetch(`${API_BASE}/yatra-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yatra_id: yatraId, answers: cleaned }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to submit");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] text-[#2D1810]">
      <style>{`
        @keyframes fbFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes fbPop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .fb-fade { animation: fbFadeUp .45s ease-out both; }
        .fb-pop { animation: fbPop .5s ease-out both; }
        .fb-rate .ant-rate-star:not(:last-child) { margin-inline-end: 10px; }
      `}</style>

      <header className="relative h-56 sm:h-72 overflow-hidden">
        <img src="/images/poster_vraj_yatra.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-[#FDF8F0]" />
        <div className="relative h-full max-w-xl mx-auto px-5 flex flex-col justify-end pb-6">
          <span className="text-xs uppercase tracking-[0.2em] text-amber-200 font-semibold">Hare Krishna</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow m-0">
            {done ? "Thank you!" : "Share your experience"}
          </h1>
          {yatraName && <p className="text-white/90 mt-1 mb-0 drop-shadow">{yatraName}</p>}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pb-10 -mt-2">
        {loading ? (
          <div className="flex justify-center py-16"><Spin size="large" /></div>
        ) : error ? (
          <StatusCard emoji="🙏" title="Unable to load feedback form" text={error} />
        ) : done ? (
          <ThankYou />
        ) : !questions.length ? (
          <StatusCard emoji="🪔" title="Feedback is not active yet" text="Please check back after the yatra. We'd love to hear from you!" />
        ) : (
          <>
            <p className="fb-fade text-[#6B5744] text-center mt-2 mb-5">
              Your feedback helps us serve devotees better. It takes about a minute.
            </p>

            <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-[#FDF8F0]/90 backdrop-blur">
              <div className="flex justify-between text-xs text-[#6B5744] mb-1.5">
                <span>{answeredCount} of {questions.length} answered</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-3">
              {orderedQuestions.map((q, i) => {
                const active = activeId === q.id;
                const isRating = q.type === "rating";
                return (
                  <section
                    key={q.id}
                    id={`q-${q.id}`}
                    onFocusCapture={() => setActiveId(q.id)}
                    onMouseEnter={() => setActiveId(q.id)}
                    className={`fb-fade rounded-2xl bg-white p-5 border transition-all duration-200 ${
                      active ? "border-amber-400 shadow-lg shadow-amber-100" : "border-[rgba(45,24,16,0.08)] shadow-sm"
                    }`}
                    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isAnswered(answers[q.id]) ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"
                      }`}>
                        {isAnswered(answers[q.id]) ? "✓" : i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-[15px] leading-snug">{q.label}</div>
                        <div className="text-xs text-[#9C8B78] mt-0.5">{q.required ? "Required" : "Optional"}</div>
                      </div>
                    </div>
                    {isRating ? (
                      <div className="flex flex-col items-center gap-1">
                        <Rate
                          className="fb-rate"
                          style={{ fontSize: 34, color: "#f59e0b" }}
                          tooltips={RATING_LABELS}
                          value={answers[q.id] || 0}
                          onChange={(v) => setAnswer(q.id, v)}
                        />
                        <span className="text-sm h-5 text-amber-700 font-medium">
                          {answers[q.id] ? RATING_LABELS[answers[q.id] - 1] : ""}
                        </span>
                      </div>
                    ) : q.type === "textarea" ? (
                      <Input.TextArea
                        rows={4}
                        maxLength={2000}
                        showCount
                        placeholder="Share your thoughts…"
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                      />
                    ) : (
                      <Input
                        size="large"
                        maxLength={2000}
                        placeholder="Your answer"
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                      />
                    )}
                  </section>
                );
              })}
            </div>

            <div className="sticky bottom-0 -mx-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] mt-4 bg-gradient-to-t from-[#FDF8F0] via-[#FDF8F0] to-transparent">
              <Button
                type="primary"
                size="large"
                block
                loading={submitting}
                onClick={submit}
                style={{ height: 50, borderRadius: 14, fontWeight: 600, border: "none", background: "linear-gradient(90deg,#d97706,#ea580c)" }}
              >
                Submit feedback
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatusCard({ emoji, title, text }) {
  return (
    <div className="fb-fade rounded-2xl bg-white border border-[rgba(45,24,16,0.08)] shadow-sm p-8 text-center mt-4">
      <div className="text-5xl mb-3">{emoji}</div>
      <h2 className="text-xl font-semibold m-0">{title}</h2>
      <p className="text-[#6B5744] mt-2 mb-5">{text}</p>
      <Link to="/" className="text-amber-700 font-medium">Back to home →</Link>
    </div>
  );
}

function ThankYou() {
  return (
    <div className="fb-fade rounded-2xl bg-white border border-[rgba(45,24,16,0.08)] shadow-sm p-8 text-center mt-4">
      <div className="fb-pop mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-3xl flex items-center justify-center shadow-lg shadow-amber-200">
        ✓
      </div>
      <h2 className="text-xl font-semibold mt-4 mb-1">Your feedback has been submitted</h2>
      <p className="text-[#6B5744] mb-6">Thank you for helping us make every yatra better. Hare Krishna! 🙏</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="https://wa.me/message/SDBBRJT5ZRASI1"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-[#25D366] text-white font-medium"
        >
          Chat on WhatsApp
        </a>
        <Link to="/" className="px-5 py-2.5 rounded-xl border border-amber-300 text-amber-700 font-medium">
          Explore upcoming yatras
        </Link>
      </div>
    </div>
  );
}
