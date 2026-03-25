'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { toast } from 'react-toastify';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.users);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateAU = async (userId, newAU) => {
    try {
      await api.patch('/admin/users', { userId, au: newAU });
      setUsers(users.map(u => u._id === userId ? { ...u, au: newAU } : u));
      toast.success('User AU updated!');
    } catch (err) {
      toast.error('Failed to update AU');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is IRREVERSIBLE.')) return;
    try {
      await api.delete('/admin/users', { data: { userId } });
      setUsers(users.filter(u => u._id !== userId));
      if (selectedUser?._id === userId) setSelectedUser(null);
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-surface-900 dark:text-white">User Management</h1>
          <p className="text-surface-500 font-bold mt-2">Manage all registered users and their balances</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="px-4 py-2 bg-surface-100 hover:bg-surface-200 rounded-lg text-sm font-bold transition-all border border-surface-200"
        >
          🔄 Refresh List
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Table */}
        <div className={selectedUser ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card padding="none" className="overflow-hidden border-surface-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-50 dark:bg-surface-100/50 border-b border-surface-200 dark:border-surface-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest text-center">AU Balance</th>
                    <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {users.map((user) => (
                    <tr 
                      key={user._id} 
                      className={`hover:bg-brand-50/30 transition-colors cursor-pointer ${selectedUser?._id === user._id ? 'bg-brand-50' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-surface-200" alt="" />
                          <div className="min-w-0">
                            <p className="font-bold text-surface-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-[10px] font-black text-surface-400 uppercase tracking-tight">{user.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            type="number" 
                            defaultValue={user.au}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => handleUpdateAU(user._id, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded text-sm font-bold dark:text-white text-center"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                          className="text-[10px] font-black uppercase text-brand-600 hover:underline"
                        >
                          Details
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteUser(user._id); }}
                          className="text-[10px] font-black uppercase text-coral-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* User Detail Panel */}
        {selectedUser && (
          <div className="lg:col-span-1 animate-fade-in-right">
            <Card padding="lg" className="sticky top-24 border-brand-200 shadow-glow-sm">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-black text-surface-900">User Detail</h2>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="text-surface-400 hover:text-surface-600"
                >
                  ✕
                </button>
              </div>

              <div className="text-center mb-8">
                <img src={selectedUser.avatarUrl} className="w-20 h-20 rounded-full border-4 border-surface-100 shadow-md mx-auto mb-3" alt="" />
                <h3 className="text-lg font-black text-surface-900 leading-tight">{selectedUser.name}</h3>
                <p className="text-sm text-surface-400 font-bold mb-4">{selectedUser.email}</p>
                <div className="flex flex-wrap justify-center gap-2">
                   <span className="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-black rounded-full border border-brand-100 uppercase tracking-widest">
                    Level {selectedUser.level}
                   </span>
                   <span className="px-3 py-1 bg-accent-50 text-accent-600 text-[10px] font-black rounded-full border border-accent-100 uppercase tracking-widest">
                    {selectedUser.au} AU
                   </span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3 border-b border-surface-100 pb-1">Mindset Profile</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-surface-50 rounded-xl">
                      <p className="text-[10px] text-surface-400 font-bold uppercase">Learning</p>
                      <p className="text-sm font-black text-surface-800 capitalize">{selectedUser.mindsetProfile?.learningStyle || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-surface-50 rounded-xl">
                      <p className="text-[10px] text-surface-400 font-bold uppercase">Depth</p>
                      <p className="text-sm font-black text-surface-800 capitalize">{selectedUser.mindsetProfile?.depthPreference || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-surface-50 rounded-xl">
                      <p className="text-[10px] text-surface-400 font-bold uppercase">Patience</p>
                      <p className="text-sm font-black text-surface-800">{Math.round((selectedUser.mindsetProfile?.patience || 0) * 100)}%</p>
                    </div>
                    <div className="p-3 bg-surface-50 rounded-xl">
                      <p className="text-[10px] text-surface-400 font-bold uppercase">Confidence</p>
                      <p className="text-sm font-black text-surface-800">{Math.round((selectedUser.mindsetProfile?.confidence || 0) * 100)}%</p>
                    </div>
                  </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3 border-b border-surface-100 pb-1">Topics Explored</h4>
                   <div className="flex flex-wrap gap-2">
                     {selectedUser.topicsExplored?.length > 0 ? (
                       selectedUser.topicsExplored.map(t => (
                         <span key={t} className="px-2 py-1 bg-surface-100 text-surface-600 text-[10px] font-bold rounded border border-surface-200 italic">{t}</span>
                       ))
                     ) : (
                       <p className="text-xs text-surface-400 italic">No topics explored yet.</p>
                     )}
                   </div>
                </div>

                <div className="pt-4">
                   <p className="text-[10px] text-surface-400 font-bold text-center">
                    Joined on {new Date(selectedUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                   </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
