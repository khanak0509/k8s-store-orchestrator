import React, { useState } from 'react';
import { X, Server, ShoppingCart, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateStoreModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('WooCommerce');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name, type });
    setName('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-panel" 
          style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}
        >
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create New Store</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Configure and provision a fresh ecommerce engine.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.5rem' }}>Store Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Awesome Shop"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '1rem' }}>Select Engine</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div 
                  onClick={() => setType('WooCommerce')}
                  className="glass-panel"
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderColor: type === 'WooCommerce' ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: type === 'WooCommerce' ? 'rgba(88, 166, 255, 0.05)' : 'none',
                    textAlign: 'center'
                  }}
                >
                  <ShoppingCart size={32} color={type === 'WooCommerce' ? 'var(--accent-primary)' : 'var(--text-secondary)'} style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: '600', color: type === 'WooCommerce' ? 'var(--text-bright)' : 'var(--text-secondary)' }}>WooCommerce</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>WordPress Based</p>
                </div>
                <div 
                  onClick={() => setType('MedusaJS')}
                  className="glass-panel"
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderColor: type === 'MedusaJS' ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: type === 'MedusaJS' ? 'rgba(88, 166, 255, 0.05)' : 'none',
                    textAlign: 'center'
                  }}
                >
                  <Zap size={32} color={type === 'MedusaJS' ? 'var(--accent-primary)' : 'var(--text-secondary)'} style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: '600', color: type === 'MedusaJS' ? 'var(--text-bright)' : 'var(--text-secondary)' }}>MedusaJS</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Headless / Node.js</p>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(88, 166, 255, 0.05)', display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
              <Info size={20} color="var(--accent-primary)" />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                Provisioning will create a dedicated namespace, database, and ingress for this store. Estimated time: ~60s.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                Provision Store
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateStoreModal;
