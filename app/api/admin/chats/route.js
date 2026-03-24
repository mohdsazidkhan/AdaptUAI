import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Get all chats with user info
    const chats = await Chat.find({})
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('[GET /api/admin/chats] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
