import React, { useState, useEffect } from 'react';
import { Activity, Database, CheckCircle, AlertCircle, Cpu } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const InfrastructureMonitor = () => {
  const [status, setStatus] = useState({
    healthy: false,
    managed_stores: 0,
    total_pods: 0,
    engine: 'k3d'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/cluster/health`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch cluster health:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      backgroundColor: '#f8fafc',
      padding: '4px 16px',
      borderRadius: '999px',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {status.healthy ? (
          <div style={{ position: 'relative', display: 'flex' }}>
            <div className="pulse" style={{ 
              position: 'absolute', 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              backgroundColor: 'var(--success)', 
              opacity: 0.6 
            }}></div>
            <CheckCircle size={14} color="var(--success)" />
          </div>
        ) : (
          <AlertCircle size={14} color="var(--danger)" />
        )}
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {status.healthy ? 'Healthy' : 'Disconnected'}
        </span>
      </div>

      <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Database size={14} color="var(--text-muted)" />
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
          {status.managed_stores} Stores
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Cpu size={14} color="var(--text-muted)" />
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
          {status.total_pods} Pods
        </span>
      </div>

      <style>{`
        .pulse {
          animation: pulse-animation 2s infinite;
        }
        @keyframes pulse-animation {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
};

export default InfrastructureMonitor;
