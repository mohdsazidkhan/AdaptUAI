import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { parseListQuery, paginationOf } from '@/lib/listQuery';

const USER_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  au_high: { au: -1, createdAt: -1 },
  au_low: { au: 1, createdAt: -1 },
  level: { level: -1, au: -1 },
  active: { lastActiveDate: -1 },
};

/**
 * GET /api/admin/users?search=&style=&balance=&range=&sort=&page=&limit=
 *   search  name or email
 *   style   visual | analytical | practical | narrative
 *   balance zero | low (<20 AU) | has (>=20 AU)
 *   range   joined within 24h | 7d | 30d | 90d
 *   sort    newest | oldest | name | au_high | au_low | level | active
 *   all=1   every matching user, no paging (CSV export)
 */
export async function GET(request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const q = parseListQuery(request, { sorts: USER_SORTS, defaultSort: 'newest' });

    const filter = { role: { $ne: 'admin' } };
    if (q.searchRx) filter.$or = [{ name: q.searchRx }, { email: q.searchRx }];
    const style = q.sp.get('style');
    if (['visual', 'analytical', 'practical', 'narrative'].includes(style)) filter['mindsetProfile.learningStyle'] = style;
    const balance = q.sp.get('balance');
    if (balance === 'zero') filter.au = 0;
    else if (balance === 'low') filter.au = { $gt: 0, $lt: 20 };
    else if (balance === 'has') filter.au = { $gte: 20 };
    if (q.from) filter.createdAt = { $gte: q.from };

    if (q.sp.get('all') === '1') {
      const users = await User.find(filter).sort(q.sort);
      return NextResponse.json({ success: true, users, pagination: paginationOf(1, users.length || 1, users.length) });
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort(q.sort).skip(q.skip).limit(q.limit),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, users, pagination: paginationOf(q.page, q.limit, total) });
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
