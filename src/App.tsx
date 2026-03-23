/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Menu, X } from 'lucide-react';

// Lazy load pages for performance
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Teams = React.lazy(() => import('./pages/Teams'));
const Events = React.lazy(() => import('./pages/Events'));
const Announcements = React.lazy(() => import('./pages/Announcements'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));

// Protected Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const ManageEvents = React.lazy(() => import('./pages/admin/ManageEvents'));
const ManageTeams = React.lazy(() => import('./pages/admin/ManageTeams'));
const ManageMembers = React.lazy(() => import('./pages/admin/ManageMembers'));
const ManageUsers = React.lazy(() => import('./pages/admin/ManageUsers'));
const ManageRegistrations = React.lazy(() => import('./pages/admin/ManageRegistrations'));
const QueryManagement = React.lazy(() => import('./pages/admin/QueryManagement'));
const ManageAnnouncements = React.lazy(() => import('./pages/admin/ManageAnnouncements'));

import Footer from './components/Footer';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium tracking-wide">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-white/10 z-40 flex items-center justify-between px-4">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          CCS Portal
        </span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 ml-0 md:ml-64 flex flex-col overflow-hidden pt-16 md:pt-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)'
              }
            }} 
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/teams" element={<PublicLayout><Teams /></PublicLayout>} />
            <Route path="/events" element={<PublicLayout><Events /></PublicLayout>} />
            <Route path="/announcements" element={<PublicLayout><Announcements /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute requireAdmin><ManageEvents /></ProtectedRoute>} />
            <Route path="/admin/teams" element={<ProtectedRoute requireAdmin><ManageTeams /></ProtectedRoute>} />
            <Route path="/admin/members" element={<ProtectedRoute requireAdmin><ManageMembers /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/registrations" element={<ProtectedRoute requireAdmin><ManageRegistrations /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute requireAdmin><ManageAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/queries" element={<ProtectedRoute requireAdmin><QueryManagement /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
