import { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import JanmashtamiWebsite from "./JanmashtamiWebsite";
const RoomBookingPortal = lazy(() => import('./RoomBookingPortal'));

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JanmashtamiWebsite />} />
        <Route path="/room-booking" element={<RoomBookingPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
