import './globals.css';
import { getAuthUserFromCookies } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
  title: {
    default: 'AdaptUAI — AI that adapts to you',
    template: '%s | AdaptUAI',
  },
  description:
    'AdaptUAI — AI that adapts to you. An intelligent tutor that adjusts to your mindset, learning style, and pace.',
  keywords: ['AI tutor', 'learn', 'education', 'personalized learning', 'AI teacher'],
  openGraph: {
    title: 'AdaptUAI — Your Personalized AI Tutor',
    description: 'An intelligent AI tutor that adapts to your mindset and learning style.',
    type: 'website',
  },
};

export default async function RootLayout({ children }) {
  // Try to get authenticated user for Navbar
  let user = null;
  try {
    const authPayload = await getAuthUserFromCookies();
    if (authPayload?.userId) {
      // ── Handle Admin Bypass ────────────────────────────────────────────────
      if (authPayload.userId === 'admin') {
        user = {
          id: 'admin',
          name: authPayload.name || 'System Admin',
          email: authPayload.email,
          role: 'admin',
          au: 99999,
          level: 'MOD',
          streak: 999,
          avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff',
        };
      } else {
        // ── Regular User ──────────────────────────────────────────────────────
        await dbConnect();
        const dbUser = await User.findById(authPayload.userId).select('-password').lean();
        if (dbUser) {
          user = {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            role: authPayload.role || 'user',
            au: dbUser.au || 0,
            level: dbUser.level || 1,
            streak: dbUser.streak || 0,
            avatarUrl: dbUser.avatarUrl || `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${encodeURIComponent(dbUser.name)}`,
          };
        }
      }
    }
  } catch {
    // Silently swallow errors — unauthenticated or DB not configured
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (!theme && supportDarkMode) theme = 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased transition-colors duration-300">
        <ThemeProvider>
          <Navbar user={user} />
          <main className="min-h-screen">
            {children}
          </main>
          <ToastContainer 
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
