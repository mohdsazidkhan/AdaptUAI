import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { getAuthUser } from '@/lib/auth';
import { parseListQuery, paginationOf } from '@/lib/listQuery';

export const dynamic = 'force-dynamic';

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  return user?.role === 'admin' ? user : null;
}


const CONTACT_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1, createdAt: -1 },
  unread: { isRead: 1, createdAt: -1 },
};

/** GET /api/admin/contacts?page=&limit=&search=&status=all|unread|read&range=24h|7d|30d|90d&sort=newest|oldest|name|unread */
export async function GET(request) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    await dbConnect();

    const q = parseListQuery(request, { sorts: CONTACT_SORTS, defaultSort: 'newest' });
    const { page, limit } = q;
    const status = q.sp.get('status') || 'all';

    const filter = {};
    if (status === 'unread') filter.isRead = false;
    if (status === 'read') filter.isRead = true;
    if (q.from) filter.createdAt = { $gte: q.from };
    if (q.searchRx) filter.$or = [{ name: q.searchRx }, { email: q.searchRx }, { subject: q.searchRx }, { message: q.searchRx }];

    const [contacts, total, unread] = await Promise.all([
      Contact.find(filter).sort(q.sort).skip(q.skip).limit(limit).lean(),
      Contact.countDocuments(filter),
      Contact.countDocuments({ isRead: false }),
    ]);

    return NextResponse.json({
      success: true,
      contacts,
      unread,
      pagination: { ...paginationOf(page, limit, total), totalPages: Math.max(Math.ceil(total / limit), 1) },
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
