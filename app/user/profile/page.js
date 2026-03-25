'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { toast } from 'react-toastify';

const learningStyles = [
  { id: 'visual', label: 'Visual', icon: '🎨', desc: 'ASCII diagrams and metaphors' },
  { id: 'analytical', label: 'Analytical', icon: '📐', desc: 'Logic, steps, and structures' },
  { id: 'practical', label: 'Practical', icon: '🛠️', desc: 'Real-world code and examples' },
  { id: 'narrative', label: 'Narrative', icon: '📖', desc: 'Stories and memorable analogies' },
];

const depthPreferences = [
  { id: 'surface', label: 'High-Level', icon: '⛅', desc: 'Quick overviews only' },
  { id: 'intermediate', label: 'Balanced', icon: '⚖️', desc: 'Thorough but concise' },
  { id: 'deep', label: 'Deep Dive', icon: '🌊', desc: 'Mechanism-level detail' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get('/user/profile');
        if (data.user.role === 'admin') {
          router.push('/admin/profile');
          return;
        }
        setData(data.user);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  const handleUpdate = async (fields) => {
    setSaving(true);
    try {
      const data = await api.patch('/user/profile', fields);
      setData(data.user);
      toast.success('Settings saved successfully! ✨');
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('⚠️ Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('⚠️ Are you absolutely sure? This will delete all your chat history and learning progress forever. This cannot be undone!')) {
      return;
    }

    setSaving(true);
    try {
      const data = await api.delete('/user/reset-chats');
      toast.success('✨ History reset successfully. Starting fresh!');
      // Refresh local data
      const profileData = await api.get('/user/profile');
      setData(profileData.user);

      setTimeout(() => {
        // Redirect to dashboard to start fresh
        window.location.href = '/user/dashboard';
      }, 2000);
    } catch (err) {
      console.error('Failed to reset history:', err);
      toast.error('⚠️ Failed to reset history.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex bg-surface-50 min-h-screen">
      <Sidebar user={data} />

      <main className="flex-1 lg:ml-64 pt-24 pb-12 px-4 sm:px-6 lg:px-8 container mx-auto">
        <div className="animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-surface-900 dark:text-white">My Profile</h1>
            <p className="text-surface-500 font-semibold mt-1">
              Personalize your AI teaching experience
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="md:col-span-1 space-y-6">
              <Card padding="lg" className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={data?.avatarUrl}
                    alt={data?.name}
                    className="w-24 h-24 rounded-full bg-surface-100 border-4 border-surface-200 shadow-lg mx-auto object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 border-surface-200 shadow-sm">
                    {data?.level}
                  </div>
                </div>
                <h2 className="text-xl font-black text-surface-900">{data?.name}</h2>
                <p className="text-sm text-surface-400 font-medium mb-4">{data?.email}</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-accent-100 text-accent-700 font-black px-3 py-1 rounded-xl text-xs">
                    ⚡ {data?.au} AU
                  </div>
                  <div className="bg-coral-100 text-coral-700 font-black px-3 py-1 rounded-xl text-xs">
                    🔥 {data?.streak} Day Streak
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="text-sm font-black text-surface-400 uppercase tracking-widest mb-4">Learning Mindset</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-surface-700 mb-1.5">
                      <span>Patience</span>
                      <span className="text-purple-600">{Math.round((data?.mindsetProfile?.patience || 0) * 100)}%</span>
                    </div>
                    <ProgressBar value={(data?.mindsetProfile?.patience || 0) * 100} max={100} height="sm" color="purple" animated={false} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-surface-700 mb-1.5">
                      <span>Confidence</span>
                      <span className="text-brand-600">{Math.round((data?.mindsetProfile?.confidence || 0) * 100)}%</span>
                    </div>
                    <ProgressBar value={(data?.mindsetProfile?.confidence || 0) * 100} max={100} height="sm" color="brand" animated={false} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-surface-700 mb-1.5">
                      <span>Engagement</span>
                      <span className="text-ocean-600">{Math.round((data?.mindsetProfile?.engagementScore || 0) * 100)}%</span>
                    </div>
                    <ProgressBar value={(data?.mindsetProfile?.engagementScore || 0) * 100} max={100} height="sm" color="ocean" animated={false} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="md:col-span-2 space-y-6">
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-surface-900">Learning Style</h3>
                  {saving && <span className="text-xs font-bold text-brand-500 animate-pulse">Saving...</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {learningStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleUpdate({ learningStyle: style.id })}
                      className={`p-4 rounded-xl border-2 text-left transition-all group ${data?.mindsetProfile?.learningStyle === style.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-surface-200 bg-surface-100 text-surface-600 hover:border-surface-300'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl group-hover:scale-110 transition-transform">{style.icon}</span>
                        <p className="font-black text-surface-800 uppercase text-xs tracking-wider">{style.label}</p>
                      </div>
                      <p className="text-xs text-surface-500 font-medium">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="text-xl font-black text-surface-900 mb-6">Explanation Depth</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {depthPreferences.map((pref) => (
                    <button
                      key={pref.id}
                      onClick={() => handleUpdate({ depthPreference: pref.id })}
                      className={`text-center p-4 rounded-xl border-2 transition-all ${data?.mindsetProfile?.depthPreference === pref.id
                        ? 'bg-ocean-50 border-ocean-500 shadow-sm text-ocean-700'
                        : 'bg-surface-100 border-surface-200 hover:border-ocean-200 text-surface-600'
                        }`}
                    >
                      <span className="text-2xl block mb-2">{pref.icon}</span>
                      <p className="font-black text-surface-800 text-xs mb-1 uppercase tracking-wider">{pref.label}</p>
                      <p className="text-[10px] text-surface-400 font-bold leading-tight">{pref.desc}</p>
                    </button>
                  ))}
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="text-xl font-black text-surface-900 mb-6">Account Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-surface-400 uppercase tracking-widest mb-2 px-1">Display Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={data?.name}
                        onBlur={(e) => {
                          if (e.target.value !== data?.name) handleUpdate({ name: e.target.value });
                        }}
                        className="flex-1 px-4 py-3 bg-surface-50 border-2 border-surface-200 rounded-xl focus:border-brand-500 focus:outline-none transition-all font-bold text-surface-800 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </Card>


              <Card padding="lg" className="border-coral-500/20 bg-coral-500/5">
                <h3 className="text-xl font-black text-coral-500 mb-2 flex items-center gap-2">
                  <span>⚠️</span> Danger Zone
                </h3>
                <p className="text-xs text-coral-400 font-bold mb-6">
                  Irreversible actions. Be very careful!
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-50 border border-coral-500/10 flex items-center justify-between gap-4 shadow-sm">
                    <div>
                      <p className="text-sm font-black text-surface-900">Reset Chat History</p>
                      <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">Wipe all sessions and learning progress</p>
                    </div>
                    <button
                      onClick={handleReset}
                      disabled={saving}
                      className="px-5 py-2.5 bg-coral-500 text-white rounded-xl text-xs font-black hover:bg-coral-600 transition-all shadow-lg shadow-coral-500/20 active:scale-95 disabled:opacity-50"
                    >
                      Reset All
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
