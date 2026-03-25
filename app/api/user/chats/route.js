import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (authUser.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot access user endpoints.' }, { status: 403 });
    }

    await dbConnect();

    // Fetch previous chats for the user
    const chats = await Chat.find({ userId: authUser.userId })
      .select('sessionId title updatedAt messages')
      .sort({ updatedAt: -1 })
      .limit(50);

    // Format the response to include message count
    const formattedChats = chats.map(chat => ({
      sessionId: chat.sessionId,
      title: chat.title || 'Untitled Session',
      updatedAt: chat.updatedAt,
      messageCount: chat.messages?.length || 0,
      preview: chat.messages?.[chat.messages.length - 1]?.content?.slice(0, 100) || 'No messages yet.'
    }));

    return NextResponse.json({
      success: true,
      chats: formattedChats
    });
  } catch (err) {
    console.error('Failed to fetch chat history:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
