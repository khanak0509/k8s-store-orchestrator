import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingCart, Zap, Info, RefreshCcw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateStoreModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('WooCommerce');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onCreate({ name, type });
      setName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Deployment failed. Please check cluster health.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ 
            width: '100%', 
            maxWidth: '460px', 
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '32px',
            position: 'relative'
          }}
        >
          <button 
            disabled={isSubmitting}
            onClick={onClose}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex' }}
          >
            <X size={20} />
          </button>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Create Store</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Dedicated ecommerce engine configuration.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Store Identifier</label>
              <input 
                disabled={isSubmitting}
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. flagship-store"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.7 : 1
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = 'var(--text-main)';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 2px rgba(15, 23, 42, 0.1)';
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-subtle)';
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Lowercase, alphanumeric, and hyphens only.</p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '12px' }}>Engine Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div 
                  onClick={() => !isSubmitting && setType('WooCommerce')}
                  style={{
                    padding: '12px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: type === 'WooCommerce' ? 'var(--text-main)' : 'var(--border-subtle)',
                    backgroundColor: type === 'WooCommerce' ? '#f8fafc' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <ShoppingCart size={20} color={type === 'WooCommerce' ? 'var(--text-main)' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: type === 'WooCommerce' ? 'var(--text-main)' : 'var(--text-muted)' }}>WooCommerce</span>
                </div>
                <div 
                  onClick={() => !isSubmitting && setType('MedusaJS')}
                  style={{
                    padding: '12px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: type === 'MedusaJS' ? 'var(--text-main)' : 'var(--border-subtle)',
                    backgroundColor: type === 'MedusaJS' ? '#f8fafc' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Zap size={20} color={type === 'MedusaJS' ? 'var(--text-main)' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: type === 'MedusaJS' ? 'var(--text-main)' : 'var(--text-muted)' }}>MedusaJS</span>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'var(--danger-light)', borderRadius: '8px', marginBottom: '24px' }}>
                <AlertCircle size={18} color="var(--danger)" />
                <p style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {!error && (
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', display: 'flex', gap: '10px', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
                <Info size={18} color="var(--primary)" />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  This will create an isolated K8s namespace with dedicated resource quotas and ingress.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button disabled={isSubmitting} type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button disabled={isSubmitting} type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                {isSubmitting ? <><RefreshCcw size={16} className="spin" /> Deploying...</> : 'Deploy Engine'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default CreateStoreModal;
