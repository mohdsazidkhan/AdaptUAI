import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, createAuthCookieHeader } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // ── Admin Check ───────────────────────────────────────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword && 
        email.toLowerCase().trim() === adminEmail.toLowerCase().trim() && 
        password === adminPassword) {
      
      const token = await signToken({
        userId: 'admin',
        email: adminEmail,
        name: 'System Admin',
        role: 'admin'
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: 'admin',
          name: 'System Admin',
          email: adminEmail,
          role: 'admin',
          au: 99999,
          level: 'MOD',
          streak: 999,
          avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff',
        },
      });

      response.headers.set('Set-Cookie', createAuthCookieHeader(token));
      return response;
    }

    // ── Find user (include password field explicitly) ──────────────────────────
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // ── Check password ────────────────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // ── Update streak ─────────────────────────────────────────────────────────
    await user.updateStreak();

    // ── Generate JWT ──────────────────────────────────────────────────────────
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: 'user', // Default role
    });

    // ── Set cookie and respond ────────────────────────────────────────────────
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: 'user',
        au: user.au,
        level: user.level,
        streak: user.streak,
        avatarUrl: user.avatarUrl,
        redirect: '/user/dashboard',
      },
    });

    response.headers.set('Set-Cookie', createAuthCookieHeader(token));
    return response;
  } catch (error) {
    console.error('[POST /api/auth/login] Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
