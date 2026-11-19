import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// The signed-in learner's own notifications only.
async function learnerId(request) {
  const auth = await getAuthUser(request);
  return auth?.userId && mongoose.isValidObjectId(auth.userId) ? auth.userId : null;
}

/** GET /api/user/notifications?limit=15 -> latest notifications + unread count (navbar bell) */
export async function GET(request) {
  try {
    const userId = await learnerId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    await dbConnect();
    const limit = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('limit'), 10) || 15, 1), 50);
    const [notifications, unread] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ userId, isRead: false }),
    ]);
    return NextResponse.json({ success: true, notifications, unread });
  } catch (error) {
    console.error('[GET /api/user/notifications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PATCH /api/user/notifications  { id } marks one read, { all: true } marks all read */
export async function PATCH(request) {
  try {
    const userId = await learnerId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    const { id, all } = await request.json().catch(() => ({}));
    await dbConnect();
    if (all) {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    } else if (mongoose.isValidObjectId(id)) {
      await Notification.updateOne({ _id: id, userId }, { isRead: true });
    } else {
      return NextResponse.json({ error: 'Give an id or all: true' }, { status: 400 });
    }
    const unread = await Notification.countDocuments({ userId, isRead: false });
    return NextResponse.json({ success: true, unread });
  } catch (error) {
    console.error('[PATCH /api/user/notifications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
