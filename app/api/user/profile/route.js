import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Chat from '@/models/Chat';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile — Get current My Profile + stats
 */
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (authUser.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot access user endpoints.' }, { status: 403 });
    }

    console.log('[GET /api/user/profile] Request from:', authUser.userId);
    await dbConnect();


    const user = await User.findById(authUser.userId);
    if (!user) {
      console.warn('[GET /api/user/profile] User not found:', authUser.userId);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Recent chat sessions for profile overview
    console.log('[GET /api/user/profile] Fetching recent chats...');
    const recentChats = await Chat.getRecentByUser(authUser.userId, 5);

    // Total messages across all sessions
    console.log('[GET /api/user/profile] Aggregating stats...');
    const chatStats = await Chat.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalAU: { $sum: { $ifNull: ['$auEarned', 0] } },
          totalMessages: { $sum: { $ifNull: ['$sessionMetrics.messageCount', 0] } },
        },
      },
    ]);

    const stats = chatStats[0] || { totalSessions: 0, totalAU: 0, totalMessages: 0 };
    console.log('[GET /api/user/profile] Success for:', user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        au: user.au,
        level: user.level,
        streak: user.streak,
        longestStreak: user.longestStreak,
        badges: user.badges,
        auProgress: user.auProgress,
        auForNextLevel: user.auForNextLevel,
        weakAreas: user.weakAreas,
        strongAreas: user.strongAreas,
        topicsExplored: user.topicsExplored,
        preferences: user.preferences,
        mindsetProfile: user.mindsetProfile,
        createdAt: user.createdAt,
        lastActiveDate: user.lastActiveDate,
      },
      stats: {
        totalSessions: stats.totalSessions,
        totalMessages: stats.totalMessages,
      },
      recentChats,
    });
  } catch (error) {
    console.error('[GET /api/user/profile] CRASH:', error);
    return NextResponse.json({
      error: 'Internal server error.',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile — Update My Profile fields
 */
export async function PATCH(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (authUser.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot access user endpoints.' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, preferences, learningStyle, depthPreference } = body;

    const updateFields = {};
    if (name && name.trim().length >= 2) updateFields.name = name.trim();
    if (preferences) updateFields.preferences = preferences;
    if (learningStyle) {
      updateFields['mindsetProfile.learningStyle'] = learningStyle;
    }
    if (depthPreference) {
      updateFields['mindsetProfile.depthPreference'] = depthPreference;
    }


    const user = await User.findByIdAndUpdate(
      authUser.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
        mindsetProfile: user.mindsetProfile,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/user/profile] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
