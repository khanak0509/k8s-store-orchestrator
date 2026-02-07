import React from 'react';
import StoreDashboard from './components/StoreDashboard';
import { Store } from 'lucide-react';

const Navbar = () => (
  <header style={{ 
    height: 'var(--nav-height)', 
    backgroundColor: 'white', 
    borderBottom: '1px solid var(--border-subtle)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center'
  }}>
    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          backgroundColor: 'var(--text-main)', 
          padding: '8px', 
          borderRadius: '8px',
          display: 'flex'
        }}>
          <Store size={20} color="white" />
        </div>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Urumi Ops</h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Infrastructure Monitor</span>
      </div>
    </div>
  </header>
);

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '40px 0' }}>
        <div className="container">
          <StoreDashboard />
        </div>
      </main>
    </div>
  );
}

export default App;
