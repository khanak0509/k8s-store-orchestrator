import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCcw, Search } from 'lucide-react';
import StoreCard from './StoreCard';
import CreateStoreModal from './CreateStoreModal';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';

const StoreDashboard = () => {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStores = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stores`);
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a, b) => b.id - a.id);
        setStores(sortedData);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    const hasTransitionalStore = stores.some(s => 
      s.status === 'Provisioning' || s.status === 'Deleting'
    );

    if (hasTransitionalStore) {
      const interval = setInterval(fetchStores, 3000);
      return () => clearInterval(interval);
    }
  }, [stores, fetchStores]);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setStores(prev => prev.map(s => s.id === id ? { ...s, status: 'Deleting' } : s));
      }
    } catch (error) {
      console.error('Failed to delete store:', error);
    }
  };

  const handleCreate = async (newStore) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStore.name,
          engine: newStore.type.toLowerCase()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Creation failed');
      }

      const created = await response.json();
      // Refetch immediately to ensure consistent sorting and state from server
      await fetchStores();
    } catch (err) {
      throw err;
    }
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '4px' }}>Stores</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage and monitor your stores.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 12px 10px 40px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.875rem',
                width: '240px',
                outline: 'none'
              }}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Create Store
          </button>
        </div>
      </div>
 
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
           <RefreshCcw className="spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 40px', backgroundColor: 'transparent', borderStyle: 'dashed' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No stores found</h3>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary">
            Create your first store
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
          gap: '24px' 
        }}>
          <AnimatePresence mode='popLayout'>
            {filteredStores.map(store => (
              <motion.div
                key={store.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <StoreCard 
                  store={store} 
                  onDelete={() => handleDelete(store.id)} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreateStoreModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default StoreDashboard;
