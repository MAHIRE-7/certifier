import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { VerifyPage } from './pages/VerifyPage';
import { VerifyDetailPage } from './pages/VerifyDetailPage';
import { IssuerProfilePage } from './pages/IssuerProfilePage';
import { BadgeDetailPage } from './pages/BadgeDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PrivacyPage, TermsPage, SecurityPage } from './pages/PolicyPages';

import { DashboardLayout } from './components/DashboardLayout';
import { DashboardOverviewPage } from './pages/dashboard/DashboardOverviewPage';
import { EventsPage } from './pages/dashboard/EventsPage';
import { NewEventPage } from './pages/dashboard/NewEventPage';
import { EventDetailPage } from './pages/dashboard/EventDetailPage';
import { CredentialsPage } from './pages/dashboard/CredentialsPage';
import { CredentialDetailPage } from './pages/dashboard/CredentialDetailPage';
import { BadgesPage } from './pages/dashboard/BadgesPage';
import { TemplatesPage } from './pages/dashboard/TemplatesPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { AdminIssuersPage } from './pages/dashboard/AdminIssuersPage';
import { AdminAuditPage } from './pages/dashboard/AdminAuditPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes with Main Navbar & Footer */}
      <Route
        path="/"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <HomePage />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/verify"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <VerifyPage />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/verify/:credentialId"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <VerifyDetailPage />
            </main>
            <Footer />
          </div>
        }
      />

      {/* Redirect /credentials/:credentialId to canonical /verify/:credentialId */}
      <Route
        path="/credentials/:credentialId"
        element={<Navigate to="/verify/:credentialId" replace />}
      />

      <Route
        path="/issuers/:slug"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <IssuerProfilePage />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/badges/:badgeId"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <BadgeDetailPage />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/privacy"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <PrivacyPage />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/terms"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <TermsPage />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/security"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <SecurityPage />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/login"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <LoginPage />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/register"
        element={
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <RegisterPage />
            </main>
            <Footer />
          </div>
        }
      />

      {/* Dashboard Routes with DashboardLayout */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverviewPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/new" element={<NewEventPage />} />
        <Route path="events/:eventId" element={<EventDetailPage />} />
        <Route path="credentials" element={<CredentialsPage />} />
        <Route path="credentials/:credentialId" element={<CredentialDetailPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Admin Governance Routes */}
      <Route path="/admin" element={<DashboardLayout />}>
        <Route path="issuers" element={<AdminIssuersPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
