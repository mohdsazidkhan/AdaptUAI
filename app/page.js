import Link from 'next/link';
import { Brain, Zap, MessageCircle, TrendingUp, Target, ShieldCheck, Mic, Camera, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'AdaptUAI — Your Personalized AI Tutor',
  description: 'Learn anything with an AI tutor that adapts to your mindset, learning style, and pace.',
};

const features = [
  { icon: Brain, title: 'Mindset-aware AI', desc: 'The more you learn, the better it understands how you learn, and adapts its tone, depth and style to match.' },
  { icon: Zap, title: 'Gamified learning', desc: 'Earn AU, level up and keep your streak going. Learning feels rewarding, not like a chore.' },
  { icon: MessageCircle, title: 'Streaming answers', desc: 'Answers appear as they are written, so you never wait. It feels like chatting with a real tutor.' },
  { icon: TrendingUp, title: 'Progress tracking', desc: 'See your strong topics, weak areas and learning progress on your dashboard.' },
  { icon: Target, title: 'Personalised depth', desc: 'From a quick overview to a deep dive, answers match the level of detail you prefer.' },
  { icon: ShieldCheck, title: 'Secure and private', desc: 'Your chats stay private to your account and are never sold.' },
];

const stats = [
  { value: '10K+', label: 'Topics covered' },
  { value: '50+', label: 'Learning styles' },
  { value: '∞', label: 'Questions answered' },
  { value: '5⭐', label: 'Learner rating' },
];

const steps = [
  { title: 'Sign up', desc: 'Create your free account in 30 seconds. No credit card needed.' },
  { title: 'Ask anything', desc: 'Type, speak or send a photo of your question to the AI tutor.' },
  { title: 'AI adapts to you', desc: 'The more you chat, the more personal your tutor becomes.' },
];

// Big headings: last word in the brand colour.
function AccentLast({ children }) {
  const words = String(children).trim().split(' ');
  const last = words.pop();
  return <>{words.join(' ')} <span className="text-brand-500">{last}</span></>;
}

const card = 'fb-card p-4 xl:p-6';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-page flex-1 space-y-3 lg:space-y-4 p-3 pt-[calc(var(--navbar-h)+0.75rem)] lg:p-4 lg:pt-[calc(var(--navbar-h)+1rem)]">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className={`${card} grid items-center gap-3 lg:gap-4 lg:grid-cols-2`}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-3 py-1 text-sm font-semibold text-brand-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
              AI-powered personalised learning
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-surface-900 sm:text-4xl lg:text-5xl">
              Learn anything with an AI tutor that adapts to <span className="text-brand-500">you</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-surface-500 sm:text-lg">
              AdaptUAI understands <strong className="font-semibold text-surface-900">how you think</strong>, matches your learning style
              and gets smarter the more you use it. Ask by typing, by voice or with a photo. 🦉
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/auth/signup" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 font-semibold text-white transition hover:brightness-110">
                Start learning free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/auth/login" className="inline-flex h-11 items-center justify-center rounded-lg bg-surface-100 px-5 font-semibold text-surface-900 transition-colors hover:bg-surface-200">
                Log in
              </Link>
            </div>
            <p className="mt-3 text-sm text-surface-500">No credit card required · Free to start</p>
          </div>

          {/* Chat preview */}
          <div className="overflow-hidden rounded-lg border border-surface-200 bg-background">
            <div className="flex items-center gap-2 border-b border-surface-200 bg-surface-50 px-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500">🦉</span>
              <div>
                <p className="text-sm font-semibold text-surface-900">AdaptUAI Tutor</p>
                <p className="text-xs text-brand-600">Ready to teach</p>
              </div>
            </div>
            <div className="space-y-3 p-3 sm:p-4">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-500 px-3.5 py-2 text-sm text-white">
                  How does the JavaScript event loop work? 🤔
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm">🦉</span>
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-50 px-3.5 py-2 text-sm text-surface-900 shadow-card">
                  Great question! 🌟 The event loop lets JavaScript stay <strong>non-blocking</strong> on a single thread. Think of
                  a chef taking new orders while food is still cooking. Here&apos;s how it works, step by step…
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-surface-50 p-1.5 pl-2 shadow-card">
                <Camera className="h-5 w-5 text-surface-500" />
                <span className="flex-1 truncate text-sm text-surface-400">Ask anything…</span>
                <Mic className="h-5 w-5 text-surface-500" />
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white"><ArrowRight className="h-4 w-4" /></span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section className={`${card} grid grid-cols-2 gap-4 md:grid-cols-4`}>
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-brand-500 sm:text-3xl">{s.value}</div>
              <div className="text-sm text-surface-500">{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── Features ───────────────────────────────────────────────────── */}
        <section className={card}>
          <h2 className="text-2xl font-bold text-surface-900 sm:text-3xl"><AccentLast>Why AdaptUAI is different</AccentLast></h2>
          <p className="mt-1 text-surface-500">We don&apos;t just answer questions. We understand how you learn.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 rounded-lg border border-surface-200 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-surface-900">{title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-surface-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <section className={card}>
          <h2 className="text-2xl font-bold text-surface-900 sm:text-3xl"><AccentLast>How it works</AccentLast></h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="flex gap-3 rounded-lg bg-surface-100 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-bold text-white">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-surface-900">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-surface-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className={`${card} flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left`}>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 text-3xl">🦉</span>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-surface-900 sm:text-2xl"><AccentLast>Ready to learn smarter?</AccentLast></h2>
            <p className="text-surface-500">Join learners who use AdaptUAI every day.</p>
          </div>
          <Link href="/auth/signup" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 font-semibold text-white transition hover:brightness-110">
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
      <Footer />
    </div>
  );
}
