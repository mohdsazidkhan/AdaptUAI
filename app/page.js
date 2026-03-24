import Link from 'next/link';

export const metadata = {
  title: 'AdaptUAI — Your Personalized AI Tutor',
  description: 'Learn anything with an AI tutor that adapts to your mindset, learning style, and pace.',
};

const features = [
  {
    icon: '🧠',
    title: 'Mindset-Aware AI',
    desc: 'The more you learn, the smarter it gets about how YOU learn — adapting tone, depth, and style to match you.',
    color: 'purple',
    iconBg: 'bg-purple-100/80',
  },
  {
    icon: '⚡',
    title: 'Gamified Learning',
    desc: 'Earn XP, level up, maintain streaks. Learning should feel like a game — rewarding, fun, and addictive.',
    color: 'accent',
    iconBg: 'bg-accent-100/80',
  },
  {
    icon: '💬',
    title: 'Streaming AI Responses',
    desc: "Real-time streaming responses mean you never wait. It's like chatting with the world's smartest tutor.",
    color: 'ocean',
    iconBg: 'bg-ocean-100/80',
  },
  {
    icon: '📈',
    title: 'Progress Tracking',
    desc: 'Track your weak areas, strong topics, and learning progress with beautiful analytics on your dashboard.',
    color: 'brand',
    iconBg: 'bg-brand-100/80',
  },
  {
    icon: '🎯',
    title: 'Personalized Depth',
    desc: 'From quick overviews to deep dives — the AI matches the complexity of its answers to your preference.',
    color: 'coral',
    iconBg: 'bg-coral-100/80',
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    desc: 'Your conversations are private and protected. JWT authentication keeps your account secure.',
    color: 'surface',
    iconBg: 'bg-surface-100/80',
  },
];

const stats = [
  { value: '10K+', label: 'Topics Covered' },
  { value: '50+', label: 'Learning Styles' },
  { value: '∞', label: 'Questions Answered' },
  { value: '5⭐', label: 'Learner Rating' },
];

export default function LandingPage() {
  return (
    <div className="bg-hero min-h-screen text-surface-900 transition-colors duration-500">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
        <div className="text-center container mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 border border-brand-200 rounded-full px-4 py-1.5 text-sm font-bold mb-6">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            AI-Powered Personalized Learning
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-surface-900 leading-tight mb-4 text-balance">
            Learn anything with
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-ocean-500 to-purple-500 mt-1">
              AdaptUAI
            </span>
          </h1>

          <p className="text-2xl font-black text-brand-600 mb-8 uppercase tracking-[0.2em] animate-fade-in delay-200">
            AI that adapts to you
          </p>

          <p className="text-xl text-surface-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            AdaptUAI is the only tutor that analyzes{' '}
            <strong className="text-surface-800">how you think</strong>, adapts to your learning style,
            and gets <em>smarter</em> the more you use it. 🦉
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-lg rounded-xl shadow-button border-b-4 border-brand-700 hover:border-brand-700 active:translate-y-[2px] active:shadow-button-press transition-all"
            >
              🚀 Start Learning Free
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-surface-50 hover:bg-surface-100 text-surface-700 font-bold text-lg rounded-xl border-2 border-surface-200 hover:border-surface-300 transition-all shadow-sm"
            >
              Log in →
            </Link>
          </div>

          <p className="text-sm text-surface-400 mt-4 font-medium">
            No credit card required · Free to start
          </p>
        </div>

        {/* Hero illustration */}
        <div className="mt-16 max-w-3xl mx-auto animate-float">
          <div className="bg-surface-50 rounded-3xl shadow-2xl border border-surface-200 overflow-hidden">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-surface-100 border-b border-surface-200">
              <div className="w-3 h-3 rounded-full bg-coral-400" />
              <div className="w-3 h-3 rounded-full bg-accent-400" />
              <div className="w-3 h-3 rounded-full bg-brand-400" />
              <div className="ml-4 flex-1 bg-surface-200 rounded-full h-5 max-w-xs" />
            </div>
            {/* Chat preview */}
            <div className="p-6 space-y-4">
              <div className="flex items-end gap-2 justify-end">
                <div className="bg-brand-500 text-white px-4 py-2.5 rounded-3xl rounded-br-sm text-sm font-medium max-w-xs">
                  How does the JavaScript event loop work? 🤔
                </div>
                <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  ME
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  🦉
                </div>
                <div className="bg-surface-100 px-4 py-2.5 rounded-3xl rounded-bl-sm text-sm text-surface-800 max-w-sm">
                  Great question! 🌟 The event loop is what allows JavaScript to be{' '}
                  <strong>non-blocking</strong> even though it runs on a single thread. Think of it
                  like a restaurant — the chef (JS engine) can take orders while food is still
                  cooking! Here&apos;s how it works step by step...
                </div>
              </div>
              <div className="flex items-center gap-1 ml-9">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-surface-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-surface-200 bg-surface-50/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-black text-brand-600 mb-1">{s.value}</div>
              <div className="text-sm font-semibold text-surface-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-surface-900 mb-4">
            Why AdaptUAI is different
          </h2>
          <p className="text-lg text-surface-500 max-w-xl mx-auto">
            We don&apos;t just answer questions — we understand <em>how</em> you learn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const colorMap = {
              purple: 'from-purple-50 to-white border-purple-100 dark:from-purple-900/20 dark:to-surface-50/50 dark:border-purple-500/20',
              accent: 'from-accent-50 to-white border-accent-100 dark:from-accent-900/20 dark:to-surface-50/50 dark:border-accent-500/20',
              ocean: 'from-ocean-50 to-white border-ocean-100 dark:from-ocean-900/20 dark:to-surface-50/50 dark:border-ocean-500/20',
              brand: 'from-brand-50 to-white border-brand-100 dark:from-brand-900/20 dark:to-surface-50/50 dark:border-brand-500/20',
              coral: 'from-coral-50 to-white border-coral-100 dark:from-coral-900/20 dark:to-surface-50/50 dark:border-coral-500/20',
              surface: 'from-surface-50 to-white border-surface-100 dark:from-surface-100/20 dark:to-surface-50/50 dark:border-surface-200/20',
            };

            return (
              <div
                key={f.title}
                className={`p-6 rounded-3xl border bg-gradient-to-br ${colorMap[f.color]} hover:-translate-y-1 hover:shadow-card-hover transition-all duration-200 group`}
              >
                <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-black text-surface-900 mb-2">{f.title}</h3>
                <p className="text-sm text-surface-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-100/80 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-surface-900 mb-4">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '✍️', title: 'Sign up', desc: 'Create your free account in 30 seconds. No credit card needed.' },
              { step: '2', icon: '💬', title: 'Ask anything', desc: 'Chat with your AI tutor. Ask questions, explore topics, get explanations.' },
              { step: '3', icon: '🎯', title: 'AI adapts to you', desc: 'The more you chat, the more personalized the AI becomes to your exact learning style.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-brand-500 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-glow">
                  {item.step}
                </div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-black text-surface-900 mb-2">{item.title}</h3>
                <p className="text-surface-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-6 animate-float inline-block">🦉</div>
          <h1 className="text-6xl sm:text-7xl font-black leading-[1.1] mb-6 tracking-tight animate-slide-up">
            <span className="text-surface-900">AdaptU</span><span className="text-brand-500">AI</span>
          </h1>
          <p className="text-2xl font-bold text-brand-600 mb-8 uppercase tracking-[0.2em] animate-fade-in delay-200">
            AI that adapts to you
          </p>
          <p className="text-lg text-surface-500 mb-8">
            Join thousands of learners who use AdaptUAI every day.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-10 py-5 bg-brand-500 hover:bg-brand-600 text-white font-black text-xl rounded-3xl shadow-button border-b-4 border-brand-700 hover:translate-y-[1px] hover:shadow-button-press transition-all"
          >
            🚀 Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-surface-200 text-center text-sm text-surface-400 font-medium">
        © {new Date().getFullYear()} AdaptUAI · Built with 🦉 and AI
      </footer>
    </div>
  );
}
