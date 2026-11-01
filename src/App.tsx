import React, { useState, useEffect } from 'react';
import { User, UserRole, Patient, Observation, Alert, Device } from './types';
import { api } from './services/api';
import { TopBar } from './components/TopBar';
import { Sidebar, ViewType } from './components/Sidebar';
import { WelcomeView } from './views/WelcomeView';
import { DashboardView } from './views/DashboardView';
import { PatientsView } from './views/PatientsView';
import { DigitalTwinView } from './views/DigitalTwinView';
import { TimelineView } from './views/TimelineView';
import { HealthMonitoringView } from './views/HealthMonitoringView';
import { AiInsightsView } from './views/AiInsightsView';
import { AlertsView } from './views/AlertsView';
import { ReportsView } from './views/ReportsView';
import { DeviceIntegrationView } from './views/DeviceIntegrationView';
import { SettingsView } from './views/SettingsView';
import { AddPatientModal } from './components/AddPatientModal';
import { AddObservationModal } from './components/AddObservationModal';
import { AlertDetailModal } from './components/AlertDetailModal';

export default function App() {
  // Current session user (defaulting to null so user can test sign-in flow or switch quickly)
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'usr-clinician-1',
    email: 'clinician@hospital.org',
    fullName: 'Dr. Rachel Vance, MD',
    role: 'Clinician',
    assignedPatientId: null
  });

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Global data caches
  const [patients, setPatients] = useState<Patient[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals state
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAddObservationOpen, setIsAddObservationOpen] = useState(false);
  const [observationPatientTarget, setObservationPatientTarget] = useState<string | undefined>();
  const [selectedAlertForReview, setSelectedAlertForReview] = useState<Alert | null>(null);

  // Load all primary datasets
  const reloadData = async () => {
    try {
      const [pts, obs, alts, devs] = await Promise.all([
        api.getPatients(),
        api.getObservations(),
        api.getAlerts(),
        api.getDevices()
      ]);
      setPatients(pts);
      setObservations(obs);
      setAlerts(alts);
      setDevices(devs);
      if (!selectedPatientId && pts.length > 0) {
        setSelectedPatientId(pts[0].id);
      }
    } catch (err) {
      console.error('Error reloading app data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Quick switch role for testing
  const handleSwitchRole = (role: UserRole) => {
    if (!currentUser) return;
    let fullName = currentUser.fullName;
    let email = currentUser.email;

    if (role === 'Administrator') {
      fullName = 'Dr. Aris Thorne (Chief Medical Officer)';
      email = 'admin@recovery.org';
    } else if (role === 'Clinician') {
      fullName = 'Dr. Rachel Vance, MD (Post-Op Lead)';
      email = 'clinician@hospital.org';
    } else {
      fullName = 'Sarah Jenkins';
      email = 'patient.sarah@recovery.org';
    }

    setCurrentUser({
      ...currentUser,
      role,
      fullName,
      email
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'Patient' && user.assignedPatientId) {
      setSelectedPatientId(user.assignedPatientId);
    }
    reloadData();
  };

  const handleOpenAddObservation = (patientId?: string) => {
    setObservationPatientTarget(patientId || selectedPatientId);
    setIsAddObservationOpen(true);
  };

  const handlePatientCreated = (newPatientId: string) => {
    setSelectedPatientId(newPatientId);
    reloadData();
    setCurrentView('digital-twin');
  };

  const handleObservationCreated = (res: any) => {
    reloadData();
  };

  const handleMilestoneUpdate = async (id: string, completed: boolean) => {
    await api.updateMilestone(id, completed);
    reloadData();
  };

  const handleAlertUpdated = async (alertId: string, status: string, notes?: string, reviewer?: string) => {
    await api.updateAlert(alertId, status, notes, reviewer);
    reloadData();
  };

  const handleResetDatabase = async () => {
    await api.resetDemoDatabase();
    await reloadData();
  };

  // If not signed in, show WelcomeView
  if (!currentUser) {
    return <WelcomeView onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const unreadAlertsCount = alerts.filter(
    (a) => a.status === 'New' || a.status === 'Under Review'
  ).length;

  const viewTitles: Record<ViewType, string> = {
    dashboard: 'Clinical Dashboard',
    patients: 'Patient Management',
    'digital-twin': 'Digital Twin Profile',
    timeline: 'Recovery Timeline',
    'health-monitoring': 'Health Monitoring',
    'ai-insights': 'AI Insights & Trends',
    alerts: 'Alert Management',
    reports: 'Clinical Summary Reports',
    'device-integration': 'Device Integration',
    settings: 'Platform Settings'
  };

  return (
    <div className="min-h-screen bg-[#F3F7FA] flex flex-col antialiased">
      {/* Top Header */}
      <TopBar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        selectedPatientName={selectedPatient?.full_name}
        activeViewTitle={viewTitles[currentView]}
      />

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          onNavigate={(v) => setCurrentView(v)}
          userRole={currentUser.role}
          unreadAlertCount={unreadAlertsCount}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {currentView === 'dashboard' && (
              <DashboardView
                patients={patients}
                observations={observations}
                alerts={alerts}
                devices={devices}
                userRole={currentUser.role}
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onOpenAddPatient={() => setIsAddPatientOpen(true)}
                onOpenAddObservation={handleOpenAddObservation}
                onNavigate={(v) => setCurrentView(v)}
                onReviewAlert={(alt) => setSelectedAlertForReview(alt)}
              />
            )}

            {currentView === 'patients' && (
              <PatientsView
                patients={patients}
                userRole={currentUser.role}
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onOpenAddPatient={() => setIsAddPatientOpen(true)}
                onOpenAddObservation={handleOpenAddObservation}
                onNavigate={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'digital-twin' && (
              <DigitalTwinView
                patients={patients}
                selectedPatientId={selectedPatientId}
                userRole={currentUser.role}
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onOpenAddObservation={handleOpenAddObservation}
                onUpdateMilestone={handleMilestoneUpdate}
                onNavigate={(v) => setCurrentView(v)}
                onReviewAlert={(alt) => setSelectedAlertForReview(alt)}
              />
            )}

            {currentView === 'timeline' && (
              <TimelineView
                patients={patients}
                selectedPatientId={selectedPatientId}
                userRole={currentUser.role}
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onOpenAddObservation={handleOpenAddObservation}
              />
            )}

            {currentView === 'health-monitoring' && (
              <HealthMonitoringView
                patients={patients}
                observations={observations}
                userRole={currentUser.role}
                onOpenAddObservation={handleOpenAddObservation}
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onNavigate={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'ai-insights' && (
              <AiInsightsView
                patients={patients}
                observations={observations}
                alerts={alerts}
                userRole={currentUser.role}
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onNavigate={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'alerts' && (
              <AlertsView
                alerts={alerts}
                userRole={currentUser.role}
                onReviewAlert={(alt) => setSelectedAlertForReview(alt)}
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onNavigate={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'reports' && (
              <ReportsView
                patients={patients}
                selectedPatientId={selectedPatientId}
                userRole={currentUser.role}
                onSelectPatient={(id) => setSelectedPatientId(id)}
              />
            )}

            {currentView === 'device-integration' && (
              <DeviceIntegrationView
                devices={devices}
                patients={patients}
                userRole={currentUser.role}
                onRefreshDevices={reloadData}
                onNavigate={(v) => setCurrentView(v)}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView
                currentUser={currentUser}
                onSwitchRole={handleSwitchRole}
                onLogout={handleLogout}
                onResetDatabase={handleResetDatabase}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onSuccess={handlePatientCreated}
        onSubmitPatient={(data) => api.createPatient(data)}
      />

      <AddObservationModal
        isOpen={isAddObservationOpen}
        onClose={() => setIsAddObservationOpen(false)}
        patients={patients}
        selectedPatientId={observationPatientTarget || selectedPatientId}
        onSuccess={handleObservationCreated}
        onSubmitObservation={(data) => api.recordObservation(data)}
      />

      <AlertDetailModal
        isOpen={Boolean(selectedAlertForReview)}
        alert={selectedAlertForReview}
        onClose={() => setSelectedAlertForReview(null)}
        onUpdateAlert={handleAlertUpdated}
      />
    </div>
  );
}
