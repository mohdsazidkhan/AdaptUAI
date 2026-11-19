import mongoose from 'mongoose';

/*
 * Navbar bell notifications.
 * - userId null  -> admin inbox (shared by the admin team), e.g. new contact messages
 * - userId set   -> that learner's own notifications, e.g. "AU recharge successful"
 */
const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    type: { type: String, enum: ['contact', 'recharge'], required: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, default: '', maxlength: 300 },
    link: { type: String, default: '' }, // where clicking the notification goes
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null, index: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

// Dev only: after this file changes, drop the cached model so the new schema is used
// (otherwise new fields are silently dropped until the server restarts).
if (process.env.NODE_ENV !== 'production' && mongoose.models.Notification) delete mongoose.models.Notification;

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
