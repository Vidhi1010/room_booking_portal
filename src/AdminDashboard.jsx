import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Table,
  Tag,
  Select,
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
              { key: "bookings", icon: <BookOutlined />, label: "Bookings" },
              { key: "rooms", icon: <HomeOutlined />, label: "Rooms" },
              { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard", disabled: true },
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
