import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const transactions = await Transaction.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('[GET /api/admin/transactions] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
