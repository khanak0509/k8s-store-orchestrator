import React, { useState } from 'react';
import StoreDashboard from './components/StoreDashboard';
import { Layout, Store, Settings, Activity, Trash2, Plus, Globe, ExternalLink, Clock } from 'lucide-react';

const Sidebar = () => (
  <div className="glass-panel" style={{ 
    width: 'var(--sidebar-width)', 
    height: '100vh', 
    position: 'fixed', 
    left: 0, 
    top: 0,
    borderRadius: 0,
    borderLeft: 'none',
    borderTop: 'none',
    borderBottom: 'none',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        padding: '0.5rem',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Store size={24} color="white" />
      </div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>URUMI OPS</h2>
    </div>

    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div className="nav-item active" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        background: 'rgba(88, 166, 255, 0.1)',
        color: 'var(--accent-primary)',
        cursor: 'pointer',
        fontWeight: '600'
      }}>
        <Layout size={18} /> Dashboard
      </div>
      <div className="nav-item" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: '500'
      }}>
        <Activity size={18} /> Activity Log
      </div>
      <div className="nav-item" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: '500'
      }}>
        <Settings size={18} /> Settings
      </div>
    </nav>

    <div style={{ marginTop: 'auto' }}>
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>QUOTA USAGE</p>
        <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', marginBottom: '0.5rem' }}>
          <div style={{ width: '45%', height: '100%', background: 'var(--accent-primary)', borderRadius: '3px' }}></div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>3 of 10 stores</p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ 
        marginLeft: 'var(--sidebar-width)', 
        flex: 1, 
        padding: '2rem 3rem',
        maxWidth: '1400px'
      }}>
        <StoreDashboard />
      </main>
    </div>
  );
}

export default App;
