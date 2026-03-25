import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    await dbConnect();

    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIds = adminUsers.map(u => u._id);

    const [transactions, total, stats, auStats] = await Promise.all([
      Transaction.find({ userId: { $nin: adminIds } })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ userId: { $nin: adminIds } }),
      Transaction.aggregate([
        { $match: { userId: { $nin: adminIds } } },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: null, total: { $sum: '$au' } } }
      ])
    ]);

    const totalSpent = stats.find(s => s._id === 'SPEND')?.totalAmount || 0;
    const totalLeft = auStats[0]?.total || 0;
    const totalRecharged = totalSpent + totalLeft;

    return NextResponse.json({
      success: true,
      transactions,
      stats: {
        totalSpent,
        totalRecharged,
        totalLeft
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[GET /api/admin/transactions] Detailed Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: error.message 
    }, { status: 500 });
  }
}
