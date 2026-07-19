import { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VrajKartikYatra from "./VrajKartikYatra";
const RoomBookingPortal = lazy(() => import('./RoomBookingPortal'));

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VrajKartikYatra />} />
        <Route path="/room-booking" element={<RoomBookingPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
