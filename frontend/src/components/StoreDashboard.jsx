import React, { useState, useEffect } from 'react';
import { Plus, RefreshCcw, Search, Filter } from 'lucide-react';
import StoreCard from './StoreCard';
import CreateStoreModal from './CreateStoreModal';
import { motion, AnimatePresence } from 'framer-motion';

const StoreDashboard = () => {
  const [stores, setStores] = useState([
    {
      id: '1',
      name: 'Alpha Sneakers',
      type: 'WooCommerce',
      status: 'Ready',
      url: 'https://alpha-sneakers.urumi.app',
      adminUrl: 'https://alpha-sneakers.urumi.app/wp-admin',
      createdAt: '2026-02-05T10:00:00Z'
    },
    {
      id: '2',
      name: 'Zen Tech Store',
      type: 'MedusaJS',
      status: 'Provisioning',
      url: 'https://zen-tech.urumi.app',
      adminUrl: 'https://zen-tech.urumi.app/admin',
      createdAt: '2026-02-06T02:30:00Z'
    },
    {
      id: '3',
      name: 'Retro Vinyls',
      type: 'WooCommerce',
      status: 'Failed',
      url: 'https://retro-vinyls.urumi.app',
      adminUrl: '',
      createdAt: '2026-02-05T18:45:00Z'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = (id) => {
    setStores(stores.filter(s => s.id !== id));
  };

  const handleCreate = (newStore) => {
    const store = {
      ...newStore,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Provisioning',
      createdAt: new Date().toISOString(),
      url: `https://${newStore.name.toLowerCase().replace(/\s+/g, '-')}.urumi.app`,
      adminUrl: `https://${newStore.name.toLowerCase().replace(/\s+/g, '-')}.urumi.app/admin`
    };
    setStores([store, ...stores]);
    
    // Simulate provisioning success after 5 seconds
    setTimeout(() => {
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, status: 'Ready' } : s));
    }, 5000);
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Store Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}> Manage and provision your ecommerce infrastructure.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Create New Store
        </button>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 1rem',
          height: '48px',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search stores..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-primary)', 
              paddingLeft: '1rem',
              width: '100%',
              outline: 'none',
              fontSize: '1rem'
            }} 
          />
        </div>
        <button className="btn btn-secondary" style={{ height: '48px' }}>
          <Filter size={18} /> Filter
        </button>
        <button className="btn btn-secondary" style={{ height: '48px' }}>
          <RefreshCcw size={18} />
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
        gap: '1.5rem' 
      }}>
        <AnimatePresence>
          {filteredStores.map(store => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <StoreCard store={store} onDelete={() => handleDelete(store.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <CreateStoreModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreate} 
      />
    </div>
  );
};

export default StoreDashboard;
