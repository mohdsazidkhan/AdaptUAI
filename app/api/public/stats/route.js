import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    const adminIds = admins.map((user) => user._id);

    const [totalUsers, questionCounts, topicCounts, tokenUsage] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Chat.aggregate([
        { $match: { userId: { $nin: adminIds } } },
        { $unwind: '$messages' },
        { $match: { 'messages.role': 'user' } },
        { $count: 'total' },
      ]),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $unwind: '$topicsExplored' },
        { $match: { topicsExplored: { $type: 'string', $ne: '' } } },
        { $group: { _id: { $toLower: { $trim: { input: '$topicsExplored' } } } } },
        { $match: { _id: { $ne: '' } } },
        { $count: 'total' },
      ]),
      Transaction.aggregate([
        { $match: { userId: { $nin: adminIds }, type: 'SPEND' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return NextResponse.json({
      questionsAsked: questionCounts[0]?.total || 0,
      users: totalUsers,
      topicsCovered: topicCounts[0]?.total || 0,
      tokensUsed: tokenUsage[0]?.total || 0,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('[GET /api/public/stats] Error:', error);
    return NextResponse.json({ error: 'Could not load public stats.' }, { status: 500 });
  }
}
