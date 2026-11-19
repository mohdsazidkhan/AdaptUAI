import mongoose from 'mongoose';

// Admin notifications (shown in the admin navbar bell). One shared inbox for the admin team.
const NotificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['contact'], required: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, default: '', maxlength: 300 },
    link: { type: String, default: '' }, // where clicking the notification goes
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null, index: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
