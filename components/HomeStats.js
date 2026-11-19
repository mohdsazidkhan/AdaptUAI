'use client';

import { useEffect, useState } from 'react';

const initialStats = [
  { label: 'Questions asked', value: '—' },
  { label: 'Users', value: '—' },
  { label: 'Topics covered', value: '—' },
  { label: 'Tokens used', value: '—' },
];

const formatCount = (value) => Number(value || 0).toLocaleString();

export default function HomeStats() {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    let active = true;
    fetch('/api/public/stats', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Stats request failed');
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setStats([
          { label: 'Questions asked', value: formatCount(data.questionsAsked) },
          { label: 'Users', value: formatCount(data.users) },
          { label: 'Topics covered', value: formatCount(data.topicsCovered) },
          { label: 'Tokens used', value: formatCount(data.tokensUsed) },
        ]);
      })
      .catch((error) => console.error('Failed to load home stats:', error));
    return () => { active = false; };
  }, []);

  return (
    <section className="fb-card grid grid-cols-2 gap-4 p-4 md:grid-cols-4 xl:p-6" aria-label="AdaptUAI usage statistics">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="text-2xl font-bold text-brand-500 sm:text-3xl">{stat.value}</div>
          <div className="text-sm text-surface-500">{stat.note || stat.label}</div>
        </div>
      ))}
    </section>
  );
}
