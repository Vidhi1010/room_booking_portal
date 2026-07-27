import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VrajKartikYatra from "./VrajKartikYatra";
const RoomBookingPortal = lazy(() => import('./RoomBookingPortal'));
const RoomSelection = lazy(() => import('./RoomSelection'));
const Checkout = lazy(() => import('./Checkout'));
const AdminLogin = lazy(() => import('./AdminLogin'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FDF8F0]"><div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          <Route path="/" element={<VrajKartikYatra />} />
          <Route path="/register" element={<RoomSelection />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/room-booking" element={<RoomBookingPortal />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
