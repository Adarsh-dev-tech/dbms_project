import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CampaignsPage } from './pages/CampaignsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { RegisterPage } from './pages/RegisterPage';
import { UsersPage } from './pages/UsersPage';
import { VisitorsPage } from './pages/VisitorsPage';
import { PageKey } from './types';

function AppShell() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(
    null,
  );

  function notify(text: string, isError = false) {
    setToast({ text, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }

  if (loading) {
    return <div className="loading-screen">Loading ExhibitionApp...</div>;
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <>
      <Layout activePage={activePage} onNavigate={setActivePage}>
        {activePage === 'dashboard' && (
          <DashboardPage onNavigate={setActivePage} />
        )}
        {activePage === 'campaigns' && <CampaignsPage onNotify={notify} />}
        {activePage === 'visitors' && <VisitorsPage onNotify={notify} />}
        {activePage === 'products' && <ProductsPage onNotify={notify} />}
        {activePage === 'users' && <UsersPage onNotify={notify} />}
      </Layout>

      {toast && (
        <div
          className={`toast ${toast.isError ? 'error' : ''}`}
          role="status"
          aria-live="polite"
        >
          {toast.text}
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
