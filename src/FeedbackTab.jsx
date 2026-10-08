import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, Input, Select, Switch, Table, Tabs, Typography, message, Space, Empty, Popconfirm, Rate, Modal } from "antd";
import { PlusOutlined, DeleteOutlined, ReloadOutlined, SaveOutlined, HolderOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { API_BASE } from "./config";

const { Title, Text } = Typography;

const TYPE_OPTIONS = [
  { label: "Short text", value: "text" },
  { label: "Long text", value: "textarea" },
  { label: "Rating (1-5)", value: "rating" },
];

const PAGE_SIZE_OPTIONS = [20, 50, 100].map((n) => ({ label: `${n} / page`, value: n }));

const sortByOrder = (qs) =>
  [...qs].sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));

const snapshot = (qs) =>
  JSON.stringify(qs.map((q) => [q.id || q._key, q.label, q.type, !!q.required]));

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

export default function FeedbackTab({ token, yatras, canUpdate, canRead }) {
  const [yatraId, setYatraId] = useState(undefined);
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [nextKey, setNextKey] = useState(null);
  // cursors[i] is the next_key used to fetch page i+1 (null for the first page)
  const [cursors, setCursors] = useState([null]);
  const [pageSize, setPageSize] = useState(50);
  const [loadingR, setLoadingR] = useState(false);
  const [viewing, setViewing] = useState(null);

  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const cardRefs = useRef([]);
  const tempKey = useRef(0);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [savedSnapshot, setSavedSnapshot] = useState(snapshot([]));
  const isDirty = snapshot(questions) !== savedSnapshot;
  const scrollToNew = useRef(false);

  const loadQuestions = (qs) => {
    const sorted = sortByOrder(qs);
    setQuestions(sorted);
    setSavedSnapshot(snapshot(sorted));
  };

  useEffect(() => {
    if (!scrollToNew.current) return;
    scrollToNew.current = false;
    const el = cardRefs.current[questions.length - 1];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.querySelector("input")?.focus({ preventScroll: true });
  }, [questions.length]);

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
      loadQuestions(data.questions || []);
      setFeedbackEnabled(data.feedback_enabled !== false);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoadingQ(false);
    }
  }, [yatraId]);

  const fetchResponses = useCallback(async (cursor) => {
    if (!yatraId || !canRead) return false;
    setLoadingR(true);
    try {
      const params = new URLSearchParams({ yatra_id: yatraId, view: "submissions", limit: String(pageSize) });
      if (cursor) params.set("next_key", cursor);
      const res = await fetch(`${API_BASE}/yatra-feedback?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to load responses");
      setFeedbacks(data.feedbacks || []);
      setNextKey(data.next_key ?? null);
      return true;
    } catch (e) {
      message.error(e.message);
      return false;
    } finally {
      setLoadingR(false);
    }
  }, [yatraId, token, canRead, pageSize]);

  const loadFirstPage = useCallback(() => {
    setCursors([null]);
    return fetchResponses(null);
  }, [fetchResponses]);

  const goNext = async () => {
    if (!nextKey) return;
    const cursor = nextKey;
    if (await fetchResponses(cursor)) setCursors((c) => [...c, cursor]);
  };

  const goPrev = async () => {
    if (cursors.length < 2) return;
    const prev = cursors.slice(0, -1);
    if (await fetchResponses(prev[prev.length - 1])) setCursors(prev);
  };

  useEffect(() => {
    loadQuestions([]);
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    setFeedbacks([]);
    setNextKey(null);
    loadFirstPage();
  }, [loadFirstPage]);

  const updateQ = (idx, patch) =>
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));

  const addQ = () => {
    scrollToNew.current = true;
    setQuestions((qs) => [
      ...qs,
      { _key: `new-${++tempKey.current}`, label: "", type: "text", required: false, order: qs.length + 1 },
    ]);
  };

  const moveQ = (from, to) => {
    if (from === null || to === null || from === to) return;
    setQuestions((qs) => {
      const next = [...qs];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((q, i) => ({ ...q, order: i + 1 }));
    });
  };

  const endDrag = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  const save = async () => {
    if (questions.some((q) => !q.label.trim())) {
      message.error("Every question needs a label");
      return;
    }
    setSaving(true);
    try {
      const payload = questions.map((q, idx) => {
        const item = { label: q.label.trim(), type: q.type, required: !!q.required, order: idx + 1 };
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
      if (Array.isArray(data.questions)) loadQuestions(data.questions);
      else fetchQuestions();
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (enabled) => {
    setToggling(true);
    try {
      const res = await fetch(`${API_BASE}/yatra-feedback`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ yatra_id: yatraId, enabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update feedback status");
      setFeedbackEnabled(typeof data.feedback_enabled === "boolean" ? data.feedback_enabled : enabled);
      message.success(enabled ? "Feedback enabled" : "Feedback disabled");
    } catch (e) {
      message.error(e.message);
    } finally {
      setToggling(false);
    }
  };

  const labelFor = (fb, id) =>
    (fb.questions || questions).find((q) => q.id === id)?.label || id;

  const typeFor = (fb, id) => (fb.questions || questions).find((x) => x.id === id)?.type;

  const clamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-wrap" };

  const renderPreview = (answers, fb) => {
    const entries = Object.entries(answers || {});
    if (!entries.length) return <Text type="secondary">-</Text>;
    const ratings = entries.filter(([id]) => typeFor(fb, id) === "rating").slice(0, 2);
    const shown = ratings.length ? ratings : entries.slice(0, 1);
    const hidden = entries.length - shown.length;
    return (
      <div style={{ cursor: "pointer" }}>
        {shown.map(([id, val]) =>
          typeFor(fb, id) === "rating" ? (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Text type="secondary" ellipsis style={{ maxWidth: 260 }}>{labelFor(fb, id)}:</Text>
              <Rate disabled value={Number(val)} style={{ fontSize: 14, whiteSpace: "nowrap" }} />
            </div>
          ) : (
            <div key={id} style={clamp2}>
              <Text type="secondary">{labelFor(fb, id)}: </Text>
              {String(val)}
            </div>
          )
        )}
        {hidden > 0 && <Text type="secondary" style={{ fontSize: 12, color: "#1677ff" }}>View all {entries.length} answers</Text>}
      </div>
    );
  };

  const columns = [
    { title: "Name", dataIndex: "respondent_name", width: 160, render: (v) => v || "-" },
    { title: "Submitted", dataIndex: "submitted_at", width: 170, render: fmtDate },
    { title: "Answers", dataIndex: "answers", render: renderPreview },
  ];

  const questionsPane = (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Card size="small">
        <Space wrap>
          <Switch
            checked={feedbackEnabled}
            loading={toggling}
            disabled={!canUpdate || loadingQ}
            onChange={toggleEnabled}
          />
          <Text strong>{feedbackEnabled ? "Feedback is active" : "Feedback is not active"}</Text>
          <Text type="secondary">
            {feedbackEnabled ? "Users can submit feedback for this yatra." : "Users will see “Feedback is not active yet”."}
          </Text>
        </Space>
      </Card>
      {canUpdate && (
        <Space>
          <Button icon={<PlusOutlined />} onClick={addQ}>Add question</Button>
          <Popconfirm
            title="Save questions?"
            description={questions.length ? "This replaces the existing question list." : "This removes all questions for this yatra."}
            onConfirm={save}
            disabled={!isDirty || saving}
          >
            <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={!isDirty}>Save</Button>
          </Popconfirm>
          {questions.length > 1 && <Text type="secondary">Drag the handle to reorder questions</Text>}
        </Space>
      )}
      {!questions.length && !loadingQ && <Empty description="No questions configured" />}
      {questions.map((q, idx) => (
        <div
          key={q.id || q._key}
          ref={(el) => (cardRefs.current[idx] = el)}
          onDragOver={(e) => {
            if (dragIdx === null) return;
            e.preventDefault();
            if (overIdx !== idx) setOverIdx(idx);
          }}
          onDrop={(e) => {
            e.preventDefault();
            moveQ(dragIdx, idx);
            endDrag();
          }}
          style={{
            opacity: dragIdx === idx ? 0.4 : 1,
            borderTop: overIdx === idx && dragIdx !== null && dragIdx > idx ? "2px solid #1677ff" : "2px solid transparent",
            borderBottom: overIdx === idx && dragIdx !== null && dragIdx < idx ? "2px solid #1677ff" : "2px solid transparent",
          }}
        >
        <Card size="small" loading={loadingQ}>
          <Space wrap align="start" style={{ width: "100%" }}>
            {canUpdate && (
              <span
                draggable
                title="Drag to reorder"
                onDragStart={(e) => {
                  setDragIdx(idx);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(idx));
                  if (cardRefs.current[idx]) e.dataTransfer.setDragImage(cardRefs.current[idx], 20, 20);
                }}
                onDragEnd={endDrag}
                style={{ cursor: "grab", padding: "5px 4px", display: "inline-flex" }}
              >
                <HolderOutlined />
              </span>
            )}
            <Text type="secondary" style={{ lineHeight: "32px", minWidth: 24 }}>#{idx + 1}</Text>
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
        </div>
      ))}
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
        onRow={(fb) => ({ onClick: () => setViewing(fb), style: { cursor: "pointer" } })}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Select
          style={{ width: 120 }}
          options={PAGE_SIZE_OPTIONS}
          value={pageSize}
          onChange={setPageSize}
          disabled={loadingR}
        />
        <Button icon={<LeftOutlined />} onClick={goPrev} disabled={loadingR || cursors.length < 2} />
        <Text type="secondary">Page {cursors.length}</Text>
        <Button icon={<RightOutlined />} onClick={goNext} disabled={loadingR || !nextKey} />
      </div>
    </Space>
  );

  const items = [{ key: "questions", label: "Questions", children: questionsPane }];
  if (canRead) items.push({ key: "responses", label: "Responses", children: responsesPane });

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
          <Button icon={<ReloadOutlined />} onClick={() => { fetchQuestions(); loadFirstPage(); }}>Refresh</Button>
        </Space>
      </div>
      <Tabs items={items} />
      <Modal
        open={!!viewing}
        onCancel={() => setViewing(null)}
        footer={null}
        title={viewing ? `${viewing.respondent_name || "Anonymous"} · ${fmtDate(viewing.submitted_at)}` : ""}
        width={640}
      >
        {viewing && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {Object.entries(viewing.answers || {})
              .filter(([id]) => String(labelFor(viewing, id)).trim().toLowerCase() !== "name")
              .map(([id, val]) => (
                <div key={id}>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>{labelFor(viewing, id)}</Text>
                  <div style={{ border: "1px solid rgba(128,128,128,0.35)", borderRadius: 6, padding: "6px 11px" }}>
                    {typeFor(viewing, id) === "rating" ? (
                      <Rate disabled value={Number(val)} />
                    ) : (
                      <Text style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{String(val)}</Text>
                    )}
                  </div>
                </div>
              ))}
          </Space>
        )}
      </Modal>
    </>
  );
}
