import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { sessionId } = params;
    const admin = await getAuthUser(request);
    
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Fetch the chat session with user details
    const chat = await Chat.findOne({ sessionId })
      .populate('userId', 'name email avatarUrl');

    if (!chat) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error(`[GET /api/admin/chats/${params.sessionId}] Error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
