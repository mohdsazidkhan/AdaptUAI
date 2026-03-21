/**
 * Mindset / behavioral profile engine
 *
 * Tracks user behavior across conversations and produces a normalized
 * profile used to personalize AI responses.
 *
 * Profile shape:
 * {
 *   confidence:      0.0–1.0  (low = uncertain/retry-heavy, high = direct/confident)
 *   patience:        0.0–1.0  (low = short, quick answers; high = long discussions)
 *   learningStyle:   'visual' | 'analytical' | 'practical' | 'narrative'
 *   depthPreference: 'surface' | 'intermediate' | 'deep'
 *   engagementScore: 0.0–1.0
 * }
 */

const DEFAULT_PROFILE = {
  confidence: 0.5,
  patience: 0.5,
  learningStyle: 'practical',
  depthPreference: 'intermediate',
  engagementScore: 0.5,
  sessionCount: 0,
  totalMessages: 0,
  avgMessageLength: 0,
  avgResponseTimeMs: 0,
  retryRate: 0,
};

/**
 * Calculate a new profile given existing profile + new session metrics
 *
 * @param {object} existingProfile - Previous profile (or null)
 * @param {object} sessionMetrics - Metrics from this session
 * @param {number} sessionMetrics.avgResponseTimeMs - Avg time between user messages
 * @param {number} sessionMetrics.retryCount - How many times user re-asked or corrected
 * @param {number} sessionMetrics.avgMessageLength - Avg characters per user message
 * @param {number} sessionMetrics.messageCount - Number of messages in this session
 * @param {string[]} sessionMetrics.topics - Topics discussed
 * @returns {object} Updated profile
 */
export function calculateProfile(existingProfile, sessionMetrics) {
  const base = existingProfile || { ...DEFAULT_PROFILE };
  const {
    avgResponseTimeMs = 5000,
    retryCount = 0,
    avgMessageLength = 60,
    messageCount = 1,
  } = sessionMetrics;

  // ---- Confidence heuristic ----
  // High retry rate → low confidence; fast response & long messages → high confidence
  const retryPenalty = Math.min(retryCount / Math.max(messageCount, 1), 1) * 0.4;
  const lengthBonus = Math.min(avgMessageLength / 200, 1) * 0.3;
  const sessionConfidence = Math.max(0, Math.min(1, 0.5 + lengthBonus - retryPenalty));

  // ---- Patience heuristic ----
  // Slow responses (> 10s) → patient; very fast (< 2s) → impatient
  const normalizedTime = Math.min(avgResponseTimeMs / 15000, 1);
  const sessionPatience = normalizedTime;

  // ---- Depth preference ----
  let depthPreference = 'intermediate';
  if (avgMessageLength > 150 || base.patience > 0.7) depthPreference = 'deep';
  if (avgMessageLength < 40 || base.patience < 0.3) depthPreference = 'surface';

  // ---- Learning style ----
  let learningStyle = base.learningStyle || 'practical';
  // This can be overridden later by explicit user setting

  // ---- Engagement ----
  const engagementScore = Math.min(
    (messageCount / 20) * 0.5 + base.engagementScore * 0.5,
    1
  );

  // Weighted blend: new session counts for 30%, history for 70%
  const blend = (oldVal, newVal, weight = 0.3) =>
    Math.round((oldVal * (1 - weight) + newVal * weight) * 100) / 100;

  const totalMessages = (base.totalMessages || 0) + messageCount;
  const sessionCount = (base.sessionCount || 0) + 1;

  return {
    confidence: blend(base.confidence, sessionConfidence),
    patience: blend(base.patience, sessionPatience),
    learningStyle,
    depthPreference,
    engagementScore: blend(base.engagementScore, engagementScore),
    sessionCount,
    totalMessages,
    avgMessageLength: Math.round(
      blend(base.avgMessageLength || 60, avgMessageLength)
    ),
    avgResponseTimeMs: Math.round(
      blend(base.avgResponseTimeMs || 5000, avgResponseTimeMs)
    ),
    retryRate: blend(base.retryRate || 0, retryPenalty),
  };
}

/**
 * Track a single message metrics event and return updated raw metrics
 */
export function trackMessageEvent(existingMetrics, event) {
  const metrics = existingMetrics || {
    messageCount: 0,
    totalLength: 0,
    retryCount: 0,
    responseTimes: [],
    lastMessageAt: null,
  };

  const now = Date.now();
  const responseTime = metrics.lastMessageAt
    ? now - metrics.lastMessageAt
    : 5000;

  return {
    messageCount: metrics.messageCount + 1,
    totalLength: metrics.totalLength + (event.messageLength || 0),
    retryCount: metrics.retryCount + (event.isRetry ? 1 : 0),
    responseTimes: [...metrics.responseTimes.slice(-19), responseTime],
    lastMessageAt: now,
  };
}

/**
 * Convert raw tracked metrics into session summary for calculateProfile
 */
export function summarizeMetrics(rawMetrics) {
  const { messageCount, totalLength, retryCount, responseTimes } = rawMetrics;
  const avgResponseTimeMs =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 5000;

  return {
    messageCount,
    avgMessageLength: messageCount > 0 ? Math.round(totalLength / messageCount) : 60,
    retryCount,
    avgResponseTimeMs,
  };
}

/**
 * Get a human-readable label for the profile
 */
export function getProfileLabel(profile) {
  const labels = [];

  if (profile.confidence < 0.35) labels.push('Building Confidence');
  else if (profile.confidence > 0.7) labels.push('Confident Learner');

  if (profile.patience < 0.35) labels.push('Quick Learner');
  else if (profile.patience > 0.7) labels.push('Deep Thinker');

  if (profile.depthPreference === 'deep') labels.push('Detail-Oriented');
  if (profile.depthPreference === 'surface') labels.push('Quick Answers');

  return labels.length > 0 ? labels.join(' · ') : 'Balanced Learner';
}

export { DEFAULT_PROFILE };
