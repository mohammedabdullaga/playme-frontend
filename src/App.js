import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tokens from "./pages/Tokens";
import Devices from "./pages/Devices";
import Users from "./pages/Users";
import Proxy from "./pages/Proxy";
import Subscriptions from "./pages/Subscriptions";
import ActivateDevice from "./pages/ActivateDevice";
import Messages from "./pages/Messages";
import AppStatus from "./pages/AppStatus";
import Heartbeat from "./pages/Heartbeat";
import Resellers from "./pages/Resellers";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <div className="app-grid">
          <Navbar />
          <main className="page-shell">
            <div className="page-body">
              <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/tokens" element={<ProtectedRoute><Tokens /></ProtectedRoute>} />
              <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
              <Route path="/activate" element={<ProtectedRoute><ActivateDevice /></ProtectedRoute>} />
              <Route path="/heartbeat" element={<ProtectedRoute><Heartbeat /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/status" element={<ProtectedRoute><AppStatus /></ProtectedRoute>} />
              <Route path="/proxy" element={<ProtectedRoute><Proxy /></ProtectedRoute>} />
              <Route path="/reseller-panel" element={<ProtectedRoute><Resellers /></ProtectedRoute>} />
              <Route path="/resellers" element={<ProtectedRoute><Resellers /></ProtectedRoute>} />
            </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
