import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  return user?.role === 'admin' ? user : null;
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** GET /api/admin/contacts?page=1&limit=20&search=&status=all|unread|read */
export async function GET(request) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 20, 1), 100);
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') || 'all';

    const filter = {};
    if (status === 'unread') filter.isRead = false;
    if (status === 'read') filter.isRead = true;
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }];
    }

    const [contacts, total, unread] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Contact.countDocuments(filter),
      Contact.countDocuments({ isRead: false }),
    ]);

    return NextResponse.json({
      success: true,
      contacts,
      unread,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    console.error('[GET /api/admin/contacts] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PATCH /api/admin/contacts  { id, isRead } */
export async function PATCH(request) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { id, isRead } = await request.json();
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });

    await dbConnect();
    const contact = await Contact.findByIdAndUpdate(id, { isRead: !!isRead }, { new: true }).lean();
    if (!contact) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error('[PATCH /api/admin/contacts] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/admin/contacts  { id } */
export async function DELETE(request) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { id } = await request.json();
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });

    await dbConnect();
    await Contact.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/contacts] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
