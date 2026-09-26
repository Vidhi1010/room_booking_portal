import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Table,
  Tag,
  Select,
  Input,
  InputNumber,
  Button,
  Typography,
  theme as antTheme,
  ConfigProvider,
  message,
  Avatar,
  Dropdown,
  Modal,
  Descriptions,
  Form,
  Card,
  Statistic,
  Space,
  Badge,
  Progress,
  Empty,
  Spin,
} from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined,
  FilterOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  PhoneOutlined,
  HomeOutlined,
  NotificationOutlined,
  SendOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  CarOutlined,
  DownloadOutlined,
  SyncOutlined,
  UserAddOutlined,
  EditOutlined,
  WarningOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { API_BASE } from "./config";

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

const STATUS_COLORS = {
  fully_paid: "green",
  partially_paid: "orange",
  pending_payment: "blue",
  pending: "blue",
  cancelled: "red",
  unpaid: "blue",
};

// Backend uses `pending_payment` and `unpaid` interchangeably — surface both as "Unpaid".
const normalizeStatus = (s) => (s === "pending_payment" ? "unpaid" : s);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

const TEMPLATE_LABELS = {
  yatra_invitation: "Yatra Invitation",
  yatra_regist_payment_pending: "Yatra Registration Payment Pending",
};

const TEMPLATE_TYPE_MAP = {
  pending_yatra_payment: "utility",
  yatra_invitation: "marketing",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) navigate("/admin/login", { replace: true });
  }, [token, navigate]);

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  // Map: page number → cursor to fetch that page (page 1 always uses null cursor)
  const pageCursorsRef = useRef({ 1: null });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [filters, setFilters] = useState({
    limit: 20,
    status: undefined,
    transport_opted: undefined,
    preaching_area: undefined,
    facilitator_name: undefined,
    gender: undefined,
  });

  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Campaign state
  const [yatras, setYatras] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [selectedYatraId, setSelectedYatraId] = useState(undefined);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [activating, setActivating] = useState(null);
  const [activateResult, setActivateResult] = useState(null);
  const [activateConfirm, setActivateConfirm] = useState(null);

  // Sheet sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => localStorage.getItem("bookings_last_synced_at") || null);

  // Create-booking (manual/cash) state
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const [createBookingForm] = Form.useForm();
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [createBookingMeta, setCreateBookingMeta] = useState({ rooms: [], transport: [], yatraFeeOnly: 0, loaded: false });
  const [createBookingLoadingMeta, setCreateBookingLoadingMeta] = useState(false);
  const [createBookingResult, setCreateBookingResult] = useState(null);

  // Edit-booking state
  const [editBookingOpen, setEditBookingOpen] = useState(false);
  const [editBookingForm] = Form.useForm();
  const [editingBooking, setEditingBooking] = useState(false);
  const [editBookingTarget, setEditBookingTarget] = useState(null);
  const [editBookingResult, setEditBookingResult] = useState(null);

  // Settle-refund state
  const [settleRefundOpen, setSettleRefundOpen] = useState(false);
  const [settleRefundForm] = Form.useForm();
  const [settlingRefund, setSettlingRefund] = useState(false);
  const [settleRefundTarget, setSettleRefundTarget] = useState(null);
  const [settleRefundResult, setSettleRefundResult] = useState(null);

  // Cancel-booking state
  const [cancelBookingOpen, setCancelBookingOpen] = useState(false);
  const [cancelBookingForm] = Form.useForm();
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [cancelBookingTarget, setCancelBookingTarget] = useState(null);
  const [cancelBookingResult, setCancelBookingResult] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get-dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        navigate("/admin/login", { replace: true });
        return;
      }
      const data = await res.json();
      setDashboardData(data);
    } catch {
      message.error("Failed to fetch dashboard data");
    } finally {
      setDashboardLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (activeTab === "dashboard") fetchDashboard();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchYatras = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/get-yatras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setYatras(Array.isArray(data) ? data : data.yatras || data.body || []);
    } catch {
      // silent
    }
  }, [token]);

  const fetchCampaigns = useCallback(async (yatraId) => {
    setCampaignsLoading(true);
    try {
      const params = yatraId ? `?yatra_id=${yatraId}` : "";
      const res = await fetch(`${API_BASE}/get-campaigns${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        navigate("/admin/login", { replace: true });
        return;
      }
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : data.campaigns || data.body || []);
    } catch {
      message.error("Failed to fetch campaigns");
    } finally {
      setCampaignsLoading(false);
    }
  }, [token, navigate]);

  const handleCreateCampaign = async (values) => {
    setCreating(true);
    try {
      const payload = { ...values, type: TEMPLATE_TYPE_MAP[values.template_name] };
      const res = await fetch(`${API_BASE}/create-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create campaign");
      }
      message.success("Campaign created");
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchCampaigns(selectedYatraId);
    } catch (e) {
      message.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleActivateCampaign = async (campaignId) => {
    setActivating(campaignId);
    try {
      const res = await fetch(`${API_BASE}/activate-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ campaign_id: campaignId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to activate campaign");
      }
      const result = await res.json();
      setActivateResult(result);
      message.success("Campaign activated successfully");
      fetchCampaigns(selectedYatraId);
    } catch (e) {
      message.error(e.message);
    } finally {
      setActivating(null);
    }
  };

  useEffect(() => {
    if (activeTab === "campaigns") {
      fetchYatras();
      fetchCampaigns(selectedYatraId);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildBookingsParams = useCallback((cursor) => {
    const params = new URLSearchParams();
    if (filters.limit) params.set("limit", filters.limit);
    if (filters.status) params.set("status", filters.status);
    if (filters.transport_opted !== undefined && filters.transport_opted !== null) {
      params.set("transport_opted", filters.transport_opted);
    }
    if (filters.preaching_area) params.set("preaching_area", filters.preaching_area);
    if (filters.facilitator_name) params.set("facilitator_name", filters.facilitator_name);
    if (filters.gender) params.set("gender", filters.gender);
    if (cursor) params.set("next_key", cursor);
    return params;
  }, [filters]);

  const fetchBookingsPage = useCallback(async (targetPage) => {
    setLoading(true);
    try {
      const cursors = pageCursorsRef.current;
      // Highest cached page ≤ target — walk forward from there
      const knownPages = Object.keys(cursors).map(Number).filter((p) => p <= targetPage);
      let page = knownPages.length ? Math.max(...knownPages) : 1;
      let pageData = null;
      let serverTotal;

      while (page <= targetPage) {
        const cursor = cursors[page];
        if (page > 1 && cursor === undefined) break;
        const params = buildBookingsParams(cursor);
        const res = await fetch(`${API_BASE}/get-bookings?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          message.error("Session expired. Please login again.");
          localStorage.removeItem("admin_token");
          navigate("/admin/login", { replace: true });
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.bookings || data.body || [];
        const nk = data && typeof data === "object" && !Array.isArray(data) ? (data.next_key ?? null) : null;
        const total = data && typeof data === "object" && !Array.isArray(data) ? data.total : undefined;
        if (typeof total === "number") serverTotal = total;
        if (nk !== null && cursors[page + 1] === undefined) cursors[page + 1] = nk;
        if (page === targetPage) pageData = list;
        if (nk === null) break;
        page += 1;
      }

      setBookings(pageData || []);
      setCurrentPage(targetPage);
      if (typeof serverTotal === "number") setTotalCount(serverTotal);
    } catch {
      message.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }, [buildBookingsParams, token, navigate]);

  const resetAndFetch = useCallback(() => {
    pageCursorsRef.current = { 1: null };
    setBookings([]);
    setTotalCount(0);
    setCurrentPage(1);
    fetchBookingsPage(1);
  }, [fetchBookingsPage]);

  useEffect(() => {
    if (token) resetAndFetch();
  }, [token, resetAndFetch]);

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get-rooms`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.rooms || data.body || [];
      setRooms(list);
    } catch {
      message.error("Failed to fetch rooms");
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "rooms" && rooms.length === 0) fetchRooms();
  }, [activeTab, rooms.length, fetchRooms]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    message.success("Logged out");
    navigate("/");
  };

  const handleSyncSheet = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/sync-sheet`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        navigate("/admin/login", { replace: true });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to sync sheet");
      }
      setSyncResult(data);
      if (data.synced_at) {
        setLastSyncedAt(data.synced_at);
        localStorage.setItem("bookings_last_synced_at", data.synced_at);
      }
      message.success("Sheet synced successfully");
    } catch (e) {
      message.error(e.message || "Failed to sync sheet");
    } finally {
      setSyncing(false);
    }
  };

  const loadCreateBookingMeta = useCallback(async () => {
    setCreateBookingLoadingMeta(true);
    try {
      const [roomsRes, transportRes, yatrasRes] = await Promise.all([
        fetch(`${API_BASE}/get-rooms`),
        fetch(`${API_BASE}/get-transport`),
        fetch(`${API_BASE}/get-yatras`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const roomsData = await roomsRes.json().catch(() => ([]));
      const transportData = await transportRes.json().catch(() => ([]));
      const yatrasData = await yatrasRes.json().catch(() => ([]));
      const roomsList = Array.isArray(roomsData) ? roomsData : roomsData.rooms || roomsData.body || [];
      const transportList = Array.isArray(transportData) ? transportData : transportData.transport || transportData.body || [];
      const yatraList = Array.isArray(yatrasData) ? yatrasData : yatrasData.yatras || yatrasData.body || [];
      const y = yatraList[0] || {};
      const feeAmt = Number(y?.yatra_fee_only_amount) || 0;
      setCreateBookingMeta({ rooms: roomsList, transport: transportList, yatraFeeOnly: feeAmt, loaded: true });
    } catch {
      message.error("Failed to load rooms/transport data");
    } finally {
      setCreateBookingLoadingMeta(false);
    }
  }, [token]);

  const openCreateBooking = () => {
    createBookingForm.resetFields();
    createBookingForm.setFieldsValue({
      gender: "male",
      chanting_rounds: 0,
      no_accommodation: false,
      transport_opted: false,
      amount_paid: 0,
      members: [],
    });
    setCreateBookingOpen(true);
    if (!createBookingMeta.loaded) loadCreateBookingMeta();
  };

  const submitCreateBooking = async (values, { allowDuplicate = false } = {}) => {
    setCreatingBooking(true);
    try {
      const payload = {
        name: values.name?.trim(),
        age: Number(values.age),
        contact_number: String(values.contact_number || "").trim(),
        gender: values.gender,
        chanting_rounds: Number(values.chanting_rounds || 0),
        preaching_area_connected: values.preaching_area_connected || undefined,
        facilitator_name: values.facilitator_name || undefined,
        preferred_room_partner: values.preferred_room_partner || undefined,
        members: (values.members || []).map((m) => ({
          name: m.name?.trim(),
          contact_number: String(m.contact_number || "").trim(),
          age: Number(m.age),
          gender: m.gender,
          chanting_rounds: Number(m.chanting_rounds || 0),
          facilitator_name: m.facilitator_name || undefined,
        })),
        no_accommodation: !!values.no_accommodation,
        amount_paid: Number(values.amount_paid || 0),
        payment_reference: values.payment_reference || undefined,
        payment_note: values.payment_note || undefined,
      };
      if (!values.no_accommodation) {
        payload.room_id = values.room_id;
        payload.transport_opted = !!values.transport_opted;
        if (values.transport_opted) payload.transport_id = values.transport_id;
      }
      if (allowDuplicate) payload.allow_duplicate_contact = true;

      const res = await fetch(`${API_BASE}/admin-create-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        navigate("/admin/login", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && !allowDuplicate) {
        Modal.confirm({
          title: "Booking already exists for this contact",
          content: data.message || "A booking with this contact number already exists. Create anyway?",
          okText: "Create anyway",
          okButtonProps: { danger: true },
          onOk: () => submitCreateBooking(values, { allowDuplicate: true }),
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to create booking");
      }

      message.success("Booking created");
      setCreateBookingOpen(false);
      createBookingForm.resetFields();
      setCreateBookingResult(data.booking || data);
      resetAndFetch();
    } catch (e) {
      message.error(e.message || "Failed to create booking");
    } finally {
      setCreatingBooking(false);
    }
  };

  const openEditBooking = (booking) => {
    if (!booking) return;
    setEditBookingTarget(booking);
    editBookingForm.resetFields();
    editBookingForm.setFieldsValue({
      no_accommodation: !!booking.no_accommodation,
      room_id: booking.room_id || undefined,
      transport_opted: !!booking.transport_opted,
      transport_id: booking.transport_id || undefined,
      additional_cash_paid: 0,
      payment_reference: undefined,
      payment_note: undefined,
      reason: undefined,
    });
    setEditBookingOpen(true);
    if (!createBookingMeta.loaded) loadCreateBookingMeta();
  };

  const submitEditBooking = async (values) => {
    if (!editBookingTarget) return;
    const target = editBookingTarget;
    setEditingBooking(true);
    try {
      const payload = { booking_id: target.id };
      const noAccChanged = !!values.no_accommodation !== !!target.no_accommodation;
      const roomChanged = !values.no_accommodation && values.room_id && values.room_id !== target.room_id;
      const transportOptedChanged = !!values.transport_opted !== !!target.transport_opted;
      const transportIdChanged = !!values.transport_opted && values.transport_id && values.transport_id !== target.transport_id;
      const cash = Number(values.additional_cash_paid || 0);

      if (noAccChanged) payload.no_accommodation = !!values.no_accommodation;
      if (!values.no_accommodation && roomChanged) payload.room_id = values.room_id;
      if (!values.no_accommodation) {
        if (transportOptedChanged) payload.transport_opted = !!values.transport_opted;
        if (values.transport_opted && (transportOptedChanged || transportIdChanged)) {
          payload.transport_id = values.transport_id;
        }
      }
      if (cash > 0) {
        payload.additional_cash_paid = cash;
        if (values.payment_reference) payload.payment_reference = values.payment_reference;
        if (values.payment_note) payload.payment_note = values.payment_note;
      }
      if (values.reason) payload.reason = values.reason;

      const changeKeys = ["room_id", "transport_opted", "transport_id", "no_accommodation", "additional_cash_paid"];
      if (!changeKeys.some((k) => k in payload)) {
        message.warning("No changes to save");
        setEditingBooking(false);
        return;
      }

      const res = await fetch(`${API_BASE}/update-booking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        navigate("/admin/login", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        const staleWrite = /changed since read/i.test(data.error || "");
        if (staleWrite) {
          message.warning("Another admin just edited this booking — reload and retry");
        } else {
          message.error(data.error || "Inventory conflict");
        }
        setEditBookingOpen(false);
        setEditBookingTarget(null);
        setSelectedBooking(null);
        resetAndFetch();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to update booking");
      }

      message.success("Booking updated");
      setEditBookingOpen(false);
      setEditBookingTarget(null);
      setSelectedBooking(null);
      setEditBookingResult(data);
      resetAndFetch();
    } catch (e) {
      message.error(e.message || "Failed to update booking");
    } finally {
      setEditingBooking(false);
    }
  };

  const openSettleRefund = (booking) => {
    if (!booking) return;
    setSettleRefundTarget(booking);
    settleRefundForm.resetFields();
    settleRefundForm.setFieldsValue({
      amount: Number(booking.refund_due) || 0,
      reference: undefined,
      note: undefined,
    });
    setSettleRefundOpen(true);
  };

  const submitSettleRefund = async (values) => {
    if (!settleRefundTarget) return;
    const target = settleRefundTarget;
    const amount = Number(values.amount || 0);
    const refundDue = Number(target.refund_due) || 0;
    if (amount <= 0) {
      message.error("Amount must be greater than 0");
      return;
    }
    if (refundDue > 0 && amount > refundDue) {
      message.error(`Amount cannot exceed refund due (₹${refundDue})`);
      return;
    }
    setSettlingRefund(true);
    try {
      const payload = { booking_id: target.id, amount };
      if (values.reference) payload.reference = values.reference;
      if (values.note) payload.note = values.note;

      const res = await fetch(`${API_BASE}/settle-refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        navigate("/admin/login", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        message.warning(data.error || "Booking changed since read — reload and retry");
        setSettleRefundOpen(false);
        setSettleRefundTarget(null);
        setSelectedBooking(null);
        setEditBookingResult(null);
        resetAndFetch();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to settle refund");
      }

      message.success("Refund settled");
      setSettleRefundOpen(false);
      setSettleRefundTarget(null);
      setSelectedBooking(null);
      setEditBookingResult(null);
      setSettleRefundResult(data);
      resetAndFetch();
    } catch (e) {
      message.error(e.message || "Failed to settle refund");
    } finally {
      setSettlingRefund(false);
    }
  };

  const openCancelBooking = (booking) => {
    if (!booking) return;
    const netPaid = Math.max(0, (Number(booking.amount_paid) || 0) - (Number(booking.refund_paid) || 0));
    setCancelBookingTarget({ ...booking, __net_paid: netPaid });
    cancelBookingForm.resetFields();
    cancelBookingForm.setFieldsValue({
      refund_amount: netPaid,
      reason: undefined,
    });
    setCancelBookingOpen(true);
  };

  const submitCancelBooking = async (values) => {
    if (!cancelBookingTarget) return;
    const target = cancelBookingTarget;
    const netPaid = Number(target.__net_paid) || 0;
    const refundAmount = values.refund_amount == null ? undefined : Number(values.refund_amount);
    if (refundAmount != null) {
      if (refundAmount < 0) {
        message.error("Refund amount cannot be negative");
        return;
      }
      if (refundAmount > netPaid) {
        message.error(`Refund amount cannot exceed net paid (₹${netPaid})`);
        return;
      }
    }
    setCancellingBooking(true);
    try {
      const payload = { booking_id: target.id };
      if (values.reason) payload.reason = values.reason;
      if (refundAmount != null) payload.refund_amount = refundAmount;

      const res = await fetch(`${API_BASE}/admin-cancel-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("admin_token");
        navigate("/admin/login", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        message.warning(data.error || "Booking is already cancelled");
        setCancelBookingOpen(false);
        setCancelBookingTarget(null);
        setSelectedBooking(null);
        resetAndFetch();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to cancel booking");
      }

      message.success("Booking cancelled");
      setCancelBookingOpen(false);
      setCancelBookingTarget(null);
      setSelectedBooking(null);
      setCancelBookingResult(data);
      resetAndFetch();
    } catch (e) {
      message.error(e.message || "Failed to cancel booking");
    } finally {
      setCancellingBooking(false);
    }
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      width: 170,
      render: (_, r) => {
        const primary = r.users?.find((u) => u.is_primary);
        return (
          <div>
            <div className="font-medium">{primary?.name || "-"}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{r.primary_contact}</div>
          </div>
        );
      },
    },
    {
      title: "Room",
      dataIndex: "room_name",
      key: "room_name",
      width: 130,
    },
    {
      title: "Guests",
      dataIndex: "total_occupants",
      key: "total_occupants",
      width: 70,
      align: "center",
      render: (n) => <Tag icon={<TeamOutlined />}>{n}</Tag>,
    },
    {
      title: "Amount",
      key: "amount",
      width: 150,
      render: (_, r) => (
        <div>
          <span className="font-semibold" style={{ color: "#4ade80" }}>₹{r.amount_paid}</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}> / ₹{r.total_amount}</span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (s) => {
        const n = normalizeStatus(s);
        return (
          <Tag color={STATUS_COLORS[n] || "default"}>
            {n?.replace(/_/g, " ").toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Transport",
      key: "transport",
      width: 100,
      align: "center",
      render: (_, r) => r.transport_opted ? <Tag color="blue">{r.transport_name || "Yes"}</Tag> : <Tag>No</Tag>,
    },
    {
      title: "Refund",
      key: "refund",
      width: 130,
      render: (_, r) => {
        const due = Number(r.refund_due) || 0;
        if (r.refund_status === "pending" && due > 0) {
          return (
            <Tag
              color="red"
              icon={<WarningOutlined />}
              onClick={(e) => { e.stopPropagation(); openSettleRefund(r); }}
              style={{ cursor: "pointer", margin: 0 }}
            >
              ₹{due} DUE
            </Tag>
          );
        }
        if (r.refund_status === "settled") return <Tag color="green">SETTLED</Tag>;
        return <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>;
      },
    },
    {
      title: "Booked",
      dataIndex: "created_at",
      key: "created_at",
      width: 110,
      render: (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "-",
    },
  ];

  const roomColumns = [
    {
      title: "Image",
      dataIndex: "img",
      key: "img",
      width: 70,
      render: (img) => img ? <img src={img} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} /> : "-",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{r.room_type} · Capacity: {r.capacity}</div>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (p) => <span style={{ fontWeight: 700, color: "#4ade80" }}>₹{p}</span>,
    },
    {
      title: "Inventory",
      dataIndex: "inventory",
      key: "inventory",
      width: 90,
      align: "center",
      render: (n) => <Tag>{n} rooms</Tag>,
    },
    {
      title: "Total Beds",
      dataIndex: "total_beds",
      key: "total_beds",
      width: 100,
      align: "center",
    },
    {
      title: "Booked",
      dataIndex: "booked_beds",
      key: "booked_beds",
      width: 90,
      align: "center",
      render: (n) => <span style={{ color: n > 0 ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>{n}</span>,
    },
    {
      title: "Available",
      dataIndex: "available_beds",
      key: "available_beds",
      width: 100,
      align: "center",
      render: (n) => <Tag color={n > 10 ? "green" : n > 0 ? "orange" : "red"}>{n} beds</Tag>,
    },
  ];

  if (!token) return null;

  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: { colorPrimary: "#d97706", borderRadius: 10, colorBgContainer: "#141720", colorBgElevated: "#1a1e2e" },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          breakpoint="lg"
          onBreakpoint={(broken) => setCollapsed(broken)}
          style={{ background: "#0f1117", minHeight: "100vh" }}
        >
          <div className="flex items-center gap-2 px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">KV</span>
            </div>
            {!collapsed && <span className="text-sm font-bold text-white/80 truncate">Yatra Admin</span>}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={({ key }) => setActiveTab(key)}
            style={{ background: "transparent", borderRight: 0 }}
            items={[
              { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
              { key: "bookings", icon: <BookOutlined />, label: "Bookings" },
              { key: "rooms", icon: <HomeOutlined />, label: "Rooms" },
              { key: "campaigns", icon: <NotificationOutlined />, label: "Campaigns" },
            ]}
          />
        </Sider>

        <Layout style={{ background: "#0d0f14" }}>
          <Header
            style={{
              background: "#141720",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              height: 64,
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: "rgba(255,255,255,0.6)" }}
            />
            <Dropdown
              menu={{ items: [{ key: "logout", icon: <LogoutOutlined />, label: "Logout", danger: true, onClick: handleLogout }] }}
              placement="bottomRight"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#d97706" }} />
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Admin</Text>
              </div>
            </Dropdown>
          </Header>

          <Content style={{ padding: 24, background: "#0d0f14", minHeight: "calc(100vh - 64px)" }}>
            {activeTab === "bookings" && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <Title level={4} style={{ color: "#fff", margin: 0 }}>Bookings</Title>
                  <Text style={{ color: "rgba(255,255,255,0.4)" }}>
                    {totalCount} total booking{totalCount !== 1 ? "s" : ""}
                    {totalCount > 0 && filters.limit ? ` · Page ${currentPage} of ${Math.max(1, Math.ceil(totalCount / filters.limit))}` : ""}
                  </Text>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                    padding: 16,
                    borderRadius: 12,
                    background: "#141720",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <FilterOutlined style={{ color: "rgba(255,255,255,0.4)" }} />
                  <Select
                    placeholder="Status"
                    allowClear
                    style={{ width: 170 }}
                    value={filters.status}
                    onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
                    options={[
                      { label: "All Statuses", value: undefined },
                      { label: "Fully Paid", value: "fully_paid" },
                      { label: "Partially Paid", value: "partially_paid" },
                      { label: "Unpaid", value: "pending_payment" },
                    ]}
                  />
                  <Select
                    placeholder="Transport"
                    allowClear
                    style={{ width: 140 }}
                    value={filters.transport_opted}
                    onChange={(v) => setFilters((f) => ({ ...f, transport_opted: v }))}
                    options={[
                      { label: "All", value: undefined },
                      { label: "Opted", value: true },
                      { label: "Not Opted", value: false },
                    ]}
                  />
                  <Select
                    placeholder="Preaching Area"
                    allowClear
                    style={{ width: 180 }}
                    value={filters.preaching_area}
                    onChange={(v) => setFilters((f) => ({ ...f, preaching_area: v }))}
                    options={[
                      { label: "Gita Essence", value: "Gita Essence" },
                      { label: "ISKCON Jia Sarai", value: "ISKCON Jia Sarai" },
                      { label: "ISKCON Srinagar", value: "ISKCON Srinagar" },
                      { label: "Siksharthakam", value: "Siksharthakam" },
                      { label: "Sreshtha", value: "Sreshtha" },
                    ]}
                  />
                  <Select
                    placeholder="Gender"
                    allowClear
                    style={{ width: 120 }}
                    value={filters.gender}
                    onChange={(v) => setFilters((f) => ({ ...f, gender: v }))}
                    options={[
                      { label: "Male", value: "Male" },
                      { label: "Female", value: "Female" },
                    ]}
                  />
                  <Input
                    placeholder="Facilitator name"
                    allowClear
                    style={{ width: 180 }}
                    value={filters.facilitator_name}
                    onChange={(e) => setFilters((f) => ({ ...f, facilitator_name: e.target.value || undefined }))}
                  />
                  <InputNumber
                    placeholder="Limit"
                    min={1}
                    max={500}
                    value={filters.limit}
                    onChange={(v) => setFilters((f) => ({ ...f, limit: v || 50 }))}
                    style={{ width: 90 }}
                  />
                  <Button icon={<ReloadOutlined />} onClick={() => resetAndFetch()} loading={loading}>
                    Refresh
                  </Button>
                  <Button
                    icon={<UserAddOutlined />}
                    type="primary"
                    onClick={openCreateBooking}
                  >
                    Create Booking
                  </Button>
                  <Button
                    icon={<SyncOutlined />}
                    onClick={handleSyncSheet}
                    loading={syncing}
                  >
                    Sync Sheet
                  </Button>
                  {lastSyncedAt && (
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                      Last synced: {fmtDate(lastSyncedAt)}
                    </Text>
                  )}
                </div>

                <Table
                  columns={columns}
                  dataSource={bookings}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    current: currentPage,
                    pageSize: filters.limit || 20,
                    total: totalCount,
                    showSizeChanger: false,
                    showQuickJumper: true,
                    showTotal: (t, [start, end]) => `${start}–${end} of ${t}`,
                    onChange: (page) => fetchBookingsPage(page),
                  }}
                  scroll={{ x: 900 }}
                  size="middle"
                  onRow={(record) => ({
                    onClick: () => setSelectedBooking(record),
                    style: { cursor: "pointer" },
                  })}
                />
              </>
            )}

            {activeTab === "rooms" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <Title level={4} style={{ color: "#fff", margin: 0 }}>Rooms</Title>
                    <Text style={{ color: "rgba(255,255,255,0.4)" }}>
                      Room inventory & availability
                    </Text>
                  </div>
                  <Button icon={<ReloadOutlined />} onClick={fetchRooms} loading={roomsLoading}>
                    Refresh
                  </Button>
                </div>

                <Table
                  columns={roomColumns}
                  dataSource={rooms}
                  rowKey="id"
                  loading={roomsLoading}
                  pagination={false}
                  scroll={{ x: 800 }}
                  size="middle"
                />
              </>
            )}

            {activeTab === "dashboard" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <Title level={4} style={{ color: "#fff", margin: 0 }}>Dashboard</Title>
                    <Text style={{ color: "rgba(255,255,255,0.4)" }}>Key metrics overview</Text>
                  </div>
                  <Button icon={<ReloadOutlined />} onClick={fetchDashboard} loading={dashboardLoading}>
                    Refresh
                  </Button>
                </div>

                {dashboardLoading && !dashboardData ? (
                  <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
                ) : dashboardData ? (
                  <>
                    {/* Total Bookings + Status Breakdown */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 16 }}>
                      <Card style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Statistic
                          title={<span style={{ color: "rgba(255,255,255,0.5)" }}>Total Bookings</span>}
                          value={dashboardData.total_bookings}
                          prefix={<BookOutlined />}
                          valueStyle={{ color: "#fff", fontSize: 28 }}
                        />
                      </Card>
                      <Card
                        title={<span style={{ color: "#fff" }}><DashboardOutlined style={{ marginRight: 8 }} />Bookings Status Breakdown</span>}
                        style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}
                        styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-around" }}>
                          <Statistic
                            title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Fully Paid</span>}
                            value={dashboardData.status_breakdown?.fully_paid}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: "#4ade80", fontSize: 22 }}
                          />
                          <Statistic
                            title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Partially Paid</span>}
                            value={dashboardData.status_breakdown?.partially_paid}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: "#fbbf24", fontSize: 22 }}
                          />
                          <Statistic
                            title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Unpaid</span>}
                            value={dashboardData.status_breakdown?.pending_payment}
                            prefix={<ExclamationCircleOutlined />}
                            valueStyle={{ color: "#f87171", fontSize: 22 }}
                          />
                        </div>
                      </Card>
                    </div>

                    {/* Financials */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                      <Card style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Statistic
                          title={<span style={{ color: "rgba(255,255,255,0.5)" }}>Revenue Collected(incl. tax)</span>}
                          value={dashboardData.revenue_collected}
                          prefix="₹"
                          valueStyle={{ color: "#4ade80", fontSize: 28 }}
                        />
                      </Card>
                      <Card style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Statistic
                          title={<span style={{ color: "rgba(255,255,255,0.5)" }}>Pending Payments(incl. tax)</span>}
                          value={dashboardData.pending_payments}
                          prefix="₹"
                          valueStyle={{ color: "#fbbf24", fontSize: 28 }}
                        />
                      </Card>
                      <Card style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Statistic
                          title={<span style={{ color: "rgba(255,255,255,0.5)" }}>Total Expected(incl. tax)</span>}
                          value={dashboardData.total_expected}
                          prefix="₹"
                          valueStyle={{ color: "rgba(255,255,255,0.8)", fontSize: 28 }}
                        />
                      </Card>
                    </div>

                    {/* Settlements */}
                    <Card
                      title={
                        <span style={{ color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                          <DollarOutlined />
                          Settled to Bank
                        </span>
                      }
                      style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)", marginTop: 24, marginBottom: 24 }}
                      styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}
                    >
                      {dashboardData.settlements ? (
                        <>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
                            <Statistic
                              title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Settled Amount</span>}
                              value={dashboardData.settlements.total_amount ?? 0}
                              prefix="₹"
                              valueStyle={{ color: "#4ade80", fontSize: 24 }}
                            />
                            <Statistic
                              title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Razorpay Fees</span>}
                              value={dashboardData.settlements.total_fee ?? 0}
                              prefix="₹"
                              valueStyle={{ color: "#fbbf24", fontSize: 20 }}
                            />
                            <Statistic
                              title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Tax</span>}
                              value={dashboardData.settlements.total_tax ?? 0}
                              prefix="₹"
                              valueStyle={{ color: "#f87171", fontSize: 20 }}
                            />
                            <Statistic
                              title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Settlement Count</span>}
                              value={dashboardData.settlements.count ?? 0}
                              valueStyle={{ color: "rgba(255,255,255,0.8)", fontSize: 20 }}
                            />
                          </div>
                          {dashboardData.settlements.updated_at && (
                            <div style={{ marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                              Last updated: {fmtDate(dashboardData.settlements.updated_at)}
                            </div>
                          )}
                        </>
                      ) : (
                        <Text style={{ color: "rgba(255,255,255,0.4)" }}>No settlement data yet.</Text>
                      )}
                    </Card>

                    {/* Occupancy & Transport */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
                      <Card
                        title={<span style={{ color: "#fff" }}><HomeOutlined style={{ marginRight: 8 }} />Occupancy</span>}
                        style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}
                        styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ color: "rgba(255,255,255,0.6)" }}>Bed Utilization</Text>
                            <Text style={{ color: "#fff", fontWeight: 600 }}>{dashboardData.occupancy?.rate_percent}%</Text>
                          </div>
                          <Progress
                            percent={dashboardData.occupancy?.rate_percent || 0}
                            showInfo={false}
                            strokeColor="#d97706"
                            trailColor="rgba(255,255,255,0.06)"
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-around" }}>
                          <Statistic
                            title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Booked</span>}
                            value={dashboardData.occupancy?.booked_beds}
                            valueStyle={{ color: "#fbbf24", fontSize: 20 }}
                          />
                          <Statistic
                            title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Total Beds</span>}
                            value={dashboardData.occupancy?.total_beds}
                            valueStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }}
                          />
                        </div>
                      </Card>

                      <Card
                        title={<span style={{ color: "#fff" }}><CarOutlined style={{ marginRight: 8 }} />Transport</span>}
                        style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}
                        styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ color: "rgba(255,255,255,0.6)" }}>Seat Utilization</Text>
                            <Text style={{ color: "#fff", fontWeight: 600 }}>{dashboardData.transport?.utilization_percent}%</Text>
                          </div>
                          <Progress
                            percent={dashboardData.transport?.utilization_percent || 0}
                            showInfo={false}
                            strokeColor="#60a5fa"
                            trailColor="rgba(255,255,255,0.06)"
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-around" }}>
                          <Statistic
                            title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Opted</span>}
                            value={dashboardData.transport?.bookings_opted}
                            valueStyle={{ color: "#60a5fa", fontSize: 20 }}
                          />
                          <Statistic
                            title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Total Seats</span>}
                            value={dashboardData.transport?.total_seats}
                            valueStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }}
                          />
                        </div>
                      </Card>
                    </div>

                    {/* Users Breakdown */}
                    {dashboardData.users && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginTop: 24 }}>
                        <Card
                          title={
                            <span style={{ color: "#fff" }}>
                              <TeamOutlined style={{ marginRight: 8 }} />
                              Gender Breakdown
                              <span style={{ marginLeft: 8, fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                                {dashboardData.users.total} total
                              </span>
                            </span>
                          }
                          style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}
                          styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}
                        >
                          {(() => {
                            const gb = dashboardData.users.gender_breakdown || {};
                            const entries = [
                              { name: "Male", count: gb.male ?? 0, color: "#60a5fa" },
                              { name: "Female", count: gb.female ?? 0, color: "#f472b6" },
                              { name: "Other", count: gb.other ?? 0, color: "rgba(255,255,255,0.5)" },
                            ].filter((e) => e.count > 0);
                            const total = entries.reduce((sum, e) => sum + e.count, 0);
                            if (total === 0) {
                              return <Text style={{ color: "rgba(255,255,255,0.4)" }}>No data</Text>;
                            }
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {entries.map(({ name, count, color }) => {
                                  const pct = Math.round((count / total) * 100);
                                  return (
                                    <div key={name}>
                                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{name}</span>
                                        <span style={{ color: "#fff", fontWeight: 600 }}>{count} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>({pct}%)</span></span>
                                      </div>
                                      <Progress
                                        percent={pct}
                                        showInfo={false}
                                        strokeColor={color}
                                        trailColor="rgba(255,255,255,0.06)"
                                        size="small"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </Card>

                        <Card
                          title={
                            <span style={{ color: "#fff" }}>
                              <HomeOutlined style={{ marginRight: 8 }} />
                              Preaching Area Breakdown
                            </span>
                          }
                          style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}
                          styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}
                        >
                          {(() => {
                            const areas = dashboardData.users.preaching_area_breakdown || {};
                            const entries = Object.entries(areas);
                            const total = entries.reduce((sum, [, v]) => sum + (v || 0), 0);
                            if (entries.length === 0) {
                              return <Text style={{ color: "rgba(255,255,255,0.4)" }}>No data</Text>;
                            }
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {entries.map(([name, count]) => {
                                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                  return (
                                    <div key={name}>
                                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{name}</span>
                                        <span style={{ color: "#fff", fontWeight: 600 }}>{count} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>({pct}%)</span></span>
                                      </div>
                                      <Progress
                                        percent={pct}
                                        showInfo={false}
                                        strokeColor="#d97706"
                                        trailColor="rgba(255,255,255,0.06)"
                                        size="small"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </Card>
                      </div>
                    )}
                  </>
                ) : (
                  <Empty description="No dashboard data available" style={{ padding: 80 }} />
                )}
              </>
            )}

            {activeTab === "campaigns" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <Title level={4} style={{ color: "#fff", margin: 0 }}>Campaigns</Title>
                    <Text style={{ color: "rgba(255,255,255,0.4)" }}>
                      WhatsApp messaging campaigns
                    </Text>
                  </div>
                  <Space wrap>
                    <Select
                      placeholder="Filter by Yatra"
                      allowClear
                      style={{ width: 200 }}
                      value={selectedYatraId}
                      onChange={(v) => { setSelectedYatraId(v); fetchCampaigns(v); }}
                      options={yatras.map((y) => ({ label: y.name, value: y.id }))}
                    />
                    <Button icon={<ReloadOutlined />} onClick={() => fetchCampaigns(selectedYatraId)} loading={campaignsLoading}>
                      Refresh
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                      Create Campaign
                    </Button>
                  </Space>
                </div>

                {campaignsLoading ? (
                  <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
                ) : campaigns.length === 0 ? (
                  <Empty description="No campaigns found" style={{ padding: 80 }} />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
                    {campaigns.map((c) => {
                      const isActive = c.status === "activated" || c.status === "sent";
                      const isPending = c.status === "pending" || c.status === "draft";
                      const totalMessages = (c.sent || 0) + (c.delivered || 0) + (c.failed || 0);
                      const deliveryRate = totalMessages > 0 ? Math.round(((c.delivered || 0) / totalMessages) * 100) : 0;

                      return (
                        <Card
                          key={c.id}
                          style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}
                          styles={{ body: { padding: 20 } }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                              <Tag color={c.type === "utility" ? "blue" : "purple"} style={{ marginBottom: 6 }}>
                                {c.type?.toUpperCase()}
                              </Tag>
                              <div style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>{TEMPLATE_LABELS[c.template_name] || c.template_name?.replace(/_/g, " ")}</div>
                              {c.description && (
                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{c.description}</div>
                              )}
                            </div>
                            <Badge
                              status={isActive ? "success" : isPending ? "warning" : "default"}
                              text={
                                <span style={{ color: isActive ? "#4ade80" : isPending ? "#fbbf24" : "rgba(255,255,255,0.5)", fontSize: 12 }}>
                                  {c.status?.toUpperCase()}
                                </span>
                              }
                            />
                          </div>

                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
                            Yatra: <span style={{ color: "rgba(255,255,255,0.7)" }}>{c.yatra_name || c.yatra_id}</span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                            <Statistic
                              title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Recipients</span>}
                              value={c.estimated_cost?.recipientCount ?? c.recipient_count ?? 0}
                              prefix={<TeamOutlined />}
                              valueStyle={{ fontSize: 18, color: "#fff" }}
                            />
                            <Statistic
                              title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Per Message</span>}
                              value={c.estimated_cost?.perMessage ?? 0}
                              prefix="₹"
                              precision={2}
                              valueStyle={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }}
                            />
                            <Statistic
                              title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Total Cost (approx.)</span>}
                              value={c.estimated_cost?.total ?? 0}
                              prefix="₹"
                              precision={2}
                              valueStyle={{ fontSize: 18, color: "#fbbf24" }}
                            />
                          </div>

                          {isActive && totalMessages > 0 && (
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                                <span>Delivery</span>
                                <span>{deliveryRate}%</span>
                              </div>
                              <Progress
                                percent={deliveryRate}
                                showInfo={false}
                                strokeColor="#4ade80"
                                trailColor="rgba(255,255,255,0.06)"
                                size="small"
                              />
                              <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }}>
                                <span style={{ color: "#4ade80" }}>
                                  <CheckCircleOutlined /> {c.delivered || 0} delivered
                                </span>
                                <span style={{ color: "#60a5fa" }}>
                                  <SendOutlined /> {c.sent || 0} sent
                                </span>
                                {(c.failed || 0) > 0 && (
                                  <span style={{ color: "#f87171" }}>
                                    <ExclamationCircleOutlined /> {c.failed} failed
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                              {c.activated_at ? `Activated ${fmtDate(c.activated_at)}` : `Created ${fmtDate(c.created_at)}`}
                            </div>
                            {isPending && (
                              <Button
                                type="primary"
                                size="small"
                                icon={<SendOutlined />}
                                loading={activating === c.id}
                                onClick={() => setActivateConfirm(c)}
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Create Campaign Modal */}
                <Modal
                  open={createModalOpen}
                  onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
                  footer={null}
                  title={
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <NotificationOutlined />
                      Create Campaign
                    </span>
                  }
                >
                  <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreateCampaign}
                    style={{ marginTop: 16 }}
                  >
                    <Form.Item
                      name="yatra_id"
                      label="Yatra"
                      rules={[{ required: true, message: "Select a yatra" }]}
                    >
                      <Select
                        placeholder="Select yatra"
                        options={yatras.map((y) => ({ label: y.name, value: y.id }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="template_name"
                      label="Template"
                      rules={[{ required: true, message: "Select a template" }]}
                    >
                      <Select
                        placeholder="Select template"
                        options={[
                          { label: "Pending Yatra Payment", value: "pending_yatra_payment" },
                          { label: "Yatra Invitation", value: "yatra_invitation" },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.template_name !== cur.template_name}>
                      {({ getFieldValue }) =>
                        TEMPLATE_TYPE_MAP[getFieldValue("template_name")] === "marketing" && (
                          <>
                            <Form.Item name="description" label="Description">
                              <Input.TextArea rows={2} placeholder="e.g. Invite devotees for upcoming yatra" />
                            </Form.Item>
                            <div style={{ marginBottom: 8, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Recipients</div>
                            <Form.List
                              name="recipients"
                              rules={[{ validator: async (_, list) => {
                                if (!list || list.length === 0) throw new Error("Add at least one recipient");
                              }}]}
                            >
                              {(fields, { add, remove }, { errors }) => (
                                <>
                                  {fields.map(({ key, name, ...rest }) => (
                                    <div key={key} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                                      <Form.Item
                                        {...rest}
                                        name={[name, "name"]}
                                        rules={[{ required: true, message: "Name required" }]}
                                        style={{ flex: 1, marginBottom: 0 }}
                                      >
                                        <Input placeholder="Name" />
                                      </Form.Item>
                                      <Form.Item
                                        {...rest}
                                        name={[name, "phone"]}
                                        rules={[
                                          { required: true, message: "Phone required" },
                                          { pattern: /^\d{10,15}$/, message: "Enter valid number (10-15 digits)" },
                                        ]}
                                        style={{ flex: 1, marginBottom: 0 }}
                                      >
                                        <Input placeholder="WhatsApp number e.g. 919876543210" />
                                      </Form.Item>
                                      <Button
                                        type="text"
                                        danger
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => remove(name)}
                                        style={{ marginTop: 4 }}
                                      />
                                    </div>
                                  ))}
                                  <Form.Item style={{ marginBottom: 16 }}>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                      Add Recipient
                                    </Button>
                                    <Form.ErrorList errors={errors} />
                                  </Form.Item>
                                </>
                              )}
                            </Form.List>
                          </>
                        )
                      }
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                      <Space>
                        <Button onClick={() => { setCreateModalOpen(false); createForm.resetFields(); }}>
                          Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={creating} icon={<PlusOutlined />}>
                          Create
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Modal>

                {/* Activate Confirmation Modal */}
                <Modal
                  open={!!activateConfirm}
                  onCancel={() => setActivateConfirm(null)}
                  title="Activate Campaign"
                  okText="Yes, Activate"
                  okButtonProps={{ danger: true, loading: activating === activateConfirm?.id }}
                  onOk={async () => {
                    await handleActivateCampaign(activateConfirm.id);
                    setActivateConfirm(null);
                  }}
                  width={400}
                >
                  {activateConfirm && (
                    <div>
                      <p style={{ marginBottom: 12 }}>Are you sure you want to activate this campaign?</p>
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Cost Summary</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span>Recipients</span>
                          <span style={{ fontWeight: 600 }}>{activateConfirm.estimated_cost?.recipientCount ?? activateConfirm.recipient_count ?? 0}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span>Per message</span>
                          <span>₹{activateConfirm.estimated_cost?.perMessage ?? 0}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#fbbf24" }}>
                          <span>Total cost</span>
                          <span>₹{activateConfirm.estimated_cost?.total ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Modal>

                {/* Activate Result Modal */}
                <Modal
                  open={!!activateResult}
                  onCancel={() => setActivateResult(null)}
                  footer={<Button type="primary" onClick={() => setActivateResult(null)}>Close</Button>}
                  title={
                    <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#4ade80" }}>
                      <CheckCircleOutlined />
                      Campaign Activated
                    </span>
                  }
                >
                  {activateResult && (
                    <div>
                      <p style={{ marginBottom: 12 }}>{activateResult.message}</p>
                      <div style={{ display: "flex", gap: 16 }}>
                        <Statistic
                          title="Sent"
                          value={activateResult.summary?.sent ?? 0}
                          valueStyle={{ color: "#4ade80" }}
                          prefix={<CheckCircleOutlined />}
                        />
                        <Statistic
                          title="Failed"
                          value={activateResult.summary?.failed ?? 0}
                          valueStyle={{ color: activateResult.summary?.failed > 0 ? "#f87171" : "rgba(255,255,255,0.5)" }}
                          prefix={<ExclamationCircleOutlined />}
                        />
                        <Statistic
                          title="Total"
                          value={activateResult.summary?.total ?? 0}
                          valueStyle={{ color: "rgba(255,255,255,0.7)" }}
                          prefix={<TeamOutlined />}
                        />
                      </div>
                    </div>
                  )}
                </Modal>
              </>
            )}
          </Content>
        </Layout>
      </Layout>

      {/* create booking (cash) modal */}
      <Modal
        open={createBookingOpen}
        onCancel={() => { if (!creatingBooking) { setCreateBookingOpen(false); createBookingForm.resetFields(); } }}
        footer={null}
        width={720}
        destroyOnClose
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserAddOutlined />
            Create Booking (Cash)
          </span>
        }
      >
        {createBookingLoadingMeta && !createBookingMeta.loaded ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
        ) : (
          <Form
            form={createBookingForm}
            layout="vertical"
            onFinish={(values) => submitCreateBooking(values)}
            style={{ marginTop: 8 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.75)" }}>Primary Guest</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name required" }]}>
                <Input placeholder="Full name" />
              </Form.Item>
              <Form.Item
                name="contact_number"
                label="Contact Number"
                rules={[
                  { required: true, message: "Contact required" },
                  { pattern: /^\d{10}$/, message: "Exactly 10 digits" },
                ]}
              >
                <Input placeholder="10-digit mobile" maxLength={10} />
              </Form.Item>
              <Form.Item name="age" label="Age" rules={[{ required: true, message: "Age required" }]}>
                <InputNumber min={1} max={120} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                <Select options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]} />
              </Form.Item>
              <Form.Item name="chanting_rounds" label="Chanting Rounds">
                <InputNumber min={0} max={200} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="preaching_area_connected" label="Preaching Area">
                <Select
                  allowClear
                  placeholder="Select area"
                  options={[
                    { label: "Gita Essence", value: "Gita Essence" },
                    { label: "ISKCON Jia Sarai", value: "ISKCON Jia Sarai" },
                    { label: "ISKCON Srinagar", value: "ISKCON Srinagar" },
                    { label: "Siksharthakam", value: "Siksharthakam" },
                    { label: "Sreshtha", value: "Sreshtha" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="facilitator_name" label="Facilitator">
                <Input placeholder="Optional" />
              </Form.Item>
              <Form.Item name="preferred_room_partner" label="Preferred Room Partner">
                <Input placeholder="Optional" />
              </Form.Item>
            </div>

            <div style={{ fontWeight: 600, marginTop: 4, marginBottom: 8, color: "rgba(255,255,255,0.75)" }}>Accommodation</div>
            <Form.Item name="no_accommodation" label="Yatra fee only (no accommodation)">
              <Select
                options={[
                  { label: "No — includes accommodation", value: false },
                  { label: "Yes — yatra fee only", value: true },
                ]}
                onChange={(v) => {
                  if (v) {
                    createBookingForm.setFieldsValue({ room_id: undefined, transport_opted: false, transport_id: undefined });
                  }
                }}
              />
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(p, c) => p.no_accommodation !== c.no_accommodation}>
              {({ getFieldValue }) => !getFieldValue("no_accommodation") && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Form.Item name="room_id" label="Room" rules={[{ required: true, message: "Select a room" }]}>
                    <Select
                      placeholder="Select room"
                      options={createBookingMeta.rooms.map((r) => ({
                        label: `${r.name} (${r.room_type}) — ₹${r.price} · ${r.available_beds ?? "?"} beds left`,
                        value: r.id,
                        disabled: (r.available_beds ?? 1) <= 0,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="transport_opted" label="Transport" initialValue={false}>
                    <Select
                      options={[
                        { label: "Not opted", value: false },
                        { label: "Opted", value: true },
                      ]}
                      onChange={(v) => { if (!v) createBookingForm.setFieldsValue({ transport_id: undefined }); }}
                    />
                  </Form.Item>
                </div>
              )}
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(p, c) => p.transport_opted !== c.transport_opted || p.no_accommodation !== c.no_accommodation}>
              {({ getFieldValue }) =>
                !getFieldValue("no_accommodation") && getFieldValue("transport_opted") && (
                  <Form.Item name="transport_id" label="Transport Option" rules={[{ required: true, message: "Select transport" }]}>
                    <Select
                      placeholder="Select transport"
                      options={createBookingMeta.transport.map((t) => ({
                        label: `${t.name || t.route || "Transport"} — ₹${t.price}${t.available_seats != null ? ` · ${t.available_seats} seats left` : ""}`,
                        value: t.id,
                        disabled: t.available_seats != null && t.available_seats <= 0,
                      }))}
                    />
                  </Form.Item>
                )
              }
            </Form.Item>

            <div style={{ fontWeight: 600, marginTop: 4, marginBottom: 8, color: "rgba(255,255,255,0.75)" }}>Members</div>
            <Form.List name="members">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <div
                      key={key}
                      style={{
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Form.Item {...rest} name={[name, "name"]} label="Name" rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 8 }}>
                          <Input placeholder="Name" />
                        </Form.Item>
                        <Form.Item
                          {...rest}
                          name={[name, "contact_number"]}
                          label="Contact"
                          rules={[
                            { required: true, message: "Required" },
                            { pattern: /^\d{10}$/, message: "10 digits" },
                          ]}
                          style={{ marginBottom: 8 }}
                        >
                          <Input placeholder="10-digit mobile" maxLength={10} />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, "age"]} label="Age" rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 8 }}>
                          <InputNumber min={1} max={120} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, "gender"]} label="Gender" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                          <Select options={[
                            { label: "Male", value: "male" },
                            { label: "Female", value: "female" },
                            { label: "Other", value: "other" },
                          ]} />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, "chanting_rounds"]} label="Chanting Rounds" style={{ marginBottom: 8 }}>
                          <InputNumber min={0} max={200} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, "facilitator_name"]} label="Facilitator" style={{ marginBottom: 8 }}>
                          <Input placeholder="Optional" />
                        </Form.Item>
                      </div>
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)}>
                        Remove member
                      </Button>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add({ gender: "male", chanting_rounds: 0 })} block icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
                    Add Member
                  </Button>
                </>
              )}
            </Form.List>

            {/* Live total preview */}
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const noAcc = getFieldValue("no_accommodation");
                const roomId = getFieldValue("room_id");
                const transportOpted = getFieldValue("transport_opted");
                const transportId = getFieldValue("transport_id");
                const members = getFieldValue("members") || [];
                const occupants = 1 + members.length;
                let perPerson = 0;
                if (noAcc) {
                  perPerson = createBookingMeta.yatraFeeOnly;
                } else {
                  const room = createBookingMeta.rooms.find((r) => r.id === roomId);
                  const transport = transportOpted ? createBookingMeta.transport.find((t) => t.id === transportId) : null;
                  perPerson = (Number(room?.price) || 0) + (Number(transport?.price) || 0);
                }
                const total = perPerson * occupants;
                return (
                  <div
                    style={{
                      background: "rgba(217,119,6,0.08)",
                      border: "1px solid rgba(217,119,6,0.25)",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      {occupants} occupant{occupants > 1 ? "s" : ""} × ₹{perPerson} {noAcc ? "(yatra fee)" : "(room + transport)"}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24" }}>Total ₹{total}</div>
                  </div>
                );
              }}
            </Form.Item>

            <div style={{ fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.75)" }}>Cash Payment</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item
                name="amount_paid"
                label="Amount Paid (cash)"
                rules={[
                  { required: true, message: "Enter amount" },
                  {
                    validator: (_, v) => {
                      if (v == null) return Promise.resolve();
                      if (v < 0) return Promise.reject(new Error("Cannot be negative"));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber min={0} style={{ width: "100%" }} prefix="₹" />
              </Form.Item>
              <Form.Item name="payment_reference" label="Payment Reference">
                <Input placeholder="Receipt / reference #" />
              </Form.Item>
            </div>
            <Form.Item name="payment_note" label="Payment Note">
              <Input.TextArea rows={2} placeholder="Optional" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={() => { setCreateBookingOpen(false); createBookingForm.resetFields(); }} disabled={creatingBooking}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={creatingBooking} icon={<UserAddOutlined />}>
                  Create Booking
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* create booking result modal */}
      <Modal
        open={!!createBookingResult}
        onCancel={() => setCreateBookingResult(null)}
        footer={<Button type="primary" onClick={() => setCreateBookingResult(null)}>Close</Button>}
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#4ade80" }}>
            <CheckCircleOutlined />
            Booking Created
          </span>
        }
        width={480}
      >
        {createBookingResult && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Booking ID">
              <Text copyable style={{ fontFamily: "monospace", fontSize: 11 }}>{createBookingResult.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[normalizeStatus(createBookingResult.status)] || "default"}>
                {normalizeStatus(createBookingResult.status)?.replace(/_/g, " ").toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Total">₹{createBookingResult.total_amount}</Descriptions.Item>
            <Descriptions.Item label="Paid">
              <span style={{ color: "#4ade80", fontWeight: 600 }}>₹{createBookingResult.amount_paid}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Balance">
              <span style={{ color: createBookingResult.balance > 0 ? "#f87171" : "#4ade80", fontWeight: 600 }}>
                ₹{createBookingResult.balance}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Occupants">{createBookingResult.total_occupants}</Descriptions.Item>
            {createBookingResult.payment_source && (
              <Descriptions.Item label="Payment Source">
                <Tag color="gold">{String(createBookingResult.payment_source).toUpperCase()}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* sync result modal */}
      <Modal
        open={!!syncResult}
        onCancel={() => setSyncResult(null)}
        footer={
          <Space>
            {syncResult?.sheet_url && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => window.open(syncResult.sheet_url, "_blank", "noopener,noreferrer")}
              >
                Open Sheet
              </Button>
            )}
            <Button onClick={() => setSyncResult(null)}>Close</Button>
          </Space>
        }
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#4ade80" }}>
            <CheckCircleOutlined />
            Sheet Synced
          </span>
        }
        width={480}
      >
        {syncResult && (
          <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <Statistic
                title="Bookings Included"
                value={syncResult.bookings_included ?? 0}
                prefix={<BookOutlined />}
                valueStyle={{ color: "#60a5fa" }}
              />
              <Statistic
                title="Rows Written"
                value={syncResult.rows_written ?? 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#4ade80" }}
              />
            </div>
            {syncResult.synced_at && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                Synced at: <span style={{ color: "rgba(255,255,255,0.8)" }}>{fmtDate(syncResult.synced_at)}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* edit booking modal */}
      <Modal
        open={editBookingOpen}
        onCancel={() => { if (!editingBooking) { setEditBookingOpen(false); setEditBookingTarget(null); editBookingForm.resetFields(); } }}
        footer={null}
        width={720}
        destroyOnClose
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EditOutlined />
            Edit Booking
            {editBookingTarget && (
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                {editBookingTarget.id?.slice(0, 8)}…
              </Text>
            )}
          </span>
        }
      >
        {createBookingLoadingMeta && !createBookingMeta.loaded ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
        ) : editBookingTarget && (
          <Form
            form={editBookingForm}
            layout="vertical"
            onFinish={submitEditBooking}
            style={{ marginTop: 8 }}
          >
            {/* Current summary */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Occupants</div>
                <div style={{ color: "#fff", fontWeight: 600 }}>{editBookingTarget.total_occupants}</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Current Total</div>
                <div style={{ color: "#fff", fontWeight: 600 }}>₹{editBookingTarget.total_amount}</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Paid</div>
                <div style={{ color: "#4ade80", fontWeight: 600 }}>₹{editBookingTarget.amount_paid}</div>
              </div>
            </div>

            <div style={{ fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.75)" }}>Accommodation</div>
            <Form.Item name="no_accommodation" label="Mode">
              <Select
                options={[
                  { label: "Includes accommodation", value: false },
                  { label: "Yatra fee only", value: true },
                ]}
                onChange={(v) => {
                  if (v) {
                    editBookingForm.setFieldsValue({ transport_opted: false, transport_id: undefined });
                  }
                }}
              />
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(p, c) => p.no_accommodation !== c.no_accommodation}>
              {({ getFieldValue }) => !getFieldValue("no_accommodation") && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Form.Item
                    name="room_id"
                    label="Room"
                    rules={[{ required: true, message: "Select a room" }]}
                  >
                    <Select
                      placeholder="Select room"
                      options={createBookingMeta.rooms.map((r) => {
                        // current room stays selectable even if sold out
                        const isCurrent = r.id === editBookingTarget.room_id;
                        return {
                          label: `${r.name} (${r.room_type}) — ₹${r.price} · ${r.available_beds ?? "?"} beds left${isCurrent ? " · current" : ""}`,
                          value: r.id,
                          disabled: !isCurrent && (r.available_beds ?? 1) <= 0,
                        };
                      })}
                    />
                  </Form.Item>
                  <Form.Item name="transport_opted" label="Transport">
                    <Select
                      options={[
                        { label: "Not opted", value: false },
                        { label: "Opted", value: true },
                      ]}
                      onChange={(v) => { if (!v) editBookingForm.setFieldsValue({ transport_id: undefined }); }}
                    />
                  </Form.Item>
                </div>
              )}
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(p, c) => p.transport_opted !== c.transport_opted || p.no_accommodation !== c.no_accommodation}>
              {({ getFieldValue }) =>
                !getFieldValue("no_accommodation") && getFieldValue("transport_opted") && (
                  <Form.Item name="transport_id" label="Transport Option" rules={[{ required: true, message: "Select transport" }]}>
                    <Select
                      placeholder="Select transport"
                      options={createBookingMeta.transport.map((t) => {
                        const isCurrent = t.id === editBookingTarget.transport_id;
                        return {
                          label: `${t.name || t.route || "Transport"} — ₹${t.price}${t.available_seats != null ? ` · ${t.available_seats} seats left` : ""}${isCurrent ? " · current" : ""}`,
                          value: t.id,
                          disabled: !isCurrent && t.available_seats != null && t.available_seats <= 0,
                        };
                      })}
                    />
                  </Form.Item>
                )
              }
            </Form.Item>

            {/* Live delta preview */}
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const noAcc = getFieldValue("no_accommodation");
                const roomId = getFieldValue("room_id");
                const transportOpted = getFieldValue("transport_opted");
                const transportId = getFieldValue("transport_id");
                const cash = Number(getFieldValue("additional_cash_paid") || 0);
                const occupants = editBookingTarget.total_occupants || 1;
                let perPerson = 0;
                if (noAcc) {
                  perPerson = createBookingMeta.yatraFeeOnly;
                } else {
                  const room = createBookingMeta.rooms.find((r) => r.id === roomId);
                  const transport = transportOpted ? createBookingMeta.transport.find((t) => t.id === transportId) : null;
                  perPerson = (Number(room?.price) || 0) + (Number(transport?.price) || 0);
                }
                const newTotal = perPerson * occupants;
                const oldTotal = Number(editBookingTarget.total_amount) || 0;
                const oldPaid = Number(editBookingTarget.amount_paid) || 0;
                const refundPaid = Number(editBookingTarget.refund_paid) || 0;
                const netPaid = oldPaid + cash - refundPaid;
                const refundDue = Math.max(0, netPaid - newTotal);
                const balance = Math.max(0, newTotal - netPaid);
                const delta = newTotal - oldTotal;

                return (
                  <div
                    style={{
                      background: refundDue > 0 ? "rgba(248,113,113,0.08)" : "rgba(217,119,6,0.08)",
                      border: `1px solid ${refundDue > 0 ? "rgba(248,113,113,0.3)" : "rgba(217,119,6,0.25)"}`,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>New Total</div>
                        <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 16 }}>₹{newTotal}</div>
                        <div style={{ color: delta === 0 ? "rgba(255,255,255,0.4)" : delta > 0 ? "#fbbf24" : "#4ade80", fontSize: 11 }}>
                          {delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}₹${delta}`}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>Net Paid</div>
                        <div style={{ color: "#4ade80", fontWeight: 600 }}>₹{netPaid}</div>
                      </div>
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>Balance</div>
                        <div style={{ color: balance > 0 ? "#f87171" : "#4ade80", fontWeight: 600 }}>₹{balance}</div>
                      </div>
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>Refund Due</div>
                        <div style={{ color: refundDue > 0 ? "#f87171" : "rgba(255,255,255,0.5)", fontWeight: 600 }}>₹{refundDue}</div>
                      </div>
                    </div>
                    {refundDue > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#f87171", display: "flex", alignItems: "center", gap: 6 }}>
                        <WarningOutlined />
                        Refund will be pending — settle via <code>POST /settle-refund</code> after handing cash back.
                      </div>
                    )}
                  </div>
                );
              }}
            </Form.Item>

            <div style={{ fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.75)" }}>Cash Top-up (optional)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item
                name="additional_cash_paid"
                label="Additional Cash Paid"
                rules={[
                  {
                    validator: (_, v) => {
                      if (v == null || v === "") return Promise.resolve();
                      if (Number(v) < 0) return Promise.reject(new Error("Cannot be negative"));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber min={0} style={{ width: "100%" }} prefix="₹" placeholder="0" />
              </Form.Item>
              <Form.Item name="payment_reference" label="Payment Reference">
                <Input placeholder="Receipt / reference #" />
              </Form.Item>
            </div>
            <Form.Item name="payment_note" label="Payment Note">
              <Input.TextArea rows={2} placeholder="Optional" />
            </Form.Item>

            <Form.Item name="reason" label="Reason (admin note)">
              <Input.TextArea rows={2} placeholder="Why is this change being made?" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => { setEditBookingOpen(false); setEditBookingTarget(null); editBookingForm.resetFields(); }}
                  disabled={editingBooking}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={editingBooking} icon={<EditOutlined />}>
                  Save Changes
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* edit booking result modal */}
      <Modal
        open={!!editBookingResult}
        onCancel={() => setEditBookingResult(null)}
        footer={<Button type="primary" onClick={() => setEditBookingResult(null)}>Close</Button>}
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#4ade80" }}>
            <CheckCircleOutlined />
            Booking Updated
          </span>
        }
        width={520}
      >
        {editBookingResult && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 12 }}>
              <Descriptions.Item label="Old Total">₹{editBookingResult.old_total_amount}</Descriptions.Item>
              <Descriptions.Item label="New Total">
                <span style={{ fontWeight: 700, color: "#fbbf24" }}>₹{editBookingResult.new_total_amount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Paid">
                <span style={{ color: "#4ade80", fontWeight: 600 }}>₹{editBookingResult.amount_paid}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Cash Added">
                ₹{editBookingResult.additional_cash_paid ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Refund Paid">
                ₹{editBookingResult.refund_paid ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Refund Due">
                <span style={{ color: editBookingResult.refund_due > 0 ? "#f87171" : "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                  ₹{editBookingResult.refund_due ?? 0}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLORS[normalizeStatus(editBookingResult.status)] || "default"}>
                  {normalizeStatus(editBookingResult.status)?.replace(/_/g, " ").toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Refund Status">
                <Tag color={editBookingResult.refund_status === "pending" ? "red" : editBookingResult.refund_status === "settled" ? "green" : "default"}>
                  {String(editBookingResult.refund_status || "none").toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {editBookingResult.refund_status === "pending" && editBookingResult.refund_due > 0 && (
              <div style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 8,
                padding: 12,
                fontSize: 12,
                color: "#fca5a5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <WarningOutlined />
                  Refund of ₹{editBookingResult.refund_due} is pending — settle after handing cash back to the guest.
                </span>
                <Button
                  danger
                  type="primary"
                  size="small"
                  icon={<DollarOutlined />}
                  onClick={() => openSettleRefund({
                    id: editBookingResult.booking_id,
                    refund_due: editBookingResult.refund_due,
                    refund_paid: editBookingResult.refund_paid,
                    refund_status: editBookingResult.refund_status,
                  })}
                >
                  Settle Refund
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* settle refund modal */}
      <Modal
        open={settleRefundOpen}
        onCancel={() => { if (!settlingRefund) { setSettleRefundOpen(false); setSettleRefundTarget(null); settleRefundForm.resetFields(); } }}
        footer={null}
        width={480}
        destroyOnClose
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171" }}>
            <DollarOutlined />
            Settle Refund
          </span>
        }
      >
        {settleRefundTarget && (
          <Form
            form={settleRefundForm}
            layout="vertical"
            onFinish={submitSettleRefund}
            style={{ marginTop: 8 }}
          >
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              fontSize: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Refund Due</div>
                <div style={{ color: "#f87171", fontWeight: 700, fontSize: 18 }}>₹{settleRefundTarget.refund_due ?? 0}</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Already Refunded</div>
                <div style={{ color: "#4ade80", fontWeight: 600, fontSize: 16 }}>₹{settleRefundTarget.refund_paid ?? 0}</div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
              Record the actual refund you paid to the guest (UPI, cash, bank transfer, Razorpay refund, etc.).
            </div>

            <Form.Item
              name="amount"
              label="Amount Refunded"
              rules={[
                { required: true, message: "Enter amount" },
                {
                  validator: (_, v) => {
                    const n = Number(v);
                    if (!n || n <= 0) return Promise.reject(new Error("Must be greater than 0"));
                    const due = Number(settleRefundTarget.refund_due) || 0;
                    if (due > 0 && n > due) return Promise.reject(new Error(`Cannot exceed refund due (₹${due})`));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                max={Number(settleRefundTarget.refund_due) || undefined}
                style={{ width: "100%" }}
                prefix="₹"
              />
            </Form.Item>

            <Form.Item name="reference" label="Reference">
              <Input placeholder="UPI txn / bank ref / Razorpay refund id" />
            </Form.Item>

            <Form.Item name="note" label="Note">
              <Input.TextArea rows={2} placeholder="Optional — how the refund was paid, etc." />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => { setSettleRefundOpen(false); setSettleRefundTarget(null); settleRefundForm.resetFields(); }}
                  disabled={settlingRefund}
                >
                  Cancel
                </Button>
                <Button
                  danger
                  type="primary"
                  htmlType="submit"
                  loading={settlingRefund}
                  icon={<DollarOutlined />}
                >
                  Record Refund
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* settle refund result modal */}
      <Modal
        open={!!settleRefundResult}
        onCancel={() => setSettleRefundResult(null)}
        footer={<Button type="primary" onClick={() => setSettleRefundResult(null)}>Close</Button>}
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#4ade80" }}>
            <CheckCircleOutlined />
            Refund Recorded
          </span>
        }
        width={440}
      >
        {settleRefundResult && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Amount Settled">
              <span style={{ color: "#4ade80", fontWeight: 700 }}>₹{settleRefundResult.amount ?? settleRefundResult.settled_amount ?? 0}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Refund Paid">₹{settleRefundResult.refund_paid ?? 0}</Descriptions.Item>
            <Descriptions.Item label="Refund Due">
              <span style={{ color: Number(settleRefundResult.refund_due) > 0 ? "#f87171" : "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                ₹{settleRefundResult.refund_due ?? 0}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Refund Status">
              <Tag color={settleRefundResult.refund_status === "pending" ? "red" : settleRefundResult.refund_status === "settled" ? "green" : "default"}>
                {String(settleRefundResult.refund_status || "").toUpperCase()}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* cancel booking modal */}
      <Modal
        open={cancelBookingOpen}
        onCancel={() => { if (!cancellingBooking) { setCancelBookingOpen(false); setCancelBookingTarget(null); cancelBookingForm.resetFields(); } }}
        footer={null}
        width={520}
        destroyOnClose
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171" }}>
            <StopOutlined />
            Cancel Booking
          </span>
        }
      >
        {cancelBookingTarget && (
          <Form
            form={cancelBookingForm}
            layout="vertical"
            onFinish={submitCancelBooking}
            style={{ marginTop: 8 }}
          >
            <div style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              fontSize: 12,
              color: "#fca5a5",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}>
              <WarningOutlined style={{ marginTop: 2 }} />
              <div>
                This will mark the booking as <strong>cancelled</strong>, release its beds/fee-only headcount, and add the refund amount to <strong>refund due</strong>. This cannot be undone. Actual payout is done separately via <em>Settle Refund</em>.
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              fontSize: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Amount Paid</div>
                <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 16 }}>₹{cancelBookingTarget.amount_paid ?? 0}</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Already Refunded</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 16 }}>₹{cancelBookingTarget.refund_paid ?? 0}</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Net Paid</div>
                <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 16 }}>₹{cancelBookingTarget.__net_paid}</div>
              </div>
            </div>

            <Form.Item
              name="refund_amount"
              label={<span>Refund Amount <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, fontSize: 11 }}>(added to refund due; defaults to net paid)</span></span>}
              rules={[
                {
                  validator: (_, v) => {
                    if (v == null || v === "") return Promise.resolve();
                    const n = Number(v);
                    if (n < 0) return Promise.reject(new Error("Cannot be negative"));
                    const netPaid = Number(cancelBookingTarget.__net_paid) || 0;
                    if (n > netPaid) return Promise.reject(new Error(`Cannot exceed net paid (₹${netPaid})`));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                max={Number(cancelBookingTarget.__net_paid) || undefined}
                style={{ width: "100%" }}
                prefix="₹"
              />
            </Form.Item>

            <Form.Item name="reason" label="Reason (admin note)">
              <Input.TextArea rows={3} placeholder="Why is this booking being cancelled?" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => { setCancelBookingOpen(false); setCancelBookingTarget(null); cancelBookingForm.resetFields(); }}
                  disabled={cancellingBooking}
                >
                  Keep Booking
                </Button>
                <Button
                  danger
                  type="primary"
                  htmlType="submit"
                  loading={cancellingBooking}
                  icon={<StopOutlined />}
                >
                  Confirm Cancellation
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* cancel booking result modal */}
      <Modal
        open={!!cancelBookingResult}
        onCancel={() => setCancelBookingResult(null)}
        footer={
          <Space>
            {cancelBookingResult?.refund_status === "pending" && Number(cancelBookingResult?.refund_due) > 0 && (
              <Button
                danger
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => openSettleRefund({
                  id: cancelBookingResult.booking_id,
                  refund_due: cancelBookingResult.refund_due,
                  refund_paid: cancelBookingResult.refund_paid,
                  refund_status: cancelBookingResult.refund_status,
                })}
              >
                Settle Refund
              </Button>
            )}
            <Button type="primary" onClick={() => setCancelBookingResult(null)}>Close</Button>
          </Space>
        }
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171" }}>
            <StopOutlined />
            Booking Cancelled
          </span>
        }
        width={480}
      >
        {cancelBookingResult && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Booking ID">
              <Text copyable style={{ fontFamily: "monospace", fontSize: 11 }}>{cancelBookingResult.booking_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="red">{String(cancelBookingResult.status || "cancelled").toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount Paid">₹{cancelBookingResult.amount_paid ?? 0}</Descriptions.Item>
            <Descriptions.Item label="Refund Paid">₹{cancelBookingResult.refund_paid ?? 0}</Descriptions.Item>
            <Descriptions.Item label="Refund Due">
              <span style={{ color: Number(cancelBookingResult.refund_due) > 0 ? "#f87171" : "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                ₹{cancelBookingResult.refund_due ?? 0}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Refund Status">
              <Tag color={cancelBookingResult.refund_status === "pending" ? "red" : cancelBookingResult.refund_status === "settled" ? "green" : "default"}>
                {String(cancelBookingResult.refund_status || "none").toUpperCase()}
              </Tag>
            </Descriptions.Item>
            {cancelBookingResult.cancellation?.reason && (
              <Descriptions.Item label="Reason">{cancelBookingResult.cancellation.reason}</Descriptions.Item>
            )}
            {cancelBookingResult.cancellation?.cancelled_at && (
              <Descriptions.Item label="Cancelled At">{fmtDate(cancelBookingResult.cancellation.cancelled_at)}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* booking detail modal */}
      <Modal
        open={!!selectedBooking}
        onCancel={() => setSelectedBooking(null)}
        footer={
          selectedBooking ? (
            <Space>
              {selectedBooking.refund_status === "pending" && Number(selectedBooking.refund_due) > 0 && (
                <Button
                  danger
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={() => openSettleRefund(selectedBooking)}
                >
                  Settle Refund (₹{selectedBooking.refund_due})
                </Button>
              )}
              {selectedBooking.status !== "cancelled" && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => openCancelBooking(selectedBooking)}
                >
                  Cancel Booking
                </Button>
              )}
              {selectedBooking.status !== "cancelled" && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => openEditBooking(selectedBooking)}
                >
                  Edit Booking
                </Button>
              )}
              <Button onClick={() => setSelectedBooking(null)}>Close</Button>
            </Space>
          ) : null
        }
        width={640}
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOutlined />
            Booking Details
          </span>
        }
      >
        {selectedBooking && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Booking ID" span={2}>
                <Text copyable style={{ fontFamily: "monospace", fontSize: 11 }}>{selectedBooking.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLORS[normalizeStatus(selectedBooking.status)] || "default"}>
                  {normalizeStatus(selectedBooking.status)?.replace(/_/g, " ").toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Primary Contact">{selectedBooking.primary_contact}</Descriptions.Item>
              <Descriptions.Item label="Room">{selectedBooking.room_name || (selectedBooking.no_accommodation ? <Tag>Yatra Fee Only</Tag> : "NA")}</Descriptions.Item>
              <Descriptions.Item label="Room Type">{selectedBooking.room_type || "NA"}</Descriptions.Item>
              <Descriptions.Item label="Total Occupants">{selectedBooking.total_occupants}</Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <span style={{ fontWeight: 700 }}>₹{selectedBooking.total_amount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Amount Paid">
                <span style={{ fontWeight: 700, color: "#4ade80" }}>₹{selectedBooking.amount_paid}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Balance">
                <span style={{ fontWeight: 700, color: selectedBooking.total_amount - selectedBooking.amount_paid > 0 ? "#f87171" : "#4ade80" }}>
                  ₹{selectedBooking.total_amount - selectedBooking.amount_paid}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Transport">
                {selectedBooking.transport_opted ? <Tag color="blue">{selectedBooking.transport_name || "Yes"}</Tag> : "No"}
              </Descriptions.Item>
              <Descriptions.Item label="Booked At">{fmtDate(selectedBooking.created_at)}</Descriptions.Item>
              {selectedBooking.refund_status && selectedBooking.refund_status !== "none" && (
                <>
                  <Descriptions.Item label="Refund Status">
                    <Tag color={selectedBooking.refund_status === "pending" ? "red" : "green"}>
                      {String(selectedBooking.refund_status).toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Refund Due / Paid">
                    <span style={{ color: Number(selectedBooking.refund_due) > 0 ? "#f87171" : "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                      ₹{selectedBooking.refund_due ?? 0}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}> / </span>
                    <span style={{ color: "#4ade80", fontWeight: 600 }}>₹{selectedBooking.refund_paid ?? 0}</span>
                  </Descriptions.Item>
                </>
              )}
              {selectedBooking.last_payment_method && (
                <Descriptions.Item label="Last Payment">
                  <Tag>{selectedBooking.last_payment_method?.toUpperCase()}</Tag>
                  {selectedBooking.last_payment_at && (
                    <span style={{ fontSize: 11, marginLeft: 8, color: "rgba(255,255,255,0.4)" }}>
                      {fmtDate(selectedBooking.last_payment_at)}
                    </span>
                  )}
                </Descriptions.Item>
              )}
              {selectedBooking.last_payment_id && (
                <Descriptions.Item label="Payment ID">
                  <Text copyable style={{ fontFamily: "monospace", fontSize: 11 }}>{selectedBooking.last_payment_id}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
              <TeamOutlined style={{ marginRight: 8 }} />
              Guests ({selectedBooking.users?.length || 0})
            </Title>
            {selectedBooking.users?.map((user, idx) => (
              <div
                key={user.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar size="small" style={{ backgroundColor: user.is_primary ? "#d97706" : "#4b5563" }}>
                      {idx + 1}
                    </Avatar>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                    {user.is_primary && <Tag color="gold" style={{ fontSize: 10 }}>PRIMARY</Tag>}
                  </div>
                  <Tag>{user.gender}</Tag>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  <div><PhoneOutlined style={{ marginRight: 4 }} />{user.contact_number}</div>
                  <div>Age: {user.age}</div>
                  <div>Chanting Rounds: {user.chanting_rounds}</div>
                  {user.preaching_area_connected && <div>Area: {user.preaching_area_connected}</div>}
                  {user.facilitator_name && <div>Facilitator: {user.facilitator_name}</div>}
                  {user.preferred_room_partner && <div>Room Partner: {user.preferred_room_partner}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </ConfigProvider>
  );
}
