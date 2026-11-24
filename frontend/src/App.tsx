import { NotificationsPage } from './pages/NotificationsPage';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DonationsPage } from './pages/DonationsPage';
import { CreateDonationPage } from './pages/CreateDonationPage';
import { DonationDetailsPage } from './pages/DonationDetailsPage';
import { UrgencyRankingPage } from './pages/UrgencyRankingPage';
import { AvailableDonationsPage } from './pages/AvailableDonationsPage';
import { AcceptedDonationsPage } from './pages/AcceptedDonationsPage';
import { AssignedTasksPage } from './pages/AssignedTasksPage';
import { ProfilePage } from './pages/ProfilePage';
import { ManageUsersPage } from './pages/ManageUsersPage';

import { NGOProfilePage, ManageNGOsPage } from './pages/NGOPages';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/ngo/profile" element={<ProtectedRoute allowedRoles={['NGO']}><NGOProfilePage /></ProtectedRoute>} />
              <Route path="/admin/ngos" element={<ProtectedRoute allowedRoles={['Admin']}><ManageNGOsPage /></ProtectedRoute>} />

              <Route path="/donations" element={<DonationsPage />} />

              <Route
                path="/donations/create"
                element={
                  <ProtectedRoute allowedRoles={['Donor']}>
                    <CreateDonationPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/donations/:id"
                element={<DonationDetailsPage />}
              />

              <Route
                path="/urgency-ranking"
                element={<UrgencyRankingPage />}
              />

              <Route
                path="/available-donations"
                element={
                  <ProtectedRoute allowedRoles={['NGO', 'Admin']}>
                    <AvailableDonationsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/accepted-donations"
                element={
                  <ProtectedRoute allowedRoles={['NGO']}>
                    <AcceptedDonationsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/assigned-tasks"
                element={
                  <ProtectedRoute allowedRoles={['Volunteer']}>
                    <AssignedTasksPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin User Management */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <ManageUsersPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/profile" element={<ProfilePage />} />

            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}