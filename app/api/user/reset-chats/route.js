import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await dbConnect();
    const userId = authUser.userId;

    // 1. Delete all chats for this user
    await Chat.deleteMany({ userId });

    // 2. Clear learning profile data (topics, weak areas, etc.)
    await User.findByIdAndUpdate(userId, {
      $set: {
        topicsExplored: [],
        weakAreas: [],
        strongAreas: [],
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Chat history and learning profile reset successfully.' 
    });
  } catch (error) {
    console.error('[DELETE /api/user/reset-chats] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
