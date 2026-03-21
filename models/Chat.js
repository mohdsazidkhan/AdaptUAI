import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      responseTimeMs: Number,
      tokenCount: Number,
      isRetry: Boolean,
    },
  },
  { _id: true }
);

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      maxlength: 120,
    },
    topic: {
      type: String,
      default: '',
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    // Snapshot of the user's mindset profile at start of session
    profileSnapshot: {
      confidence: Number,
      patience: Number,
      learningStyle: String,
      depthPreference: String,
    },
    // Behavioral metrics tracked during session
    sessionMetrics: {
      messageCount:      { type: Number, default: 0 },
      retryCount:        { type: Number, default: 0 },
      avgResponseTimeMs: { type: Number, default: 0 },
      avgMessageLength:  { type: Number, default: 0 },
      totalLength:       { type: Number, default: 0 },
    },
    auEarned: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────
ChatSchema.virtual('messageCount').get(function () {
  if (!this.messages || !Array.isArray(this.messages)) return 0;
  return this.messages.filter((m) => m.role !== 'system').length;
});

ChatSchema.virtual('lastMessageAt').get(function () {
  if (!this.messages || !Array.isArray(this.messages) || this.messages.length === 0) return this.createdAt;
  return this.messages[this.messages.length - 1].timestamp;
});

// ── Methods ───────────────────────────────────────────────────────────────────
ChatSchema.methods.addMessage = function (role, content, metadata = {}) {
  this.messages.push({ role, content, metadata });
  // Update session metrics
  if (role === 'user') {
    this.sessionMetrics.messageCount += 1;
    this.sessionMetrics.totalLength += content.length;
    if (metadata.isRetry) this.sessionMetrics.retryCount += 1;
    if (metadata.responseTimeMs) {
      const n = this.sessionMetrics.messageCount;
      this.sessionMetrics.avgResponseTimeMs = Math.round(
        (this.sessionMetrics.avgResponseTimeMs * (n - 1) + metadata.responseTimeMs) / n
      );
    }
    this.sessionMetrics.avgMessageLength = Math.round(
      this.sessionMetrics.totalLength / this.sessionMetrics.messageCount
    );
  }
};

// ── Statics ───────────────────────────────────────────────────────────────────
ChatSchema.statics.getRecentByUser = function (userId, limit = 10) {
  return this.find({ userId, isActive: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('sessionId title topic auEarned sessionMetrics createdAt updatedAt');
};

// ── Indexes ───────────────────────────────────────────────────────────────────
ChatSchema.index({ userId: 1, updatedAt: -1 });
ChatSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
