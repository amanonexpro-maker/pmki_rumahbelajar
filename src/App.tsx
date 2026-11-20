/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { Hero } from './components/public/Hero.tsx';
import { AboutSection } from './components/public/AboutSection.tsx';
import { ProgramSection } from './components/public/ProgramSection.tsx';
import { ScheduleSection } from './components/public/ScheduleSection.tsx';
import { GallerySection } from './components/public/GallerySection.tsx';
import { NewsSection } from './components/public/NewsSection.tsx';
import { RegistrationForm } from './components/public/RegistrationForm.tsx';
import { ContactSection } from './components/public/ContactSection.tsx';

// Dashboard Components
import { DashboardLayout } from './components/dashboard/DashboardLayout.tsx';
import { OverviewView } from './components/dashboard/OverviewView.tsx';
import { StudentsView } from './components/dashboard/StudentsView.tsx';
import { AttendanceView } from './components/dashboard/AttendanceView.tsx';
import { StudentDevelopmentView } from './components/dashboard/StudentDevelopmentView.tsx';
import { ConsentMediaView } from './components/dashboard/ConsentMediaView.tsx';
import { PublishingView } from './components/dashboard/PublishingView.tsx';
import { ReportsApprovalView } from './components/dashboard/ReportsApprovalView.tsx';
import { OrganizationView } from './components/dashboard/OrganizationView.tsx';
import { AuditLogView } from './components/dashboard/AuditLogView.tsx';
import { AdministrationView } from './components/dashboard/AdministrationView.tsx';

function DatabaseStatusIndicator() {
  const [error, setError] = useState<string>();

  useEffect(() => {
    const handleStatus = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const status = event.detail as { connected: boolean; message?: string };
      setError(status.connected ? undefined : status.message || 'Koneksi database gagal');
    };

    window.addEventListener('pmki:database-status', handleStatus);
    return () => window.removeEventListener('pmki:database-status', handleStatus);
  }, []);

  if (!error) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-control bg-danger px-4 py-3 text-sm text-white shadow-md" role="alert">
      Gagal menyimpan ke database: {error}
    </div>
  );
}

export default function App() {
  const [appMode, setAppMode] = useState<'PUBLIC' | 'DASHBOARD'>('PUBLIC');
  const [publicTab, setPublicTab] = useState<string>('beranda');
  const [dashboardView, setDashboardView] = useState<string>('overview');

  // Workflow continuity context across Schedule -> Class -> Attendance -> Student -> Development (UI-7 Section 22)
  const [activeClassContextId, setActiveClassContextId] = useState<
    string | undefined
  >(undefined);
  const [activeStudentContextId, setActiveStudentContextId] = useState<
    string | undefined
  >(undefined);

  const handleSelectDashboardView = (view: string) => {
    if (view !== 'students') {
      setActiveStudentContextId(undefined);
    }
    setDashboardView(view);
  };

  const handleOpenStudentDetail = (studentId: string) => {
    setActiveStudentContextId(studentId);
    setDashboardView('students');
  };

  const handleOpenAttendanceForClass = (classId: string) => {
    setActiveClassContextId(classId);
    setDashboardView('attendance');
  };

  const handleOpenDevelopment = (classId?: string, studentId?: string) => {
    if (classId) setActiveClassContextId(classId);
    if (studentId) setActiveStudentContextId(studentId);
    setDashboardView('development');
  };

  const scrollToSection = (id: string) => {
    setPublicTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (appMode === 'DASHBOARD') {
    return (
      <DashboardLayout
        currentView={dashboardView}
        onSelectView={handleSelectDashboardView}
        onBackToPublic={() => setAppMode('PUBLIC')}
      >
        <DatabaseStatusIndicator />
        {dashboardView === 'overview' && (
          <OverviewView onNavigate={handleSelectDashboardView} />
        )}
        {dashboardView === 'students' && (
          <StudentsView initialStudentId={activeStudentContextId} />
        )}
        {dashboardView === 'attendance' && (
          <AttendanceView
            initialClassId={activeClassContextId}
            onOpenDevelopment={handleOpenDevelopment}
            onOpenStudent={handleOpenStudentDetail}
          />
        )}
        {dashboardView === 'development' && (
          <StudentDevelopmentView
            initialClassId={activeClassContextId}
            initialStudentId={activeStudentContextId}
            onOpenStudent={handleOpenStudentDetail}
          />
        )}
        {dashboardView === 'consent-media' && <ConsentMediaView />}
        {dashboardView === 'publishing' && <PublishingView />}
        {dashboardView === 'reports' && <ReportsApprovalView />}
        {dashboardView === 'organization' && (
          <OrganizationView
            onOpenAttendanceForClass={handleOpenAttendanceForClass}
            onOpenStudentDetail={handleOpenStudentDetail}
          />
        )}
        {dashboardView === 'audit-log' && <AuditLogView />}
        {dashboardView === 'admin' && <AdministrationView />}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <DatabaseStatusIndicator />
      {/* Public Header */}
      <Navbar
        currentTab={publicTab}
        onSelectTab={scrollToSection}
        onOpenDashboard={() => setAppMode('DASHBOARD')}
      />

      {/* Main Public Body */}
      <main className="flex-1">
        <Hero
          onRegisterClick={() => scrollToSection('pendaftaran')}
          onExplorePrograms={() => scrollToSection('program')}
        />

        <AboutSection />

        <ProgramSection
          onRegisterClick={() => scrollToSection('pendaftaran')}
        />

        <ScheduleSection />

        <GallerySection />

        <NewsSection />

        <RegistrationForm
          onSuccessRegistered={() => {
            // Can show alert or keep inline
          }}
        />

        <ContactSection />
      </main>

      {/* Institutional Footer */}
      <Footer
        onSelectTab={scrollToSection}
        onOpenDashboard={() => setAppMode('DASHBOARD')}
      />
    </div>
  );
}
