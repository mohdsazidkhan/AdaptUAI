import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Admin notifications have no recipient user (learner notifications carry their userId).
const ADMIN_INBOX = { userId: null };

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  return user?.role === 'admin' ? user : null;
}

/** GET /api/admin/notifications?limit=15 -> latest notifications + unread count (navbar bell) */
export async function GET(request) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    await dbConnect();
    const limit = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('limit'), 10) || 15, 1), 50);
    const [notifications, unread] = await Promise.all([
      Notification.find(ADMIN_INBOX).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ ...ADMIN_INBOX, isRead: false }),
    ]);
    return NextResponse.json({ success: true, notifications, unread });
  } catch (error) {
    console.error('[GET /api/admin/notifications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PATCH /api/admin/notifications  { id } marks one read, { all: true } marks every one read */
export async function PATCH(request) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { id, all } = await request.json().catch(() => ({}));
    await dbConnect();
    if (all) {
      await Notification.updateMany({ ...ADMIN_INBOX, isRead: false }, { isRead: true });
    } else if (mongoose.isValidObjectId(id)) {
      await Notification.updateOne({ _id: id, ...ADMIN_INBOX }, { isRead: true });
    } else {
      return NextResponse.json({ error: 'Give an id or all: true' }, { status: 400 });
    }
    const unread = await Notification.countDocuments({ ...ADMIN_INBOX, isRead: false });
    return NextResponse.json({ success: true, unread });
  } catch (error) {
    console.error('[PATCH /api/admin/notifications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
