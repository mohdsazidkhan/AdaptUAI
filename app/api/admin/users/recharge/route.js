import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_AU = 1_000_000;

/**
 * POST /api/admin/users/recharge  { userId, au, rupees?, reference?, note? }
 * Credits AU after a payment the admin has confirmed (e.g. UPI):
 *   - adds `au` to the user's balance atomically
 *   - records a RECHARGE transaction (shows in the user's History and the admin ledger)
 *   - refuses a payment `reference` that was already credited, so one UPI payment can't be added twice
 */
export async function POST(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId } = body;
    const au = Number(body.au);
    const rupees = body.rupees === '' || body.rupees == null ? null : Number(body.rupees);
    const reference = String(body.reference || '').trim().slice(0, 100);
    const note = String(body.note || '').trim().slice(0, 120);

    if (!mongoose.isValidObjectId(userId)) return NextResponse.json({ error: 'Invalid user.' }, { status: 400 });
    if (!Number.isInteger(au) || au < 1 || au > MAX_AU) {
      return NextResponse.json({ error: `AU must be a whole number from 1 to ${MAX_AU}.` }, { status: 400 });
    }
    if (rupees != null && (!Number.isFinite(rupees) || rupees < 0)) {
      return NextResponse.json({ error: 'Rupees must be a positive number.' }, { status: 400 });
    }

    await dbConnect();

    if (reference) {
      const dup = await Transaction.findOne({ type: 'RECHARGE', reference }).select('userId amount createdAt').lean();
      if (dup) {
        return NextResponse.json(
          { error: `This payment reference was already credited (${dup.amount} AU on ${new Date(dup.createdAt).toLocaleDateString('en-IN')}).` },
          { status: 409 }
        );
      }
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, role: { $ne: 'admin' } },
      { $inc: { au } },
      { new: true }
    );
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const parts = ['Recharge by admin'];
    if (rupees != null) parts.push(`₹${rupees}`);
    if (reference) parts.push(`Ref ${reference}`);
    if (note) parts.push(note);

    const transaction = await Transaction.create({
      userId: user._id,
      type: 'RECHARGE',
      amount: au,
      description: parts.join(' · '),
      ...(reference ? { reference } : {}),
      ...(rupees != null ? { rupees } : {}),
    });

    return NextResponse.json({ success: true, au: user.au, transaction });
  } catch (error) {
    console.error('[POST /api/admin/users/recharge] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
