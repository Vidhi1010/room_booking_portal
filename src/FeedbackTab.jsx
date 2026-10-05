import { useState, useEffect, useCallback } from "react";
import { Button, Card, Input, Select, Switch, Table, Tabs, Typography, message, Space, Empty, Popconfirm, Rate } from "antd";
import { PlusOutlined, DeleteOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { API_BASE } from "./config";

const { Title, Text } = Typography;

const TYPE_OPTIONS = [
  { label: "Short text", value: "text" },
  { label: "Long text", value: "textarea" },
  { label: "Rating (1-5)", value: "rating" },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

export default function FeedbackTab({ token, yatras, canUpdate, canRead }) {
  const [yatraId, setYatraId] = useState(undefined);
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [saving, setSaving] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [nextKey, setNextKey] = useState(null);
  const [loadingR, setLoadingR] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    if (!yatraId && yatras.length) setYatraId(yatras[0].id);
  }, [yatras, yatraId]);

  const fetchQuestions = useCallback(async () => {
    if (!yatraId) return;
    setLoadingQ(true);
    try {
      const res = await fetch(`${API_BASE}/yatra-feedback?yatra_id=${encodeURIComponent(yatraId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to load questions");
      setQuestions(data.questions || []);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoadingQ(false);
    }
  }, [yatraId]);

  const fetchResponses = useCallback(async (cursor) => {
    if (!yatraId || !canRead) return;
    setLoadingR(true);
    try {
      const params = new URLSearchParams({ yatra_id: yatraId, view: "submissions", limit: "50" });
      if (cursor) params.set("next_key", cursor);
      const res = await fetch(`${API_BASE}/yatra-feedback?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to load responses");
      setFeedbacks((prev) => (cursor ? [...prev, ...(data.feedbacks || [])] : data.feedbacks || []));
      setNextKey(data.next_key || null);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoadingR(false);
    }
  }, [yatraId, token, canRead]);

  useEffect(() => {
    setQuestions([]);
    setFeedbacks([]);
    setNextKey(null);
    fetchQuestions();
    fetchResponses();
  }, [fetchQuestions, fetchResponses]);

  const updateQ = (idx, patch) =>
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));

  const addQ = () =>
    setQuestions((qs) => [...qs, { label: "", type: "text", required: false }]);

  const save = async () => {
    if (questions.some((q) => !q.label.trim())) {
      message.error("Every question needs a label");
      return;
    }
    setSaving(true);
    try {
      const payload = questions.map((q) => {
        const item = { label: q.label.trim(), type: q.type, required: !!q.required };
        if (q.id) item.id = q.id;
        return item;
      });
      const res = await fetch(`${API_BASE}/yatra-feedback`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ yatra_id: yatraId, questions: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to save");
      message.success("Questions saved");
      if (Array.isArray(data.questions)) setQuestions(data.questions);
      else fetchQuestions();
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const labelFor = (fb, id) =>
    (fb.questions || questions).find((q) => q.id === id)?.label || id;

  const renderAnswer = (fb, id, val) => {
    const q = (fb.questions || questions).find((x) => x.id === id);
    if (q?.type === "rating") return <Rate disabled value={Number(val)} />;
    return <span style={{ whiteSpace: "pre-wrap" }}>{String(val)}</span>;
  };

  const columns = [
    { title: "Name", dataIndex: "respondent_name", width: 160, render: (v) => v || "-" },
    { title: "Submitted", dataIndex: "submitted_at", width: 170, render: fmtDate },
    {
      title: "Answers",
      dataIndex: "answers",
      render: (answers, fb) => (
        <Space direction="vertical" size={4}>
          {Object.entries(answers || {}).map(([id, val]) => (
            <div key={id}>
              <Text type="secondary">{labelFor(fb, id)}: </Text>
              {renderAnswer(fb, id, val)}
            </div>
          ))}
        </Space>
      ),
    },
  ];

  const questionsPane = (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      {!questions.length && !loadingQ && <Empty description="No questions configured (feedback disabled)" />}
      {questions.map((q, idx) => (
        <Card key={q.id || `new-${idx}`} size="small" loading={loadingQ}>
          <Space wrap align="start" style={{ width: "100%" }}>
            <Input
              style={{ width: 340, maxWidth: "100%" }}
              placeholder="Question label"
              maxLength={200}
              value={q.label}
              disabled={!canUpdate}
              onChange={(e) => updateQ(idx, { label: e.target.value })}
            />
            <Select
              style={{ width: 150 }}
              options={TYPE_OPTIONS}
              value={q.type}
              disabled={!canUpdate}
              onChange={(v) => updateQ(idx, { type: v })}
            />
            <Space>
              <Switch checked={!!q.required} disabled={!canUpdate} onChange={(v) => updateQ(idx, { required: v })} />
              <Text type="secondary">Required</Text>
            </Space>
            {canUpdate && (
              <Button danger icon={<DeleteOutlined />} onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== idx))} />
            )}
          </Space>
        </Card>
      ))}
      {canUpdate && (
        <Space>
          <Button icon={<PlusOutlined />} onClick={addQ}>Add question</Button>
          <Popconfirm
            title="Save questions?"
            description={questions.length ? "This replaces the existing question list." : "Feedback will be disabled for this yatra."}
            onConfirm={save}
          >
            <Button type="primary" icon={<SaveOutlined />} loading={saving}>Save</Button>
          </Popconfirm>
        </Space>
      )}
    </Space>
  );

  const responsesPane = (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Table
        rowKey="id"
        size="small"
        loading={loadingR}
        columns={columns}
        dataSource={feedbacks}
        pagination={false}
        scroll={{ x: true }}
      />
      {nextKey && <Button onClick={() => fetchResponses(nextKey)} loading={loadingR}>Load more</Button>}
    </Space>
  );

  const items = [{ key: "questions", label: "Questions", children: questionsPane }];
  if (canRead) items.push({ key: "responses", label: `Responses${feedbacks.length ? ` (${feedbacks.length}${nextKey ? "+" : ""})` : ""}`, children: responsesPane });

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ color: "#fff", margin: 0 }}>Feedback</Title>
          <Text style={{ color: "rgba(255,255,255,0.4)" }}>Manage feedback questions and view responses</Text>
        </div>
        <Space wrap>
          <Select
            style={{ width: 220 }}
            placeholder="Select Yatra"
            value={yatraId}
            onChange={setYatraId}
            options={yatras.map((y) => ({ label: y.name, value: y.id }))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => { fetchQuestions(); fetchResponses(); }}>Refresh</Button>
        </Space>
      </div>
      <Tabs items={items} />
    </>
  );
}
