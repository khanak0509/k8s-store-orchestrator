import React, { useState } from 'react';
import { ExternalLink, Trash2, Clock, Globe, ShieldCheck, AlertCircle, RefreshCcw, Lock, Copy, Check, Activity } from 'lucide-react';

const StoreCard = ({ store, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [quota, setQuota] = useState(null);
  const [showQuota, setShowQuota] = useState(false);

  const fetchQuota = async () => {
    if (store.status !== 'Ready') return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/stores/${store.id}/quota`);
      if (response.ok) {
        const data = await response.json();
        setQuota(data);
      }
    } catch (err) {
      console.error('Failed to fetch quota:', err);
    }
  };

  React.useEffect(() => {
      if (showQuota) fetchQuota();
  }, [showQuota, store.status]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ready':
        return <span className="badge badge-ready"><Check size={12} style={{marginRight: '4px'}} /> Ready</span>;
      case 'Provisioning':
      case 'Deleting':
        return <span className="badge badge-provisioning"><RefreshCcw size={12} className="spin" style={{marginRight: '4px'}} /> {status}</span>;
      case 'Failed':
        return <span className="badge badge-failed"><AlertCircle size={12} style={{marginRight: '4px'}} /> Failed</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString.endsWith('Z') ? dateString : `${dateString}Z`);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const adminUrl = store.engine === 'woocommerce' 
    ? `${store.url}/wp-admin` 
    : `${store.url}/admin`;

  const parseK8sUnit = (value, type) => {
    if (!value) return 0;
    const str = value.toString();
    const num = parseFloat(str);
    
    if (type === 'cpu') {
      if (str.endsWith('m')) return num;
      return num * 1000;
    }
    
    if (type === 'memory') {
      const units = { 'Ki': 1, 'Mi': 1024, 'Gi': 1024 * 1024, 'Ti': 1024 * 1024 * 1024 };
      for (const [unit, multiplier] of Object.entries(units)) {
        if (str.endsWith(unit)) return num * multiplier;
      }
      return num / 1024; // Default to KB for raw numbers if needed, but k8s usually uses units
    }
    return num;
  };

  const cpuPercent = quota ? (parseK8sUnit(quota.cpu_used, 'cpu') / parseK8sUnit(quota.cpu_limit, 'cpu')) * 100 : 0;
  const memPercent = quota ? (parseK8sUnit(quota.memory_used, 'memory') / parseK8sUnit(quota.memory_limit, 'memory')) * 100 : 0;

  return (
    <div className="card" style={{ 
      padding: '24px', 
      position: 'relative', 
      opacity: store.status === 'Deleting' ? 0.6 : 1,
      borderColor: store.status === 'Provisioning' ? 'var(--primary)' : 'var(--border-subtle)',
      background: store.status === 'Provisioning' ? 'rgba(37, 99, 235, 0.02)' : 'var(--bg-card)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{store.name}</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {getStatusBadge(store.status)}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              {store.engine}
            </span>
          </div>
        </div>
        <button 
          onClick={onDelete}
          disabled={store.status === 'Deleting' || store.status === 'Provisioning'}
          className="btn btn-danger" 
          style={{ padding: '8px', borderRadius: '8px', opacity: (store.status === 'Deleting' || store.status === 'Provisioning') ? 0.4 : 1 }}
          title="Delete Store"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {/* Store URL */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ color: 'var(--primary)', marginTop: '2px' }}><Globe size={16} /></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Endpoint</p>
            {store.url ? (
              <a href={store.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {store.url.replace('http://', '')} <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
              </a>
            ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Allocating URL...</span>
            )}
          </div>
        </div>

        {/* Credentials */}
        {store.password && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ color: 'var(--primary)', marginTop: '2px' }}><Lock size={16} /></div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Admin Credentials</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ fontSize: '0.875rem', color: 'var(--text-main)', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {store.password}
                        </code>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(store.password);
                            }}
                            title={copied ? "Copied!" : "Copy Password"}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: copied ? 'var(--success)' : 'var(--text-muted)', 
                                cursor: 'pointer', 
                                padding: '6px', 
                                display: 'flex',
                                borderRadius: '4px',
                                transition: 'all 0.2s',
                                backgroundColor: copied ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                            }}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Admin Link */}
        {store.status === 'Ready' && store.url && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ color: 'var(--success)', marginTop: '2px' }}><ShieldCheck size={16} /></div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Registry</p>
              <a href={adminUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Open Admin Dashboard <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
              </a>
            </div>
          </div>
        )}

        {store.error_message && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', borderRadius: '8px', background: 'var(--danger-light)' }}>
                <AlertCircle size={14} color="var(--danger)" style={{ marginTop: '2px' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--danger)', margin: 0 }}>{store.error_message}</p>
            </div>
        )}

        {/* Resource Quotas */}
        {store.status === 'Ready' && (
            <div style={{ marginTop: '8px' }}>
                <button 
                    onClick={() => setShowQuota(!showQuota)}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--primary)', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                        marginBottom: showQuota ? '12px' : 0
                    }}
                >
                    <Activity size={12} /> {showQuota ? 'Hide' : 'Check'} Resource Capacity
                </button>

                {showQuota && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        {!quota ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <RefreshCcw size={12} className="spin" />
                                <span style={{ fontSize: '0.75rem' }}>Fetching live metrics...</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CPU LIMIT</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{quota.cpu_used} / {quota.cpu_limit}</span>
                                    </div>
                                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            width: `${Math.min(100, cpuPercent)}%`, 
                                            height: '100%', 
                                            background: cpuPercent > 90 ? 'var(--danger)' : 'var(--primary)',
                                            borderRadius: '2px',
                                            transition: 'width 0.5s ease'
                                        }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>MEMORY LIMIT</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{quota.memory_used} / {quota.memory_limit}</span>
                                    </div>
                                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            width: `${Math.min(100, memPercent)}%`, 
                                            height: '100%', 
                                            background: memPercent > 90 ? 'var(--danger)' : '#8b5cf6',
                                            borderRadius: '2px',
                                            transition: 'width 0.5s ease'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={12} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {store.status === 'Ready' ? 'Built' : 'Queued'} on {formatDate(store.created_at)}
        </span>
      </div>
    </div>
  );
};

export default StoreCard;
