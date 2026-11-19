import { Mail, MessageCircle, Clock, Headset, Rocket, ShieldCheck, GraduationCap } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with the AdaptUAI team for help with your account, AU recharge, feedback or partnerships.',
};

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@mohdsazidkhan.com';
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_CONTACT || '';

const features = [
  { icon: Rocket, title: 'Fast reply', desc: 'We reply within 24 hours on working days.' },
  { icon: ShieldCheck, title: 'Always available', desc: 'Write to us any time. We are here to help.' },
  { icon: GraduationCap, title: 'Helpful team', desc: 'We know AdaptUAI well and can sort out your problem quickly.' },
];

export default function ContactPage() {
  const details = [
    { icon: Mail, label: 'Email support', value: EMAIL, href: `mailto:${EMAIL}` },
    WHATSAPP && { icon: MessageCircle, label: 'WhatsApp', value: WHATSAPP, href: `https://wa.me/${WHATSAPP.replace(/\D/g, '')}` },
    { icon: Clock, label: 'Working hours', value: '24/7 · replies within 24 hours' },
  ].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-page flex-1 space-y-3 p-3 pt-[calc(var(--navbar-h)+0.75rem)] lg:space-y-4 lg:p-4 lg:pt-[calc(var(--navbar-h)+1rem)]">
        {/* Header */}
        <section className="fb-card flex items-center gap-3 p-4 xl:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
            <Headset className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">Contact <span className="text-brand-500">support</span></h1>
            <p className="text-surface-500">Questions, AU recharge, feedback or partnerships: we would love to hear from you.</p>
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-2 lg:items-stretch lg:gap-4">
          {/* Contact details */}
          <div className="flex flex-col gap-3 lg:gap-4">
            <address className="grid gap-3 not-italic lg:gap-4">
              {details.map(({ icon: Icon, label, value, href }) => {
                const inner = (
                  <>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-surface-500">{label}</p>
                      <p className="break-all font-semibold text-surface-900">{value}</p>
                    </div>
                  </>
                );
                return href ? (
                  <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="fb-card flex items-center gap-3 p-4 transition-colors hover:bg-surface-100">
                    {inner}
                  </a>
                ) : (
                  <div key={label} className="fb-card flex items-center gap-3 p-4">{inner}</div>
                );
              })}
            </address>

            <section className="fb-card flex flex-1 items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-2xl">🦉</span>
              <div>
                <h2 className="text-lg font-bold text-surface-900">We are here for you</h2>
                <p className="text-sm text-surface-500">Learners always come first. Tell us what you need and we will help.</p>
              </div>
            </section>
          </div>

          {/* Form */}
          <section className="fb-card p-4 xl:p-6">
            <h2 className="text-2xl font-bold text-surface-900">Send a <span className="text-brand-500">message</span></h2>
            <p className="mb-4 mt-0.5 text-sm text-surface-500">We usually reply within 24 hours. Write to us anytime.</p>
            <ContactForm />
          </section>
        </div>

        {/* Feature row */}
        <section className="grid gap-3 md:grid-cols-3 lg:gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="fb-card flex flex-col items-center gap-2 p-4 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-surface-900">{title}</h3>
              <p className="max-w-[240px] text-sm text-surface-500">{desc}</p>
            </article>
          ))}
        </section>
      </div>
      <Footer />
    </div>
  );
}
