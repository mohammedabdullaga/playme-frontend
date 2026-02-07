import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tokens from "./pages/Tokens";
import Devices from "./pages/Devices";
import Proxy from "./pages/Proxy";
import Subscriptions from "./pages/Subscriptions";
import ActivateDevice from "./pages/ActivateDevice";
import Messages from "./pages/Messages";
import AppStatus from "./pages/AppStatus";
import Heartbeat from "./pages/Heartbeat";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tokens" element={<ProtectedRoute><Tokens /></ProtectedRoute>} />
        <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
        <Route path="/activate" element={<ProtectedRoute><ActivateDevice /></ProtectedRoute>} />
        <Route path="/heartbeat" element={<ProtectedRoute><Heartbeat /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/status" element={<ProtectedRoute><AppStatus /></ProtectedRoute>} />
        <Route path="/proxy" element={<ProtectedRoute><Proxy /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
