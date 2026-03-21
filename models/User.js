import mongoose from 'mongoose';
import { DEFAULT_PROFILE } from '../lib/userProfile.js';

const MindsetProfileSchema = new mongoose.Schema(
  {
    confidence:      { type: Number, default: DEFAULT_PROFILE.confidence, min: 0, max: 1 },
    patience:        { type: Number, default: DEFAULT_PROFILE.patience, min: 0, max: 1 },
    learningStyle:   { type: String, enum: ['visual', 'analytical', 'practical', 'narrative'], default: 'practical' },
    depthPreference: { type: String, enum: ['surface', 'intermediate', 'deep'], default: 'intermediate' },
    engagementScore: { type: Number, default: DEFAULT_PROFILE.engagementScore, min: 0, max: 1 },
    sessionCount:    { type: Number, default: 0 },
    totalMessages:   { type: Number, default: 0 },
    avgMessageLength:    { type: Number, default: 60 },
    avgResponseTimeMs:   { type: Number, default: 5000 },
    retryRate:           { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    // ── AU Wallet ────────────────────────────────────────────────────────────
    au: {
      type: Number,
      required: true,
      default: 100, // New users start with 100 AU
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
    badges: {
      type: [String],
      default: [],
    },
    // ── Learning data ─────────────────────────────────────────────────────────
    weakAreas: {
      type: [String],
      default: [],
    },
    strongAreas: {
      type: [String],
      default: [],
    },
    topicsExplored: {
      type: [String],
      default: [],
    },
    preferences: {
      preferredTopics: { type: [String], default: [] },
      dailyGoalMinutes: { type: Number, default: 15 },
      notifications: { type: Boolean, default: true },
    },
    // ── Mindset profile ──────────────────────────────────────────────────────
    mindsetProfile: {
      type: MindsetProfileSchema,
      default: () => ({ ...DEFAULT_PROFILE }),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Explicitly remove any 'xp' virtual or index if it exists
UserSchema.remove('xp'); 

UserSchema.virtual('auForNextLevel').get(function () {
  return this.level * 100;
});

UserSchema.virtual('auProgress').get(function () {
  const base = (this.level - 1) * 100;
  const next = this.level * 100;
  return Math.min(Math.round(((this.au - base) / (next - base)) * 100), 100);
});

UserSchema.virtual('avatarUrl').get(function () {
  if (this.avatar) return this.avatar;
  const seed = encodeURIComponent(this.name || 'user');
  return `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${seed}`;
});

UserSchema.methods.rechargeAU = async function (points) {
  this.au += points;
  return this.save();
};

UserSchema.methods.spendAU = async function (points) {
  if (this.au < points) throw new Error('Insufficient AU balance');
  this.au -= points;
  return this.save();
};

UserSchema.methods.updateStreak = async function () {
  const now = new Date();
  const last = new Date(this.lastActiveDate);
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    this.streak += 1;
    if (this.streak > this.longestStreak) this.longestStreak = this.streak;
  } else if (diffDays > 1) {
    this.streak = 1;
  }
  this.lastActiveDate = now;
  return this.save();
};

UserSchema.methods.addWeakArea = async function (topic) {
  if (!this.weakAreas.includes(topic)) {
    this.weakAreas.push(topic);
    if (this.weakAreas.length > 10) this.weakAreas.shift();
    return this.save();
  }
};

UserSchema.methods.addTopic = async function (topic) {
  if (!this.topicsExplored.includes(topic)) {
    this.topicsExplored.push(topic);
    return this.save();
  }
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
