import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Chat from '@/models/Chat';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const [totalUsers, totalChats, totalTransactions, totalAU] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Chat.countDocuments(),
      Transaction.countDocuments(),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: null, total: { $sum: '$au' } } }
      ])
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalChats,
        totalTransactions,
        totalAU: totalAU[0]?.total || 0,
      }
    });
  } catch (error) {
    console.error('[GET /api/admin/stats] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
