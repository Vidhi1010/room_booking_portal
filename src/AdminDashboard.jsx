import { useState, useEffect, useCallback } from "react";
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
  unpaid: "default",
};

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
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [filters, setFilters] = useState({
    limit: 50,
    status: undefined,
    transport_opted: undefined,
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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.limit) params.set("limit", filters.limit);
      if (filters.status) params.set("status", filters.status);
      if (filters.transport_opted !== undefined && filters.transport_opted !== null) {
        params.set("transport_opted", filters.transport_opted);
      }
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
      setBookings(list);
    } catch {
      message.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }, [token, filters, navigate]);

  useEffect(() => {
    if (token) fetchBookings();
  }, [token, fetchBookings]);

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
      render: (s) => (
        <Tag color={STATUS_COLORS[s] || "default"}>
          {s?.replace(/_/g, " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Transport",
      key: "transport",
      width: 100,
      align: "center",
      render: (_, r) => r.transport_opted ? <Tag color="blue">{r.transport_name || "Yes"}</Tag> : <Tag>No</Tag>,
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
                    {bookings.length} total booking{bookings.length !== 1 ? "s" : ""}
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
                      { label: "Pending Payment", value: "pending_payment" },
                      { label: "Unpaid", value: "unpaid" },
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
                  <InputNumber
                    placeholder="Limit"
                    min={1}
                    max={500}
                    value={filters.limit}
                    onChange={(v) => setFilters((f) => ({ ...f, limit: v || 50 }))}
                    style={{ width: 90 }}
                  />
                  <Button icon={<ReloadOutlined />} onClick={fetchBookings} loading={loading}>
                    Refresh
                  </Button>
                </div>

                <Table
                  columns={columns}
                  dataSource={bookings}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} bookings` }}
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
                    {/* Top-level stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                      <Card style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Statistic
                          title={<span style={{ color: "rgba(255,255,255,0.5)" }}>Total Bookings</span>}
                          value={dashboardData.total_bookings}
                          prefix={<BookOutlined />}
                          valueStyle={{ color: "#fff", fontSize: 28 }}
                        />
                      </Card>
                      <Card style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Statistic
                          title={<span style={{ color: "rgba(255,255,255,0.5)" }}>Revenue Collected</span>}
                          value={dashboardData.revenue_collected}
                          prefix="₹"
                          valueStyle={{ color: "#4ade80", fontSize: 28 }}
                        />
                      </Card>
                      <Card style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Statistic
                          title={<span style={{ color: "rgba(255,255,255,0.5)" }}>Pending Payments</span>}
                          value={dashboardData.pending_payments}
                          prefix="₹"
                          valueStyle={{ color: "#fbbf24", fontSize: 28 }}
                        />
                      </Card>
                      <Card style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Statistic
                          title={<span style={{ color: "rgba(255,255,255,0.5)" }}>Total Expected</span>}
                          value={dashboardData.total_expected}
                          prefix="₹"
                          valueStyle={{ color: "rgba(255,255,255,0.8)", fontSize: 28 }}
                        />
                      </Card>
                    </div>

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

                    {/* Status Breakdown */}
                    <Card
                      title={<span style={{ color: "#fff" }}><DashboardOutlined style={{ marginRight: 8 }} />Status Breakdown</span>}
                      style={{ background: "#141720", border: "1px solid rgba(255,255,255,0.06)", maxWidth: 500 }}
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
                          title={<span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Pending</span>}
                          value={dashboardData.status_breakdown?.pending_payment}
                          prefix={<ExclamationCircleOutlined />}
                          valueStyle={{ color: "#f87171", fontSize: 22 }}
                        />
                      </div>
                    </Card>
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

      {/* booking detail modal */}
      <Modal
        open={!!selectedBooking}
        onCancel={() => setSelectedBooking(null)}
        footer={null}
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
                <Tag color={STATUS_COLORS[selectedBooking.status] || "default"}>
                  {selectedBooking.status?.replace(/_/g, " ").toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Primary Contact">{selectedBooking.primary_contact}</Descriptions.Item>
              <Descriptions.Item label="Room">{selectedBooking.room_name}</Descriptions.Item>
              <Descriptions.Item label="Room Type">{selectedBooking.room_type}</Descriptions.Item>
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
