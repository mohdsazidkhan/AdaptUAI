import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Get all users except admin (who isn't in DB anyway, but good to be safe)
    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('[GET /api/admin/users] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, ...updateData } = await request.json();
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    await dbConnect();
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('[PATCH /api/admin/users] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function DELETE(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    await dbConnect();
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('[DELETE /api/admin/users] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
