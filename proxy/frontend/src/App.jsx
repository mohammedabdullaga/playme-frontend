import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProxyDetailPage from './pages/ProxyDetailPage';
import OverviewPage from './pages/OverviewPage';
import UserDetailPage from './pages/UserDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
          <Route path="/proxies" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/user/:id" element={<ProtectedRoute><UserDetailPage /></ProtectedRoute>} />
          <Route path="/proxy/:id" element={<ProtectedRoute><ProxyDetailPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
