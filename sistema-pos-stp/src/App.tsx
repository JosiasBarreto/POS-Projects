import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import SalesHistory from './pages/SalesHistory';
import Proformas from './pages/Proformas';
import PostSale from './pages/PostSale';
import AuditLogs from './pages/AuditLogs';
import { Toaster } from 'sonner';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS setActiveTab={setActiveTab} />;
      case 'sales': return <SalesHistory />;
      case 'proformas': return <Proformas />;
      case 'post-sale': return <PostSale setActiveTab={setActiveTab} />;
      case 'inventory': return <Inventory />;
      case 'clients': return <Clients />;
      case 'users': return <Users />;
      case 'reports': return <Reports />;
      case 'audit': return <AuditLogs />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
      <Toaster position="top-right" richColors />
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
