import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tabs, Table, Tag, Select, Input, InputNumber, Button, Typography,
  message, Modal, Form, Card, Statistic, Space, Empty, Spin, Popconfirm, DatePicker, Badge, Checkbox, Divider, Row, Col,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, EditOutlined, SwapOutlined, FolderOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { API_BASE } from "./config";

const { Title, Text } = Typography;

const ACCOUNT_TYPE_COLORS = { razorpay: "blue", bank: "green", cash: "gold", person: "purple", other: "default" };
const TXN_TYPE_COLORS = { expense_payment: "red", collection: "green", transfer: "blue" };
const TXN_TYPE_LABELS = { expense_payment: "Expense Payment", collection: "Collection", transfer: "Transfer" };
const EXPENSE_STATUS_COLORS = { unpaid: "red", partially_paid: "orange", fully_paid: "green" };
const COLLECTION_STATUS_COLORS = { pending: "red", partially_received: "orange", fully_received: "green" };

const fmtAmount = (v) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "-";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

export default function AccountsTab({ token }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const isStacked = useIsMobile(991); // below Ant Design lg
  const modalWidth = (desktop) => (isMobile ? "calc(100vw - 24px)" : desktop);
  const formGrid = isMobile ? "1fr" : "1fr 1fr";

  const [expenseCategories, setExpenseCategories] = useState([]);
  const [collectionCategories, setCollectionCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [collections, setCollections] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [innerTab, setInnerTab] = useState("overview");

  // Expense modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm] = Form.useForm();
  const [savingExpense, setSavingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [expenseDetailOpen, setExpenseDetailOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expensePayments, setExpensePayments] = useState([]);
  const [expensePaymentsLoading, setExpensePaymentsLoading] = useState(false);

  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [addPaymentForm] = Form.useForm();
  const [savingPayment, setSavingPayment] = useState(false);

  // Collection modals
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionForm] = Form.useForm();
  const [savingCollectionItem, setSavingCollectionItem] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  const [collectionDetailOpen, setCollectionDetailOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionReceipts, setCollectionReceipts] = useState([]);
  const [collectionReceiptsLoading, setCollectionReceiptsLoading] = useState(false);

  const [addReceiptOpen, setAddReceiptOpen] = useState(false);
  const [addReceiptForm] = Form.useForm();
  const [savingReceipt, setSavingReceipt] = useState(false);

  // Transfer modal
  const [addTransferOpen, setAddTransferOpen] = useState(false);
  const [addTransferForm] = Form.useForm();
  const [savingTransfer, setSavingTransfer] = useState(false);

  // Account modal
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountForm] = Form.useForm();
  const [savingAccount, setSavingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // Category modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm] = Form.useForm();
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryType, setCategoryType] = useState("expense");
  const [editingCategory, setEditingCategory] = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const handleAuthError = useCallback((res) => {
    if (res.status === 401 || res.status === 403) {
      message.error("Session expired. Please login again.");
      localStorage.removeItem("admin_token");
      navigate("/admin/login", { replace: true });
      return true;
    }
    return false;
  }, [navigate]);

  // ── Fetchers ──
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try { const res = await fetch(`${API_BASE}/accounts-manage?action=get-accounts-summary`, { headers: authHeaders }); if (handleAuthError(res)) return; setSummary(await res.json()); }
    catch { message.error("Failed to fetch summary"); } finally { setSummaryLoading(false); }
  }, [token]);

  const fetchExpenseCategories = useCallback(async () => {
    try { const res = await fetch(`${API_BASE}/accounts-config?action=get-expense-categories`, { headers: authHeaders }); if (handleAuthError(res)) return; setExpenseCategories((await res.json()).categories || []); } catch {}
  }, [token]);

  const fetchCollectionCategories = useCallback(async () => {
    try { const res = await fetch(`${API_BASE}/accounts-config?action=get-collection-categories`, { headers: authHeaders }); if (handleAuthError(res)) return; setCollectionCategories((await res.json()).categories || []); } catch {}
  }, [token]);

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try { const res = await fetch(`${API_BASE}/accounts-manage?action=get-accounts`, { headers: authHeaders }); if (handleAuthError(res)) return; setAccounts((await res.json()).accounts || []); } catch {}
    finally { setAccountsLoading(false); }
  }, [token]);

  const fetchExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try { const res = await fetch(`${API_BASE}/accounts-expenses?action=get-expenses`, { headers: authHeaders }); if (handleAuthError(res)) return; setExpenses((await res.json()).expenses || []); }
    catch { message.error("Failed to fetch expenses"); } finally { setExpensesLoading(false); }
  }, [token]);

  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try { const res = await fetch(`${API_BASE}/accounts-collections?action=get-collections`, { headers: authHeaders }); if (handleAuthError(res)) return; setCollections((await res.json()).collections || []); }
    catch { message.error("Failed to fetch collections"); } finally { setCollectionsLoading(false); }
  }, [token]);

  const fetchTransactions = useCallback(async (type) => {
    setTxnsLoading(true);
    try { const params = new URLSearchParams({ action: "get-transactions" }); if (type) params.set("type", type); const res = await fetch(`${API_BASE}/accounts-transactions?${params}`, { headers: authHeaders }); if (handleAuthError(res)) return; setTransactions((await res.json()).transactions || []); }
    catch { message.error("Failed to fetch transactions"); } finally { setTxnsLoading(false); }
  }, [token]);

  const fetchExpensePayments = useCallback(async (id) => {
    setExpensePaymentsLoading(true);
    try { const res = await fetch(`${API_BASE}/accounts-transactions?action=get-transactions&expense_id=${id}`, { headers: authHeaders }); if (handleAuthError(res)) return; setExpensePayments((await res.json()).transactions || []); } catch {}
    finally { setExpensePaymentsLoading(false); }
  }, [token]);

  const fetchCollectionReceipts = useCallback(async (id) => {
    setCollectionReceiptsLoading(true);
    try { const res = await fetch(`${API_BASE}/accounts-transactions?action=get-transactions&collection_id=${id}`, { headers: authHeaders }); if (handleAuthError(res)) return; setCollectionReceipts((await res.json()).transactions || []); } catch {}
    finally { setCollectionReceiptsLoading(false); }
  }, [token]);

  useEffect(() => { fetchExpenseCategories(); fetchCollectionCategories(); fetchAccounts(); }, []);
  useEffect(() => {
    if (innerTab === "overview") fetchSummary();
    if (innerTab === "expenses") fetchExpenses();
    if (innerTab === "collections") fetchCollections();
    if (innerTab === "transfers") fetchTransactions("transfer");
    if (innerTab === "accounts") fetchAccounts();
  }, [innerTab]);

  // ── Groupings ──
  const expensesByCategory = useMemo(() => {
    const map = {};
    for (const cat of expenseCategories) map[cat.id] = { category: cat, items: [], total: 0, paid: 0 };
    for (const e of expenses) {
      if (!map[e.category_id]) map[e.category_id] = { category: { id: e.category_id, name: e.category_name, sub_categories: [] }, items: [], total: 0, paid: 0 };
      map[e.category_id].items.push(e);
      map[e.category_id].total += e.total_amount || 0;
      map[e.category_id].paid += e.paid_amount || 0;
    }
    return Object.values(map);
  }, [expenses, expenseCategories]);

  const collectionsByCategory = useMemo(() => {
    const map = {};
    for (const cat of collectionCategories) map[cat.id] = { category: cat, items: [], total: 0, received: 0 };
    for (const c of collections) {
      if (!map[c.category_id]) map[c.category_id] = { category: { id: c.category_id, name: c.category_name, sub_categories: [] }, items: [], total: 0, received: 0 };
      map[c.category_id].items.push(c);
      map[c.category_id].total += c.total_amount || 0;
      map[c.category_id].received += c.received_amount || 0;
    }
    return Object.values(map);
  }, [collections, collectionCategories]);

  // ── API Actions ──
  const apiPost = async (url, action, body) => {
    const res = await fetch(`${API_BASE}${url}`, { method: "POST", headers: authHeaders, body: JSON.stringify({ action, ...body }) });
    if (handleAuthError(res)) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const refreshAll = () => { fetchExpenses(); fetchCollections(); fetchAccounts(); fetchSummary(); };

  const submitExpense = async (values) => {
    setSavingExpense(true);
    try {
      const cat = expenseCategories.find(c => c.id === values.category_id);
      if (!cat) { message.error("Category not found — please refresh and try again"); setSavingExpense(false); return; }
      const dateStr = values.date?.format("YYYY-MM-DD");
      const result = await apiPost("/accounts-expenses", "save-expense", { ...values, id: editingExpense?.id, category_name: cat.name, date: dateStr });

      // If "also record payment" is checked and this is a new expense
      if (!editingExpense && values.record_payment && values.payment_account_id && result?.expense?.id) {
        const paymentAmount = values.payment_amount || values.total_amount;
        await apiPost("/accounts-transactions", "add-expense-payment", {
          expense_id: result.expense.id,
          amount: paymentAmount,
          from_account_id: values.payment_account_id,
          date: dateStr,
          notes: values.payment_notes || null,
        });
      }

      message.success(editingExpense ? "Expense updated" : "Expense saved");
      setExpenseModalOpen(false); expenseForm.resetFields(); setEditingExpense(null);
      refreshAll();
    } catch (e) { message.error(e.message); } finally { setSavingExpense(false); }
  };

  const deleteExpense = async (id) => {
    try { await apiPost("/accounts-expenses", "delete-expense", { id }); message.success("Expense deleted"); refreshAll(); } catch (e) { message.error(e.message); }
  };

  const submitPayment = async (values) => {
    setSavingPayment(true);
    try {
      await apiPost("/accounts-transactions", "add-expense-payment", { ...values, expense_id: selectedExpense.id, date: values.date?.format("YYYY-MM-DD") });
      message.success("Payment added");
      setAddPaymentOpen(false); addPaymentForm.resetFields();
      fetchExpensePayments(selectedExpense.id); refreshAll();
    } catch (e) { message.error(e.message); } finally { setSavingPayment(false); }
  };

  const submitCollectionItem = async (values) => {
    setSavingCollectionItem(true);
    try {
      const cat = collectionCategories.find(c => c.id === values.category_id);
      if (!cat) { message.error("Category not found — please refresh and try again"); setSavingCollectionItem(false); return; }
      const dateStr = values.date?.format("YYYY-MM-DD");
      const result = await apiPost("/accounts-collections", "save-collection", { ...values, id: editingCollection?.id, category_name: cat.name, date: dateStr });

      // If "also record receipt" is checked and this is a new collection
      if (!editingCollection && values.record_receipt && values.receipt_account_id && result?.collection?.id) {
        const receiptAmount = values.receipt_amount || values.total_amount;
        await apiPost("/accounts-transactions", "add-collection", {
          collection_id: result.collection.id,
          amount: receiptAmount,
          to_account_id: values.receipt_account_id,
          date: dateStr,
          notes: values.receipt_notes || null,
        });
      }

      message.success(editingCollection ? "Collection updated" : "Collection saved");
      setCollectionModalOpen(false); collectionForm.resetFields(); setEditingCollection(null);
      refreshAll();
    } catch (e) { message.error(e.message); } finally { setSavingCollectionItem(false); }
  };

  const deleteCollectionItem = async (id) => {
    try { await apiPost("/accounts-collections", "delete-collection", { id }); message.success("Collection deleted"); refreshAll(); } catch (e) { message.error(e.message); }
  };

  const submitReceipt = async (values) => {
    setSavingReceipt(true);
    try {
      await apiPost("/accounts-transactions", "add-collection", { ...values, collection_id: selectedCollection.id, date: values.date?.format("YYYY-MM-DD") });
      message.success("Receipt added");
      setAddReceiptOpen(false); addReceiptForm.resetFields();
      fetchCollectionReceipts(selectedCollection.id); refreshAll();
    } catch (e) { message.error(e.message); } finally { setSavingReceipt(false); }
  };

  const submitTransfer = async (values) => {
    setSavingTransfer(true);
    try {
      await apiPost("/accounts-transactions", "add-transfer", { ...values, date: values.date?.format("YYYY-MM-DD") });
      message.success("Transfer recorded");
      setAddTransferOpen(false); addTransferForm.resetFields();
      fetchTransactions("transfer"); fetchAccounts(); fetchSummary();
    } catch (e) { message.error(e.message); } finally { setSavingTransfer(false); }
  };

  const deleteTransaction = async (id) => {
    try {
      await apiPost("/accounts-transactions", "delete-transaction", { id });
      message.success("Transaction deleted");
      if (selectedExpense) fetchExpensePayments(selectedExpense.id);
      if (selectedCollection) fetchCollectionReceipts(selectedCollection.id);
      refreshAll(); if (innerTab === "transfers") fetchTransactions("transfer");
    } catch (e) { message.error(e.message); }
  };

  const submitAccount = async (values) => {
    setSavingAccount(true);
    try {
      await apiPost("/accounts-manage", "save-account", { ...values, id: editingAccount?.id });
      message.success(editingAccount ? "Account updated" : "Account saved");
      setAccountModalOpen(false); accountForm.resetFields(); setEditingAccount(null); fetchAccounts();
    } catch (e) { message.error(e.message); } finally { setSavingAccount(false); }
  };

  const deleteAccount = async (id) => {
    try { await apiPost("/accounts-manage", "delete-account", { id }); message.success("Account deleted"); fetchAccounts(); } catch (e) { message.error(e.message); }
  };

  const submitCategory = async (values) => {
    setSavingCategory(true);
    try {
      const action = categoryType === "expense" ? "save-expense-category" : "save-collection-category";
      await apiPost("/accounts-config", action, { ...values, id: editingCategory?.id, sub_categories: (values.sub_categories || "").split(",").map(s => s.trim()).filter(Boolean) });
      message.success(editingCategory ? "Category updated" : "Category saved");
      setCategoryModalOpen(false); categoryForm.resetFields(); setEditingCategory(null);
      if (categoryType === "expense") fetchExpenseCategories(); else fetchCollectionCategories();
    } catch (e) { message.error(e.message); } finally { setSavingCategory(false); }
  };

  const deleteCategory = async (id, type) => {
    try {
      await apiPost("/accounts-config", type === "expense" ? "delete-expense-category" : "delete-collection-category", { id });
      message.success("Category deleted");
      if (type === "expense") fetchExpenseCategories(); else fetchCollectionCategories();
    } catch (e) { message.error(e.message); }
  };

  // ── Open helpers ──
  const openExpenseDetail = (e) => { setSelectedExpense(e); setExpenseDetailOpen(true); fetchExpensePayments(e.id); };
  const openCollectionDetail = (c) => { setSelectedCollection(c); setCollectionDetailOpen(true); fetchCollectionReceipts(c.id); };

  const openEditExpense = (e) => {
    setEditingExpense(e);
    setExpenseModalOpen(true);
    setTimeout(() => expenseForm.setFieldsValue({ ...e, date: e.date ? dayjs(e.date) : undefined }), 0);
  };

  const openEditCollection = (c) => {
    setEditingCollection(c);
    setCollectionModalOpen(true);
    setTimeout(() => collectionForm.setFieldsValue({ ...c, date: c.date ? dayjs(c.date) : undefined }), 0);
  };

  const openAddExpenseForCategory = (catId) => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
    setTimeout(() => expenseForm.setFieldsValue({ category_id: catId }), 0);
  };

  const openAddCollectionForCategory = (catId) => {
    setEditingCollection(null);
    setCollectionModalOpen(true);
    setTimeout(() => collectionForm.setFieldsValue({ category_id: catId }), 0);
  };

  const openEditCategory = (cat, type) => {
    setCategoryType(type);
    setEditingCategory(cat);
    setCategoryModalOpen(true);
    setTimeout(() => categoryForm.setFieldsValue({ name: cat.name, sub_categories: (cat.sub_categories || []).join(", ") }), 0);
  };

  const openEditAccount = (acc) => {
    setEditingAccount(acc);
    setAccountModalOpen(true);
    setTimeout(() => accountForm.setFieldsValue(acc), 0);
  };

  const getSubCategories = (categoryId, list) => {
    const cat = list.find(c => c.id === categoryId);
    return (cat?.sub_categories || []).map(s => ({ label: s, value: s }));
  };

  // ── Column defs ──
  const expenseColsInSubCat = [
    { title: "Description", dataIndex: "description", key: "desc", ellipsis: true },
    { title: "Total", dataIndex: "total_amount", key: "total", width: 130, render: fmtAmount },
    { title: "Paid", dataIndex: "paid_amount", key: "paid", width: 130, render: fmtAmount },
    { title: "Status", dataIndex: "status", key: "status", width: 140, render: (s) => <Tag color={EXPENSE_STATUS_COLORS[s]}>{s?.replace(/_/g, " ").toUpperCase()}</Tag> },
  ];

  const collectionColsInSubCat = [
    { title: "Description", key: "desc", render: (_, r) => <span>{r.description} {r.booking_id && <Tag color="blue" style={{ marginLeft: 4 }}>Booking</Tag>}</span> },
    { title: "Expected", dataIndex: "total_amount", key: "total", width: 130, render: fmtAmount },
    { title: "Received", dataIndex: "received_amount", key: "recv", width: 130, render: fmtAmount },
    { title: "Status", dataIndex: "status", key: "status", width: 160, render: (s) => <Tag color={COLLECTION_STATUS_COLORS[s]}>{s?.replace(/_/g, " ").toUpperCase()}</Tag> },
  ];

  // Group items by sub-category, returns array of { subCategory, items, total, paid/received }
  const groupBySubCategory = (items, type) => {
    const isExpense = type === "expense";
    const map = {};
    for (const item of items) {
      const sub = item.sub_category || "(No sub-category)";
      if (!map[sub]) map[sub] = { subCategory: sub, items: [], total: 0, secondary: 0 };
      map[sub].items.push(item);
      map[sub].total += item.total_amount || 0;
      map[sub].secondary += (isExpense ? item.paid_amount : item.received_amount) || 0;
    }
    return Object.values(map);
  };

  const transferCols = [
    { title: "Date", dataIndex: "date", key: "date", width: 110, render: fmtDate },
    { title: "From", dataIndex: "from_account_name", key: "from", width: 150 },
    { title: "To", dataIndex: "to_account_name", key: "to", width: 150 },
    { title: "Amount", dataIndex: "amount", key: "amount", width: 120, render: fmtAmount },
    { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true, render: (v) => v || "-" },
    { title: "", key: "actions", width: 60, render: (_, r) => (
      <Popconfirm title="Delete?" onConfirm={() => deleteTransaction(r.id)}><Button size="small" type="link" danger><DeleteOutlined /></Button></Popconfirm>
    )},
  ];

  const accountCols = [
    { title: "Name", dataIndex: "name", key: "name", width: 180 },
    { title: "Type", dataIndex: "type", key: "type", width: 110, render: (t) => <Tag color={ACCOUNT_TYPE_COLORS[t]}>{t?.toUpperCase()}</Tag> },
    { title: "Balance", dataIndex: "balance", key: "balance", width: 140, render: (v) => <span style={{ color: v >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>{fmtAmount(v)}</span> },
    { title: "Contact", dataIndex: "contact", key: "contact", width: 140, render: (v) => v || "-" },
    { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true, render: (v) => v || "-" },
    { title: "", key: "actions", width: 80, render: (_, r) => (
      <Space>
        <Button size="small" type="link" onClick={() => openEditAccount(r)}><EditOutlined /></Button>
        <Popconfirm title="Delete?" onConfirm={() => deleteAccount(r.id)}><Button size="small" type="link" danger><DeleteOutlined /></Button></Popconfirm>
      </Space>
    )},
  ];

  // ── Category card renderer with sub-category grouping ──
  const renderCategoryItems = (items, type) => {
    const isExpense = type === "expense";
    if (isMobile) {
      return (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((r) => (
            <div
              key={r.id}
              onClick={() => (isExpense ? openExpenseDetail(r) : openCollectionDetail(r))}
              style={{
                padding: "8px 10px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 6,
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.3, wordBreak: "break-word" }}>
                    {r.description}
                    {!isExpense && r.booking_id && <Tag color="blue" style={{ marginLeft: 6 }}>Booking</Tag>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtAmount(isExpense ? r.paid_amount : r.received_amount)}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                    of {fmtAmount(r.total_amount)}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 4 }}>
                <Tag color={isExpense ? EXPENSE_STATUS_COLORS[r.status] : COLLECTION_STATUS_COLORS[r.status]} style={{ fontSize: 11, lineHeight: "18px", margin: 0 }}>
                  {r.status?.replace(/_/g, " ").toUpperCase()}
                </Tag>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <Table
        size="middle"
        columns={isExpense ? expenseColsInSubCat : collectionColsInSubCat}
        dataSource={items}
        rowKey="id"
        pagination={false}
        scroll={{ x: 560 }}
        onRow={(r) => ({
          onClick: () => (isExpense ? openExpenseDetail(r) : openCollectionDetail(r)),
          style: { cursor: "pointer" },
        })}
      />
    );
  };

  const renderCategoryCard = (group, type) => {
    const { category, items, total } = group;
    const isExpense = type === "expense";
    const paid = isExpense ? group.paid : group.received;
    const remaining = total - paid;
    const subGroups = groupBySubCategory(items, type);
    const hasSubCategories = subGroups.length > 1 || (subGroups.length === 1 && subGroups[0].subCategory !== "(No sub-category)");

    return (
      <Card key={category.id} style={{ background: "#141720" }}
        styles={{
          header: { borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: isMobile ? "auto" : 48, padding: isMobile ? "8px 10px" : "10px 14px" },
          body: { padding: isMobile ? "8px 10px" : "12px 14px" },
        }}
        title={
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <FolderOutlined style={{ color: isExpense ? "#d97706" : "#4ade80", fontSize: 16, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 15, wordBreak: "break-word" }}>{category.name}</span>
              <Badge count={items.length} style={{ backgroundColor: "#1a1e2e", color: "rgba(255,255,255,0.6)", boxShadow: "none" }} />
            </div>
            {isMobile && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                  {fmtAmount(paid)} / {fmtAmount(total)}
                  {remaining > 0 && <span style={{ color: "#f87171", marginLeft: 6 }}>({isExpense ? "due" : "pending"}: {fmtAmount(remaining)})</span>}
                </Text>
                <Space size={0}>
                  <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => isExpense ? openAddExpenseForCategory(category.id) : openAddCollectionForCategory(category.id)}>Add</Button>
                  <Button size="small" type="link" onClick={() => openEditCategory(category, type)}><EditOutlined /></Button>
                  <Popconfirm title="Delete this category?" onConfirm={() => deleteCategory(category.id, type)}>
                    <Button size="small" type="link" danger><DeleteOutlined /></Button>
                  </Popconfirm>
                </Space>
              </div>
            )}
          </div>
        }
        extra={isMobile ? null : (
          <Space size="middle" wrap>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
              {fmtAmount(paid)} / {fmtAmount(total)}
              {remaining > 0 && <span style={{ color: "#f87171", marginLeft: 6 }}>({isExpense ? "due" : "pending"}: {fmtAmount(remaining)})</span>}
            </Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => isExpense ? openAddExpenseForCategory(category.id) : openAddCollectionForCategory(category.id)}>Add</Button>
            <Button type="link" onClick={() => openEditCategory(category, type)}><EditOutlined /></Button>
            <Popconfirm title="Delete this category?" onConfirm={() => deleteCategory(category.id, type)}>
              <Button type="link" danger><DeleteOutlined /></Button>
            </Popconfirm>
          </Space>
        )}
      >
        {items.length === 0 ? <Empty description={`No ${isExpense ? "expenses" : "collections"}`} image={Empty.PRESENTED_IMAGE_SIMPLE} /> :
          hasSubCategories ? (
            subGroups.map(sg => (
              <div key={sg.subCategory} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
                  <Space>
                    <Text style={{ fontWeight: 500, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{sg.subCategory}</Text>
                    <Badge count={sg.items.length} style={{ backgroundColor: "#1a1e2e", color: "rgba(255,255,255,0.5)", boxShadow: "none" }} />
                  </Space>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                    {fmtAmount(sg.secondary)} / {fmtAmount(sg.total)}
                  </Text>
                </div>
                {renderCategoryItems(sg.items, type)}
              </div>
            ))
          ) : (
            renderCategoryItems(items, type)
          )
        }
      </Card>
    );
  };

  // ── Form modal for expense/collection (shared pattern) ──
  const renderItemFormModal = (type) => {
    const isExpense = type === "expense";
    const open = isExpense ? expenseModalOpen : collectionModalOpen;
    const setOpen = isExpense ? setExpenseModalOpen : setCollectionModalOpen;
    const form = isExpense ? expenseForm : collectionForm;
    const saving = isExpense ? savingExpense : savingCollectionItem;
    const editing = isExpense ? editingExpense : editingCollection;
    const setEditing = isExpense ? setEditingExpense : setEditingCollection;
    const onFinish = isExpense ? submitExpense : submitCollectionItem;
    const cats = isExpense ? expenseCategories : collectionCategories;

    return (
      <Modal open={open} onCancel={() => { setOpen(false); form.resetFields(); setEditing(null); }} footer={null}
        title={`${editing ? "Edit" : "Add"} ${isExpense ? "Expense" : "Collection"}`} destroyOnClose
        width={modalWidth(520)} centered={!isMobile} style={isMobile ? { top: 12 } : undefined}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ date: dayjs() }}>
          <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
            <Select placeholder="Select category" options={cats.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.category_id !== cur.category_id}>
            {({ getFieldValue }) => {
              const subs = getSubCategories(getFieldValue("category_id"), cats);
              return subs.length > 0 ? <Form.Item name="sub_category" label="Sub-category"><Select placeholder="Sub-category" allowClear options={subs} /></Form.Item> : null;
            }}
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: formGrid, gap: 12 }}>
            <Form.Item name="total_amount" label={`${isExpense ? "Total" : "Expected"} Amount (₹)`} rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} min={0} /></Form.Item>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          </div>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={1} /></Form.Item>

          {/* Optional: record transaction at the same time (only for new items) */}
          {!editing && (
            <>
              <Divider style={{ margin: "12px 0", borderColor: "rgba(255,255,255,0.08)" }} />
              <Form.Item name={isExpense ? "record_payment" : "record_receipt"} valuePropName="checked" style={{ marginBottom: 8 }}>
                <Checkbox>{isExpense ? "Also record payment" : "Also record receipt"}</Checkbox>
              </Form.Item>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const checked = getFieldValue(isExpense ? "record_payment" : "record_receipt");
                  if (!checked) return null;
                  return (
                    <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: formGrid, gap: 12 }}>
                        <Form.Item name={isExpense ? "payment_account_id" : "receipt_account_id"} label={isExpense ? "Paid from" : "Received in"} rules={[{ required: true, message: "Select an account" }]}>
                          <Select placeholder="Select account" options={accounts.map(a => ({ label: `${a.name} (${fmtAmount(a.balance)})`, value: a.id }))} />
                        </Form.Item>
                        <Form.Item name={isExpense ? "payment_amount" : "receipt_amount"} label="Amount (₹)" tooltip="Leave blank to use full amount">
                          <InputNumber style={{ width: "100%" }} min={1} placeholder="Full amount" />
                        </Form.Item>
                      </div>
                      <Form.Item name={isExpense ? "payment_notes" : "receipt_notes"} label="Transaction notes" style={{ marginBottom: 0 }}>
                        <Input placeholder="Optional" />
                      </Form.Item>
                    </div>
                  );
                }}
              </Form.Item>
            </>
          )}

          <Form.Item style={{ textAlign: "right", marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button onClick={() => { setOpen(false); form.resetFields(); setEditing(null); }}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving}>{editing ? "Update" : "Save"}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  const renderTotalsSidebar = (stats) => (
    <Card
      size="small"
      style={{ background: "#141720" }}
      styles={{ body: { padding: isStacked ? "8px 10px" : "12px 14px" } }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isStacked ? "repeat(3, minmax(0, 1fr))" : "1fr",
          gap: isStacked ? 0 : 10,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.title}
            style={{
              textAlign: isStacked ? "center" : "left",
              borderBottom: !isStacked && i < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              paddingBottom: !isStacked && i < stats.length - 1 ? 10 : 0,
              borderLeft: isStacked && i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
              paddingLeft: isStacked && i > 0 ? 8 : 0,
              paddingRight: isStacked && i < stats.length - 1 ? 8 : 0,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 2 }}>{s.title}</div>
            <div style={{ color: s.color, fontWeight: 600, fontSize: isStacked ? 13 : 18, lineHeight: 1.2 }}>
              {fmtAmount(s.value)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="accounts-tab" style={{ padding: isMobile ? "0" : "0 4px", overflowX: "hidden" }}>
      <Tabs
        activeKey={innerTab}
        onChange={setInnerTab}
        size={isMobile ? "small" : "middle"}
        style={{ marginBottom: 16 }}
        tabBarStyle={isMobile ? { marginBottom: 12 } : undefined}
        items={[
          { key: "overview", label: "Overview" },
          { key: "expenses", label: "Expenses" },
          { key: "collections", label: "Collections" },
          { key: "transfers", label: "Transfers" },
          { key: "accounts", label: "Accounts" },
        ]}
      />

      {/* ── Overview ── */}
      {innerTab === "overview" && (
        <Spin spinning={summaryLoading}>
          {summary ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "140px" : "200px"}, 1fr))`, gap: isMobile ? 10 : 16, marginBottom: 24 }}>
                <Card size="small" style={{ background: "#141720" }}>
                  <Statistic title={<span style={{ color: "rgba(255,255,255,0.5)", fontSize: isMobile ? 11 : undefined }}>Collections Received</span>} value={summary.total_collections_received} prefix="₹" valueStyle={{ color: "#4ade80", fontSize: isMobile ? 18 : undefined }} />
                </Card>
                <Card size="small" style={{ background: "#141720" }}>
                  <Statistic title={<span style={{ color: "rgba(255,255,255,0.5)", fontSize: isMobile ? 11 : undefined }}>Collections Pending</span>} value={summary.total_collections_pending} prefix="₹" valueStyle={{ color: "#fbbf24", fontSize: isMobile ? 18 : undefined }} />
                </Card>
                <Card size="small" style={{ background: "#141720" }}>
                  <Statistic title={<span style={{ color: "rgba(255,255,255,0.5)", fontSize: isMobile ? 11 : undefined }}>Expenses Total</span>} value={summary.total_expenses} prefix="₹" valueStyle={{ color: "#f87171", fontSize: isMobile ? 18 : undefined }} />
                </Card>
                <Card size="small" style={{ background: "#141720" }}>
                  <Statistic title={<span style={{ color: "rgba(255,255,255,0.5)", fontSize: isMobile ? 11 : undefined }}>Expenses Outstanding</span>} value={summary.outstanding} prefix="₹" valueStyle={{ color: "#f87171", fontSize: isMobile ? 18 : undefined }} />
                </Card>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "100%" : "280px"}, 1fr))`, gap: 16, marginBottom: 24 }}>
                <Card size="small" title="Account Balances" style={{ background: "#141720" }} styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}>
                  {(summary.account_balances || []).length === 0 ? <Empty description="No accounts" /> :
                    (summary.account_balances || []).map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ minWidth: 0, wordBreak: "break-word" }}>{a.name} <Tag color={ACCOUNT_TYPE_COLORS[a.type]} style={{ marginLeft: 4, fontSize: 10 }}>{a.type}</Tag></span>
                        <span style={{ color: a.balance >= 0 ? "#4ade80" : "#f87171", fontWeight: 600, flexShrink: 0 }}>{fmtAmount(a.balance)}</span>
                      </div>
                    ))}
                </Card>
                <Card size="small" title="Expense by Category" style={{ background: "#141720" }} styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}>
                  {Object.keys(summary.expense_category_breakdown || {}).length === 0 ? <Empty description="No expenses" /> :
                    Object.entries(summary.expense_category_breakdown || {}).map(([cat, v]) => (
                      <div key={cat} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ minWidth: 0, wordBreak: "break-word" }}>{cat}</span><span style={{ flexShrink: 0 }}>{fmtAmount(v.paid)} / {fmtAmount(v.total)}</span>
                      </div>
                    ))}
                </Card>
                <Card size="small" title="Collection by Category" style={{ background: "#141720" }} styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}>
                  {Object.keys(summary.collection_category_breakdown || {}).length === 0 ? <Empty description="No collections" /> :
                    Object.entries(summary.collection_category_breakdown || {}).map(([cat, v]) => (
                      <div key={cat} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ minWidth: 0, wordBreak: "break-word" }}>{cat}</span><span style={{ flexShrink: 0 }}>{fmtAmount(v.received)} / {fmtAmount(v.total)}</span>
                      </div>
                    ))}
                </Card>
              </div>
              <Card size="small" title="Recent Transactions" style={{ background: "#141720" }} styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}>
                <Table size="small" dataSource={summary.recent_transactions || []} rowKey="id" pagination={false}
                  scroll={{ x: isMobile ? 520 : undefined }}
                  columns={[
                    { title: "Date", dataIndex: "date", key: "date", width: 100, render: fmtDate },
                    { title: "Type", dataIndex: "type", key: "type", width: 140, render: (t) => <Tag color={TXN_TYPE_COLORS[t]}>{TXN_TYPE_LABELS[t]}</Tag> },
                    { title: "Amount", dataIndex: "amount", key: "amount", width: 120, render: fmtAmount },
                    { title: "Details", key: "details", render: (_, r) => {
                      if (r.type === "collection") return `→ ${r.to_account_name}`;
                      if (r.type === "expense_payment") return `${r.from_account_name} →`;
                      if (r.type === "transfer") return `${r.from_account_name} → ${r.to_account_name}`;
                      return "-";
                    }},
                    { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true, render: (v) => v || "-" },
                  ]}
                />
              </Card>
            </>
          ) : <Empty description="Loading..." />}
        </Spin>
      )}

      {/* ── Expenses (category-wise) ── */}
      {innerTab === "expenses" && (
        <Spin spinning={expensesLoading}>
          {(() => {
            const total = expenses.reduce((s, e) => s + (e.total_amount || 0), 0);
            const paid = expenses.reduce((s, e) => s + (e.paid_amount || 0), 0);
            const totals = renderTotalsSidebar([
              { title: "Total", value: total, color: "#f87171" },
              { title: "Paid", value: paid, color: "#4ade80" },
              { title: "Outstanding", value: total - paid, color: "#fbbf24" },
            ]);
            const cards = (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <Title level={5} style={{ margin: 0 }}>Expenses by Category</Title>
                  <Space wrap size="small">
                    <Button size={isMobile ? "small" : "middle"} icon={<PlusOutlined />} onClick={() => { setCategoryType("expense"); setEditingCategory(null); setCategoryModalOpen(true); }}>Add Category</Button>
                    <Button size={isMobile ? "small" : "middle"} type="primary" icon={<PlusOutlined />} onClick={() => { setEditingExpense(null); setExpenseModalOpen(true); }}>Add Expense</Button>
                  </Space>
                </div>
                {expensesByCategory.length === 0 ? <Empty description="No expense categories. Add one to get started." /> :
                  <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>
                    {expensesByCategory.map(g => renderCategoryCard(g, "expense"))}
                  </div>}
              </>
            );
            return (
              <Row gutter={[16, 12]} align="top">
                {/* Totals first in DOM; order keeps them top on small screens, right on lg+ */}
                <Col xs={24} lg={8} xl={7} order={{ xs: 0, lg: 2 }} style={{ position: "sticky", top: 16, alignSelf: "flex-start", zIndex: 1 }}>
                  {totals}
                </Col>
                <Col xs={24} lg={16} xl={17} order={{ xs: 1, lg: 1 }}>
                  {cards}
                </Col>
              </Row>
            );
          })()}
        </Spin>
      )}

      {/* ── Collections (category-wise) ── */}
      {innerTab === "collections" && (
        <Spin spinning={collectionsLoading}>
          {(() => {
            const total = collections.reduce((s, c) => s + (c.total_amount || 0), 0);
            const received = collections.reduce((s, c) => s + (c.received_amount || 0), 0);
            const totals = renderTotalsSidebar([
              { title: "Expected", value: total, color: "#60a5fa" },
              { title: "Received", value: received, color: "#4ade80" },
              { title: "Pending", value: total - received, color: "#fbbf24" },
            ]);
            const cards = (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <Title level={5} style={{ margin: 0 }}>Collections by Category</Title>
                  <Space wrap size="small">
                    <Button size={isMobile ? "small" : "middle"} icon={<PlusOutlined />} onClick={() => { setCategoryType("collection"); setEditingCategory(null); setCategoryModalOpen(true); }}>Add Category</Button>
                    <Button size={isMobile ? "small" : "middle"} type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCollection(null); setCollectionModalOpen(true); }}>Add Collection</Button>
                  </Space>
                </div>
                {collectionsByCategory.length === 0 ? <Empty description="No collection categories. Add one to get started." /> :
                  <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>
                    {collectionsByCategory.map(g => renderCategoryCard(g, "collection"))}
                  </div>}
              </>
            );
            return (
              <Row gutter={[16, 12]} align="top">
                <Col xs={24} lg={8} xl={7} order={{ xs: 0, lg: 2 }} style={{ position: "sticky", top: 16, alignSelf: "flex-start", zIndex: 1 }}>
                  {totals}
                </Col>
                <Col xs={24} lg={16} xl={17} order={{ xs: 1, lg: 1 }}>
                  {cards}
                </Col>
              </Row>
            );
          })()}
        </Spin>
      )}

      {/* ── Transfers ── */}
      {innerTab === "transfers" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <Title level={5} style={{ margin: 0 }}>Transfers</Title>
            <Button type="primary" icon={<SwapOutlined />} onClick={() => setAddTransferOpen(true)}>Record Transfer</Button>
          </div>
          <Table columns={transferCols} dataSource={transactions} rowKey="id" loading={txnsLoading} size={isMobile ? "small" : "middle"} scroll={{ x: 700 }} />
        </>
      )}

      {/* ── Accounts ── */}
      {innerTab === "accounts" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <Title level={5} style={{ margin: 0 }}>Accounts</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingAccount(null); setAccountModalOpen(true); }}>Add Account</Button>
          </div>
          <Table columns={accountCols} dataSource={accounts} rowKey="id" loading={accountsLoading} size={isMobile ? "small" : "middle"} scroll={{ x: 700 }} />
        </>
      )}

      {/* ══════════════ MODALS ══════════════ */}

      {renderItemFormModal("expense")}
      {renderItemFormModal("collection")}


      {/* Expense Detail */}
      <Modal open={expenseDetailOpen} onCancel={() => { setExpenseDetailOpen(false); setSelectedExpense(null); }}
        title={selectedExpense?.description || "Expense Detail"} width={modalWidth(640)} destroyOnClose
        centered={!isMobile} style={isMobile ? { top: 12 } : undefined}
        styles={{ body: { maxHeight: isMobile ? "70vh" : undefined, overflowY: isMobile ? "auto" : undefined } }}
        footer={selectedExpense ? (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Popconfirm title="Delete this expense?" onConfirm={() => { deleteExpense(selectedExpense.id); setExpenseDetailOpen(false); setSelectedExpense(null); }}>
              <Button danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
            <Button icon={<EditOutlined />} onClick={() => { setExpenseDetailOpen(false); openEditExpense(selectedExpense); }}>Edit</Button>
          </div>
        ) : null}>
        {selectedExpense && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <Statistic title="Total" value={selectedExpense.total_amount} prefix="₹" valueStyle={{ fontSize: isMobile ? 18 : undefined }} />
              <Statistic title="Paid" value={selectedExpense.paid_amount} prefix="₹" valueStyle={{ fontSize: isMobile ? 18 : undefined }} />
              <Statistic title="Status" value={selectedExpense.status?.replace(/_/g, " ").toUpperCase()} valueStyle={{ fontSize: isMobile ? 16 : undefined, color: EXPENSE_STATUS_COLORS[selectedExpense.status] === "green" ? "#4ade80" : EXPENSE_STATUS_COLORS[selectedExpense.status] === "orange" ? "#fbbf24" : "#f87171" }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">Category: </Text>{selectedExpense.category_name}{selectedExpense.sub_category && ` / ${selectedExpense.sub_category}`}
              <br /><Text type="secondary">Date: </Text>{fmtDate(selectedExpense.date)}
              {selectedExpense.notes && <><br /><Text type="secondary">Notes: </Text>{selectedExpense.notes}</>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 8px", gap: 8, flexWrap: "wrap" }}>
              <Title level={5} style={{ margin: 0 }}>Payments</Title>
              <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAddPaymentOpen(true)}>Add Payment</Button>
            </div>
            <Table size="small" dataSource={expensePayments} rowKey="id" loading={expensePaymentsLoading} pagination={false}
              scroll={{ x: isMobile ? 420 : undefined }}
              columns={[
                { title: "Date", dataIndex: "date", key: "date", width: 100, render: fmtDate },
                { title: "Amount", dataIndex: "amount", key: "amount", width: 110, render: fmtAmount },
                { title: "From", dataIndex: "from_account_name", key: "from", width: 140 },
                { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true, render: (v) => v || "-" },
                { title: "", key: "x", width: 50, render: (_, r) => (
                  <Popconfirm title="Delete?" onConfirm={() => deleteTransaction(r.id)}><Button size="small" type="link" danger><DeleteOutlined /></Button></Popconfirm>
                )},
              ]}
            />
          </>
        )}
      </Modal>

      {/* Collection Detail */}
      <Modal open={collectionDetailOpen} onCancel={() => { setCollectionDetailOpen(false); setSelectedCollection(null); }}
        title={selectedCollection?.description || "Collection Detail"} width={modalWidth(640)} destroyOnClose
        centered={!isMobile} style={isMobile ? { top: 12 } : undefined}
        styles={{ body: { maxHeight: isMobile ? "70vh" : undefined, overflowY: isMobile ? "auto" : undefined } }}
        footer={selectedCollection ? (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Popconfirm title="Delete this collection?" onConfirm={() => { deleteCollectionItem(selectedCollection.id); setCollectionDetailOpen(false); setSelectedCollection(null); }}>
              <Button danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
            <Button icon={<EditOutlined />} onClick={() => { setCollectionDetailOpen(false); openEditCollection(selectedCollection); }}>Edit</Button>
          </div>
        ) : null}>
        {selectedCollection && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <Statistic title="Expected" value={selectedCollection.total_amount} prefix="₹" valueStyle={{ fontSize: isMobile ? 18 : undefined }} />
              <Statistic title="Received" value={selectedCollection.received_amount} prefix="₹" valueStyle={{ fontSize: isMobile ? 18 : undefined }} />
              <Statistic title="Status" value={selectedCollection.status?.replace(/_/g, " ").toUpperCase()} valueStyle={{ fontSize: isMobile ? 16 : undefined, color: COLLECTION_STATUS_COLORS[selectedCollection.status] === "green" ? "#4ade80" : COLLECTION_STATUS_COLORS[selectedCollection.status] === "orange" ? "#fbbf24" : "#f87171" }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">Category: </Text>{selectedCollection.category_name}{selectedCollection.sub_category && ` / ${selectedCollection.sub_category}`}
              <br /><Text type="secondary">Date: </Text>{fmtDate(selectedCollection.date)}
              {selectedCollection.booking_id && <><br /><Text type="secondary">Booking: </Text><Tag color="blue">Linked to booking</Tag></>}
              {selectedCollection.notes && <><br /><Text type="secondary">Notes: </Text>{selectedCollection.notes}</>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 8px", gap: 8, flexWrap: "wrap" }}>
              <Title level={5} style={{ margin: 0 }}>Receipts</Title>
              <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAddReceiptOpen(true)}>Add Receipt</Button>
            </div>
            <Table size="small" dataSource={collectionReceipts} rowKey="id" loading={collectionReceiptsLoading} pagination={false}
              scroll={{ x: isMobile ? 420 : undefined }}
              columns={[
                { title: "Date", dataIndex: "date", key: "date", width: 100, render: fmtDate },
                { title: "Amount", dataIndex: "amount", key: "amount", width: 110, render: fmtAmount },
                { title: "To", dataIndex: "to_account_name", key: "to", width: 140 },
                { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true, render: (v) => v || "-" },
                { title: "", key: "x", width: 50, render: (_, r) => (
                  <Popconfirm title="Delete?" onConfirm={() => deleteTransaction(r.id)}><Button size="small" type="link" danger><DeleteOutlined /></Button></Popconfirm>
                )},
              ]}
            />
          </>
        )}
      </Modal>

      {/* Add Payment to Expense */}
      <Modal open={addPaymentOpen} onCancel={() => { setAddPaymentOpen(false); addPaymentForm.resetFields(); }} footer={null} title="Add Payment" destroyOnClose
        width={modalWidth(440)} centered={!isMobile} style={isMobile ? { top: 12 } : undefined}>
        <Form form={addPaymentForm} layout="vertical" onFinish={submitPayment} initialValues={{ date: dayjs() }}>
          <div style={{ display: "grid", gridTemplateColumns: formGrid, gap: 12 }}>
            <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} min={1} /></Form.Item>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          </div>
          <Form.Item name="from_account_id" label="From Account" rules={[{ required: true }]}>
            <Select placeholder="Select account" options={accounts.map(a => ({ label: `${a.name} (${fmtAmount(a.balance)})`, value: a.id }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input /></Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space><Button onClick={() => { setAddPaymentOpen(false); addPaymentForm.resetFields(); }}>Cancel</Button><Button type="primary" htmlType="submit" loading={savingPayment}>Add Payment</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Receipt to Collection */}
      <Modal open={addReceiptOpen} onCancel={() => { setAddReceiptOpen(false); addReceiptForm.resetFields(); }} footer={null} title="Add Receipt" destroyOnClose
        width={modalWidth(440)} centered={!isMobile} style={isMobile ? { top: 12 } : undefined}>
        <Form form={addReceiptForm} layout="vertical" onFinish={submitReceipt} initialValues={{ date: dayjs() }}>
          <div style={{ display: "grid", gridTemplateColumns: formGrid, gap: 12 }}>
            <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} min={1} /></Form.Item>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          </div>
          <Form.Item name="to_account_id" label="To Account" rules={[{ required: true }]}>
            <Select placeholder="Select account" options={accounts.map(a => ({ label: `${a.name} (${fmtAmount(a.balance)})`, value: a.id }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input /></Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space><Button onClick={() => { setAddReceiptOpen(false); addReceiptForm.resetFields(); }}>Cancel</Button><Button type="primary" htmlType="submit" loading={savingReceipt}>Add Receipt</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Transfer */}
      <Modal open={addTransferOpen} onCancel={() => { setAddTransferOpen(false); addTransferForm.resetFields(); }} footer={null} title="Record Transfer" destroyOnClose
        width={modalWidth(480)} centered={!isMobile} style={isMobile ? { top: 12 } : undefined}>
        <Form form={addTransferForm} layout="vertical" onFinish={submitTransfer} initialValues={{ date: dayjs() }}>
          <div style={{ display: "grid", gridTemplateColumns: formGrid, gap: 12 }}>
            <Form.Item name="from_account_id" label="From" rules={[{ required: true }]}><Select placeholder="Source" options={accounts.map(a => ({ label: `${a.name} (${fmtAmount(a.balance)})`, value: a.id }))} /></Form.Item>
            <Form.Item name="to_account_id" label="To" rules={[{ required: true }]}><Select placeholder="Destination" options={accounts.map(a => ({ label: a.name, value: a.id }))} /></Form.Item>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: formGrid, gap: 12 }}>
            <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} min={1} /></Form.Item>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          </div>
          <Form.Item name="notes" label="Notes"><Input /></Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space><Button onClick={() => { setAddTransferOpen(false); addTransferForm.resetFields(); }}>Cancel</Button><Button type="primary" htmlType="submit" loading={savingTransfer}>Transfer</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Account */}
      <Modal open={accountModalOpen} onCancel={() => { setAccountModalOpen(false); accountForm.resetFields(); setEditingAccount(null); }} footer={null}
        title={`${editingAccount ? "Edit" : "Add"} Account`} destroyOnClose width={modalWidth(440)}
        centered={!isMobile} style={isMobile ? { top: 12 } : undefined}>
        <Form form={accountForm} layout="vertical" onFinish={submitAccount}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input placeholder="e.g. HDFC Bank, Cash, Person A" /></Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select placeholder="Select type" options={[
              { label: "Razorpay", value: "razorpay" }, { label: "Bank", value: "bank" }, { label: "Cash", value: "cash" }, { label: "Person", value: "person" }, { label: "Other", value: "other" },
            ]} />
          </Form.Item>
          <Form.Item name="contact" label="Contact (optional)"><Input placeholder="Phone or email" /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input /></Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space><Button onClick={() => { setAccountModalOpen(false); accountForm.resetFields(); setEditingAccount(null); }}>Cancel</Button><Button type="primary" htmlType="submit" loading={savingAccount}>{editingAccount ? "Update" : "Save"}</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Category */}
      <Modal open={categoryModalOpen} onCancel={() => { setCategoryModalOpen(false); categoryForm.resetFields(); setEditingCategory(null); }} footer={null}
        title={`${editingCategory ? "Edit" : "Add"} ${categoryType === "expense" ? "Expense" : "Collection"} Category`} destroyOnClose
        width={modalWidth(440)} centered={!isMobile} style={isMobile ? { top: 12 } : undefined}>
        <Form form={categoryForm} layout="vertical" onFinish={submitCategory}>
          <Form.Item name="name" label="Category Name" rules={[{ required: true }]}><Input placeholder="e.g. Travel, Donation" /></Form.Item>
          <Form.Item name="sub_categories" label="Sub-categories (comma separated)"><Input placeholder="e.g. Bus, Taxi, Fuel" /></Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space><Button onClick={() => { setCategoryModalOpen(false); categoryForm.resetFields(); setEditingCategory(null); }}>Cancel</Button><Button type="primary" htmlType="submit" loading={savingCategory}>{editingCategory ? "Update" : "Save"}</Button></Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
