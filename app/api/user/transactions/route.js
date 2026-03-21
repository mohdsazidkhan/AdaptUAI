import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const transactions = await Transaction.find({ userId: authUser.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch transaction history' }, { status: 500 });
  }
}
