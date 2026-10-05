import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Input, Rate, Result, Spin, Typography, message } from "antd";
import { API_BASE } from "./config";

const { Title, Text } = Typography;

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
        setQuestions(data.questions || []);
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
    const missing = questions.find((q) => q.required && (answers[q.id] === undefined || String(answers[q.id]).trim() === "" || answers[q.id] === 0));
    if (missing) {
      message.error(`Please answer: ${missing.label}`);
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
    } catch (e) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spin /></div>
        ) : error ? (
          <Result status="error" title="Unable to load feedback form" subTitle={error} />
        ) : done ? (
          <Result status="success" title="Thank you!" subTitle="Your feedback has been submitted. Hare Krishna!" />
        ) : !questions.length ? (
          <Result status="info" title="Feedback is not open yet" />
        ) : (
          <>
            <Title level={3} style={{ marginTop: 0 }}>Feedback{yatraName ? ` – ${yatraName}` : ""}</Title>
            <div className="flex flex-col gap-5">
              {questions.map((q) => (
                <div key={q.id}>
                  <Text strong>{q.label}{q.required && <span style={{ color: "#dc2626" }}> *</span>}</Text>
                  <div className="mt-2">
                    {q.type === "rating" ? (
                      <Rate value={answers[q.id] || 0} onChange={(v) => setAnswer(q.id, v)} />
                    ) : q.type === "textarea" ? (
                      <Input.TextArea rows={4} maxLength={2000} showCount value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} />
                    ) : (
                      <Input maxLength={2000} value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} />
                    )}
                  </div>
                </div>
              ))}
              <Button type="primary" size="large" loading={submitting} onClick={submit}>Submit</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
