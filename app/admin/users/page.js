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
    <div className="p-4 lg:p-8 container mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-black text-surface-900 dark:text-white">User Management</h1>
          <p className="text-surface-500 font-bold mt-2">Manage all registered users and their balances</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-surface-100 hover:bg-surface-200 rounded-lg text-sm font-bold transition-all border border-surface-200"
        >
          🔄 Refresh List
        </button>
      </header>

      <div className="w-full">
        {/* Desktop User Table */}
        <Card padding="none" className="hidden md:block overflow-hidden border-surface-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-50 dark:bg-surface-100/50 border-b border-surface-200 dark:border-surface-800">
                <tr>
                  <th className="px-0 lg:px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">User</th>
                  <th className="px-0 lg:px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest text-left">Email</th>
                  <th className="px-0 lg:px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest text-center">AU Balance</th>
                  <th className="px-0 lg:px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className={`hover:bg-brand-50/10 dark:hover:bg-brand-900/10 transition-colors cursor-pointer ${selectedUser?._id === user._id ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-0 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-100/10" alt="" />
                        <div className="min-w-0">
                          <p className="font-black text-surface-900 dark:text-white truncate leading-none mb-1 text-sm">{user.name}</p>
                          <p className="text-[9px] font-black text-brand-600 dark:text-brand-500 uppercase tracking-widest antialiased">Student</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-0 lg:px-6 py-4">
                      <p className="text-xs font-bold text-surface-500 dark:text-surface-400 truncate text-left">{user.email}</p>
                    </td>
                    <td className="px-0 lg:px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          defaultValue={user.au}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => handleUpdateAU(user._id, parseInt(e.target.value))}
                          className="w-20 px-2 py-1 bg-surface-100 dark:bg-surface-100/10 border-2 border-surface-200 dark:border-surface-100/20 rounded-xl text-sm font-black text-surface-900 dark:text-white text-center focus:border-brand-500 focus:outline-none transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-0 lg:px-6 py-4 text-right space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                        className="text-[10px] font-black uppercase text-brand-600 dark:text-brand-400 hover:underline"
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

        {/* Mobile User List Grid */}
        <div className="md:hidden flex flex-col gap-4">
          {users.map((user) => (
            <Card key={user._id} padding="md" className="border-surface-200 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-brand-300 transition-colors" onClick={() => setSelectedUser(user)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={user.avatarUrl} className="w-12 h-12 rounded-2xl border-2 border-surface-200 dark:border-surface-100/10 shadow-sm" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-500 text-white rounded-lg flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-surface-50">
                      {user.level}
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-surface-900 dark:text-white text-base leading-tight">{user.name}</p>
                    <p className="text-[10px] font-bold text-surface-500 dark:text-surface-400 mt-0.5 truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <input
                      type="number"
                      defaultValue={user.au}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => handleUpdateAU(user._id, parseInt(e.target.value))}
                      className="w-16 px-1.5 py-1 bg-surface-100 dark:bg-surface-100/10 border border-surface-200 dark:border-surface-100/20 rounded-lg text-xs font-black text-brand-600 dark:text-brand-400 text-center focus:border-brand-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-surface-100 dark:border-surface-100/10">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                  className="flex-1 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-100/10 dark:hover:bg-surface-100/20 text-green-400 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  View Profile
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteUser(user._id); }}
                  className="px-4 py-2 bg-coral-50 hover:bg-coral-100 dark:bg-coral-900/10 dark:hover:bg-coral-900/20 text-coral-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* User Detail Fullscreen Modal */}
      <div className={`fixed inset-0 z-50 transition-all duration-500 ${selectedUser ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div
          className="absolute inset-0 bg-surface-900/60 backdrop-blur-md"
          onClick={() => setSelectedUser(null)}
        />
        <div className={`absolute inset-0 bg-white dark:bg-surface-50 transition-transform duration-500 ease-out overflow-y-auto ${selectedUser ? 'translate-y-0' : 'translate-y-full'}`}>
          {selectedUser && (
            <div className="p-8 md:p-12 container mx-auto">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-xl lg:text-3xl font-black text-surface-900 dark:text-white">Student Overview</h2>
                  <p className="text-surface-500 font-bold mt-1">Deep dive into learning mindset and system metrics</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-10 h-10 flex items-center justify-center bg-surface-100 dark:bg-surface-100/20 hover:bg-coral-100/20 dark:hover:bg-coral-900/40 rounded-full transition-all text-coral-500 dark:text-coral-500 antialiased font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1 text-center">
                  <div className="relative inline-block mb-6">
                    <img src={selectedUser.avatarUrl} className="w-32 h-32 rounded-[2.5rem] border-4 border-surface-100 dark:border-surface-100/10 shadow-2xl mx-auto" alt="" />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-500 text-white rounded-2xl flex items-center justify-center text-sm font-black border-4 border-white dark:border-surface-50 shadow-lg">
                      {selectedUser.level}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-surface-900 dark:text-white leading-tight mb-1">{selectedUser.name}</h3>
                  <p className="text-sm text-surface-400 font-bold mb-8 uppercase tracking-widest">{selectedUser.email}</p>

                  <div className="flex flex-col gap-3">
                    <div className="p-4 bg-brand-50 dark:bg-brand-900/10 rounded-2xl border border-brand-100 dark:border-brand-500/10 flex justify-between items-center">
                      <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Experience</span>
                      <span className="text-sm font-black text-brand-700 dark:text-brand-300">Level {selectedUser.level}</span>
                    </div>
                    <div className="p-4 bg-accent-50 dark:bg-accent-900/10 rounded-2xl border border-accent-100 dark:border-accent-500/10 flex justify-between items-center">
                      <span className="text-[10px] font-black text-accent-600 dark:text-accent-400 uppercase tracking-widest">Balance</span>
                      <span className="text-sm font-black text-accent-700 dark:text-accent-300">{selectedUser.au} AU</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-10">
                  <div>
                    <h4 className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-4 border-b border-surface-100 dark:border-surface-100/10 pb-2">Mindset Profile</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-surface-50 dark:bg-surface-100/10 rounded-2xl border border-surface-100 dark:border-surface-100/20">
                        <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest mb-1">Learning Style</p>
                        <p className="text-base font-black text-surface-900 dark:text-white capitalize">{selectedUser.mindsetProfile?.learningStyle || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-surface-50 dark:bg-surface-100/10 rounded-2xl border border-surface-100 dark:border-surface-100/20">
                        <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest mb-1">Depth Preference</p>
                        <p className="text-base font-black text-surface-900 dark:text-white capitalize">{selectedUser.mindsetProfile?.depthPreference || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-surface-50 dark:bg-surface-100/10 rounded-2xl border border-surface-100 dark:border-surface-100/20">
                        <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest mb-1">Patience</p>
                        <p className="text-base font-black text-surface-900 dark:text-white ">{Math.round((selectedUser.mindsetProfile?.patience || 0) * 100)}%</p>
                      </div>
                      <div className="p-4 bg-surface-50 dark:bg-surface-100/10 rounded-2xl border border-surface-100 dark:border-surface-100/20">
                        <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest mb-1">Confidence</p>
                        <p className="text-base font-black text-surface-900 dark:text-white">{Math.round((selectedUser.mindsetProfile?.confidence || 0) * 100)}%</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-4 border-b border-surface-100 dark:border-surface-100/10 pb-2">Topics Explored</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.topicsExplored?.length > 0 ? (
                        selectedUser.topicsExplored.map(t => (
                          <span key={t} className="px-3 py-1.5 bg-surface-100 dark:bg-surface-100/20 text-surface-700 dark:text-surface-300 text-xs font-bold rounded-xl border border-surface-200 dark:border-surface-100/10 transition-colors hover:bg-brand-50 hover:text-brand-600">
                            {t}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-surface-400 font-medium italic">No research activity recorded yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-surface-100 dark:border-surface-100/10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500">
                      Member since {new Date(selectedUser.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
