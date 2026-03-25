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

    if (adminEmail && adminPassword && email.toLowerCase().trim() === adminEmail.toLowerCase().trim()) {
      // Check if administrative user exists in DB
      let adminUser = await User.findOne({ email: adminEmail.toLowerCase().trim() }).select('+password');
      
      if (!adminUser) {
        // Create the admin user in DB if it doesn't exist
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        adminUser = await User.create({
          name: 'System Admin',
          email: adminEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: 'admin',
          au: 99999,
          level: 100,
          streak: 999,
        });
      }

      // Verify password (against .env or DB)
      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (!isMatch) {
         return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      const token = await signToken({
        userId: adminUser._id.toString(),
        email: adminUser.email,
        name: adminUser.name,
        role: 'admin'
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: adminUser._id.toString(),
          name: adminUser.name,
          email: adminUser.email,
          role: 'admin',
          au: adminUser.au,
          level: adminUser.level,
          streak: adminUser.streak,
          avatarUrl: adminUser.avatarUrl,
          redirect: '/admin/dashboard',
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
