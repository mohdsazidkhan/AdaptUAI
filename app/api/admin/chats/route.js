import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { parseListQuery, paginationOf } from '@/lib/listQuery';

export const dynamic = 'force-dynamic';

const CHAT_SORTS = {
  recent: { updatedAt: -1 },
  oldest: { updatedAt: 1 },
  messages: { messageCount: -1, updatedAt: -1 },
  au: { auEarned: -1, updatedAt: -1 },
  title: { title: 1 },
};

/**
 * GET /api/admin/chats?search=&range=&au=&sort=&page=&limit=
 *   search  chat title / topic, or the learner's name / email
 *   range   active within 24h | 7d | 30d | 90d
 *   au      used (AU spent in the chat) | none
 *   sort    recent | oldest | messages | au | title
 * The list never sends message bodies, only a messageCount.
 */
export async function GET(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const q = parseListQuery(request, { sorts: CHAT_SORTS, defaultSort: 'recent' });

    const match = {};
    if (q.searchRx) {
      const users = await User.find({ $or: [{ name: q.searchRx }, { email: q.searchRx }] }).select('_id').lean();
      match.$or = [{ title: q.searchRx }, { topic: q.searchRx }, { userId: { $in: users.map((u) => u._id) } }];
    }
    if (q.from) match.updatedAt = { $gte: q.from };
    const au = q.sp.get('au');
    if (au === 'used') match.auEarned = { $gt: 0 };
    else if (au === 'none') match.$and = [{ $or: [{ auEarned: 0 }, { auEarned: { $exists: false } }] }];

    const [rows, total] = await Promise.all([
      Chat.aggregate([
        { $match: match },
        { $addFields: { messageCount: { $size: { $ifNull: ['$messages', []] } } } },
        { $project: { messages: 0 } },
        { $sort: q.sort },
        { $skip: q.skip },
        { $limit: q.limit },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        // Only safe user fields (never the password hash) go back to the client.
        {
          $addFields: {
            userId: {
              $let: {
                vars: { u: { $arrayElemAt: ['$user', 0] } },
                in: { _id: '$$u._id', name: '$$u.name', email: '$$u.email', avatar: '$$u.avatar' },
              },
            },
          },
        },
        { $project: { user: 0 } },
      ]),
      Chat.countDocuments(match),
    ]);

    const chats = rows.map((c) => ({ ...c, userId: c.userId?._id ? { ...c.userId, avatarUrl: c.userId.avatar || null } : null }));
    return NextResponse.json({ success: true, chats, pagination: paginationOf(q.page, q.limit, total) });
  } catch (error) {
    console.error('[GET /api/admin/chats] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
