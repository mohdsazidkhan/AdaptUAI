import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/profile — Get current Admin Profile
 */
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json({ error: 'Admin user not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        au: user.au,
        level: user.level,
        streak: user.streak,
        longestStreak: user.longestStreak,
        createdAt: user.createdAt,
        lastActiveDate: user.lastActiveDate,
      }
    });
  } catch (error) {
    console.error('[GET /api/admin/profile] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/profile — Update Admin Profile fields
 */
export async function PATCH(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { name } = body;

    const updateFields = {};
    if (name && name.trim().length >= 2) updateFields.name = name.trim();

    const user = await User.findByIdAndUpdate(
      authUser.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'Admin user not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/admin/profile] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
