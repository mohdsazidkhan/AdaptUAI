import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { parseListQuery, paginationOf } from '@/lib/listQuery';

export const dynamic = 'force-dynamic';

const TX_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  amount_high: { amount: -1, createdAt: -1 },
  amount_low: { amount: 1, createdAt: -1 },
};

/**
 * GET /api/admin/transactions?search=&type=&range=&sort=&page=&limit=
 *   search  description, or the learner's name / email
 *   type    SPEND | RECHARGE
 *   range   within 24h | 7d | 30d | 90d
 *   sort    newest | oldest | amount_high | amount_low
 * `stats` are system-wide totals (not affected by the filters).
 */
export async function GET(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const q = parseListQuery(request, { sorts: TX_SORTS, defaultSort: 'newest', defaultLimit: 20 });

    const adminIds = (await User.find({ role: 'admin' }).select('_id').lean()).map((u) => u._id);

    const filter = { userId: { $nin: adminIds } };
    const type = q.sp.get('type');
    if (type === 'SPEND' || type === 'RECHARGE') filter.type = type;
    if (q.from) filter.createdAt = { $gte: q.from };
    if (q.searchRx) {
      const users = await User.find({ $or: [{ name: q.searchRx }, { email: q.searchRx }] }).select('_id').lean();
      filter.$or = [{ description: q.searchRx }, { userId: { $in: users.map((u) => u._id), $nin: adminIds } }];
    }

    const [transactions, total, typeTotals, auStats] = await Promise.all([
      Transaction.find(filter).populate('userId', 'name email avatar').sort(q.sort).skip(q.skip).limit(q.limit),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: { userId: { $nin: adminIds } } },
        { $group: { _id: '$type', totalAmount: { $sum: '$amount' } } },
      ]),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: null, total: { $sum: '$au' } } },
      ]),
    ]);

    const totalSpent = typeTotals.find((s) => s._id === 'SPEND')?.totalAmount || 0;
    const totalLeft = auStats[0]?.total || 0;

    return NextResponse.json({
      success: true,
      transactions,
      stats: { totalSpent, totalRecharged: totalSpent + totalLeft, totalLeft },
      pagination: paginationOf(q.page, q.limit, total),
    });
  } catch (error) {
    console.error('[GET /api/admin/transactions] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
