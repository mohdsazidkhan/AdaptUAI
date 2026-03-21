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
    });

    // ── Set cookie and respond ────────────────────────────────────────────────
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        au: user.au,
        level: user.level,
        streak: user.streak,
        avatarUrl: user.avatarUrl,
      },
    });

    response.headers.set('Set-Cookie', createAuthCookieHeader(token));
    return response;
  } catch (error) {
    console.error('[POST /api/auth/login] Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
