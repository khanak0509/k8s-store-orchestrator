import React from 'react';
import { ExternalLink, Trash2, Clock, Globe, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const StoreCard = ({ store, onDelete }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ready':
        return <span className="badge badge-ready"><ShieldCheck size={12} style={{marginRight: '4px'}} /> Ready</span>;
      case 'Provisioning':
        return <span className="badge badge-provisioning"><Loader2 size={12} className="animate-spin" style={{marginRight: '4px'}} /> Provisioning</span>;
      case 'Failed':
        return <span className="badge badge-failed"><AlertCircle size={12} style={{marginRight: '4px'}} /> Failed</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{store.name}</h3>
            {getStatusBadge(store.status)}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {store.type} Engine
          </span>
        </div>
        <button 
          onClick={onDelete}
          className="btn btn-danger" 
          style={{ padding: '0.5rem', borderRadius: '6px' }}
          title="Delete Store"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>
            <Globe size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Store URL</p>
            <a 
              href={store.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {store.url} <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {store.adminUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ color: 'var(--accent-secondary)', opacity: 0.8 }}>
              <ShieldCheck size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Admin Dashboard</p>
              <a 
                href={store.adminUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Access Admin <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <Clock size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Provisioned on {formatDate(store.createdAt)}
          </span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 2s linear infinite;
        }
      `}} />
    </div>
  );
};

export default StoreCard;
