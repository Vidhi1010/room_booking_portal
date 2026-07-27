import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message, Card } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { API_BASE } from "./config";

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("admin_token", data.token);
        message.success("Login successful");
        navigate("/admin");
      } else {
        message.error(data.message || "Invalid credentials");
      }
    } catch {
      message.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      <Card
        className="w-full max-w-sm"
        style={{ borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <LockOutlined style={{ fontSize: 24, color: "#fff" }} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Admin Login</h1>
          <p className="text-xs text-gray-400 mt-1">Kartik Vraj Yatra 2026</p>
        </div>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="email"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                borderRadius: 10,
                background: "linear-gradient(to right, #d97706, #ea580c)",
                border: "none",
                fontWeight: 700,
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
