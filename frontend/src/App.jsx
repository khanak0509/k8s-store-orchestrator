import React from 'react';
import StoreDashboard from './components/StoreDashboard';
import InfrastructureMonitor from './components/InfrastructureMonitor';

const Navbar = () => (
  <header style={{ 
    height: 'var(--nav-height)', 
    backgroundColor: 'white', 
    borderBottom: '1px solid var(--border-subtle)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px'
  }}>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
      <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, whiteSpace: 'nowrap' }}>Urumi</h1>
    </div>
    
    <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
      <InfrastructureMonitor />
    </div>

    <div style={{ flex: 1 }}></div>
  </header>
);

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ padding: '2rem 4rem' }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem', fontWeight: 'bold' }}>Round 1</h1>
        <StoreDashboard />
      </div>
    </div>
  );
}

export default App;
