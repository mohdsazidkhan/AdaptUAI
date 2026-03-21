import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, createAuthCookieHeader } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, email, password } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }
    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // ── Check existing user ───────────────────────────────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    // ── Hash password ─────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Create user ───────────────────────────────────────────────────────────
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      au: Number(process.env.WELCOME_AU_TOKENS) || 100,
    });

    // ── Generate JWT ──────────────────────────────────────────────────────────
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // ── Set cookie and respond ────────────────────────────────────────────────
    const response = NextResponse.json(
      {
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
      },
      { status: 201 }
    );

    response.headers.set('Set-Cookie', createAuthCookieHeader(token));
    return response;
  } catch (error) {
    console.error('[POST /api/auth/signup] Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
