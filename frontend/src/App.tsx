import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { RegisterSurplusPage } from './pages/RegisterSurplusPage';
import { MyDonationsPage } from './pages/MyDonationsPage';
import { AvailableFoodPage } from './pages/AvailableFoodPage';
import { NgoRequestsPage } from './pages/NgoRequestsPage';
import { VolunteerPickupsPage } from './pages/VolunteerPickupsPage';
import { VolunteerMyTasksPage } from './pages/VolunteerMyTasksPage';
import { AdminAllDonationsPage } from './pages/AdminAllDonationsPage';
import { AdminMatchingPage } from './pages/AdminMatchingPage';
import { UsersPage } from './pages/UsersPage';
import { ImpactPage } from './pages/ImpactPage';

// Root redirect handler: if authenticated, go to /dashboard; else go to /login
const RootRedirect: React.FC = () => {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Root & Auth Routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Donor Routes */}
              <Route
                path="/register-surplus"
                element={
                  <ProtectedRoute allowedRoles={['Donor']}>
                    <RegisterSurplusPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-donations"
                element={
                  <ProtectedRoute allowedRoles={['Donor']}>
                    <MyDonationsPage />
                  </ProtectedRoute>
                }
              />

              {/* NGO Routes */}
              <Route
                path="/available-food"
                element={
                  <ProtectedRoute allowedRoles={['NGO', 'Admin']}>
                    <AvailableFoodPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-requests"
                element={
                  <ProtectedRoute allowedRoles={['NGO', 'Admin']}>
                    <NgoRequestsPage />
                  </ProtectedRoute>
                }
              />

              {/* Volunteer Routes */}
              <Route
                path="/pickup-tasks"
                element={
                  <ProtectedRoute allowedRoles={['Volunteer', 'Admin']}>
                    <VolunteerPickupsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tasks"
                element={
                  <ProtectedRoute allowedRoles={['Volunteer', 'Admin']}>
                    <VolunteerMyTasksPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/all-donations"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminAllDonationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matching"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'NGO']}>
                    <AdminMatchingPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/users" element={<UsersPage />} />

              {/* Shared Impact Route */}
              <Route path="/impact" element={<ImpactPage />} />

              {/* Compatibility Aliases */}
              <Route path="/donations" element={<Navigate to="/my-donations" replace />} />
              <Route path="/donations/create" element={<Navigate to="/register-surplus" replace />} />
              <Route path="/available-donations" element={<Navigate to="/available-food" replace />} />
              <Route path="/accepted-donations" element={<Navigate to="/my-requests" replace />} />
              <Route path="/assigned-tasks" element={<Navigate to="/pickup-tasks" replace />} />
              <Route path="/urgency-ranking" element={<Navigate to="/matching" replace />} />
              <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
