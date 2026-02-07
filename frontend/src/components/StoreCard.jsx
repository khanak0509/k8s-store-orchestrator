import React, { useState } from 'react';
import { ExternalLink, Trash2, Clock, Globe, ShieldCheck, AlertCircle, RefreshCcw, Lock, Copy, Check } from 'lucide-react';

const StoreCard = ({ store, onDelete }) => {
  const [copied, setCopied] = useState(false);

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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const adminUrl = store.engine === 'woocommerce' 
    ? `${store.url}/wp-admin` 
    : `${store.url}/admin`;

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
                            onClick={() => copyToClipboard(store.password)}
                            style={{ background: 'none', border: 'none', color: copied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
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
