import mongoose from 'mongoose';

// Messages sent from the public /contact form. Admins read them on /admin/contacts.
const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    // Set when the sender was logged in, so the admin can see which account wrote.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ContactSchema.index({ createdAt: -1 });

// Dev only: after this file changes, drop the cached model so the new schema is used
// (otherwise new fields are silently dropped until the server restarts).
if (process.env.NODE_ENV !== 'production' && mongoose.models.Contact) delete mongoose.models.Contact;

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
