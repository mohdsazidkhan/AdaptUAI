'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { toast } from 'react-toastify';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.users);
      } catch (err) {
        console.error('Failed to fetch admin users:', err);
      } finally {
        setLoading(false);
      }
    }
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

  if (loading) return <PageLoader />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-surface-900">User Management</h1>
        <p className="text-surface-500 font-bold mt-2">Manage all registered users and their balances</p>
      </header>

      <Card padding="none" className="overflow-hidden border-surface-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">AU Balance</th>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">Level</th>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-surface-200" alt="" />
                      <div>
                        <p className="font-bold text-surface-900">{user.name}</p>
                        <p className="text-xs text-surface-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        defaultValue={user.au}
                        onBlur={(e) => handleUpdateAU(user._id, parseInt(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-surface-200 rounded text-sm font-bold"
                      />
                      <span className="text-[10px] font-black text-surface-400">AU</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-[10px] font-black border border-brand-100 uppercase">
                      Level {user.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs font-black text-coral-500 hover:text-coral-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
