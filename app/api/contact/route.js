import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) => String(v ?? '').trim().slice(0, max);

/** POST /api/contact - public contact form */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Honeypot: real people never see or fill the hidden "website" field; bots do. Pretend it worked.
    if (body.website) return NextResponse.json({ success: true }, { status: 201 });

    const name = clean(body.name, 100);
    const email = clean(body.email, 200).toLowerCase();
    const subject = clean(body.subject, 200);
    const message = clean(body.message, 5000);

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ success: false, error: 'Please fill in all fields.' }, { status: 400 });
    }
    if (!EMAIL.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ success: false, error: 'Please write a little more detail (at least 10 characters).' }, { status: 400 });
    }

    await dbConnect();

    // Same sender + same message within 10 minutes = a double submit; don't store it twice.
    const recent = await Contact.findOne({ email, message, createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } }).lean();
    if (recent) return NextResponse.json({ success: true, message: 'Message already received.' }, { status: 200 });

    const auth = await getAuthUser(request).catch(() => null);
    const userId = auth?.userId && mongoose.isValidObjectId(auth.userId) ? auth.userId : null;

    await Contact.create({ name, email, subject, message, userId });

    return NextResponse.json({ success: true, message: 'Message sent successfully.' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/contact] Error:', error);
    return NextResponse.json({ success: false, error: 'Could not send your message. Please try again.' }, { status: 500 });
  }
}
