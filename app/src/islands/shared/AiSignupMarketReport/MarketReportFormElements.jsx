/**
 * Form elements for AI Signup Market Report
 * Contains FreeformInput, ContactForm, and TopicIndicators sub-components
 */

// Topic definitions for freeform input detection
const FREEFORM_TOPICS = [
  {
    id: 'schedule',
    label: 'Schedule',
    patterns: [
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b/i,
      /\b(weekday|weekend|weekly|daily|monthly)s?\b/i,
      /\b(morning|afternoon|evening|night)s?\b/i,
      /\b(schedule|timing|hours?|days?|time|weeks?)\b/i,
      /\b(\d+\s*(am|pm|days?|weeks?|months?))\b/i,
    ],
  },
  {
    id: 'patterns',
    label: 'Patterns',
    patterns: [
      /\b(every|recurring|regular|repeat|routine)\b/i,
      /\b(alternating|rotating|flexible|fixed)\b/i,
      /\b(once|twice|three times)\s+(a|per)\s+(week|month)\b/i,
      /\b(pattern|frequency|interval)\b/i,
    ],
  },
  {
    id: 'commute',
    label: 'Commute',
    patterns: [
      /\b(commute|commuting|travel|traveling)\b/i,
      /\b(subway|metro|train|bus|drive|driving)\b/i,
      /\b(office|work|job|workplace)\b/i,
      /\b(remote|hybrid|in-?person)\b/i,
      /\b(transit|transportation)\b/i,
    ],
  },
  {
    id: 'location',
    label: 'Location',
    patterns: [
      /\b(manhattan|brooklyn|queens|bronx|staten island)\b/i,
      /\b(midtown|downtown|uptown|village|heights)\b/i,
      /\b(near|close to|walking distance|neighborhood)\b/i,
      /\b(area|location|place|spot|zone)\b/i,
      /\b(east side|west side|upper|lower)\b/i,
      /\b(new york|nyc|ny|the city)\b/i,
    ],
  },
  {
    id: 'needs',
    label: 'Needs',
    patterns: [
      /\b(need|require|want|looking for|must have)\b/i,
      /\b(quiet|peaceful|private|furnished|unfurnished)\b/i,
      /\b(pet|dog|cat|animal)\b/i,
      /\b(laundry|kitchen|bathroom|bedroom)\b/i,
      /\b(wifi|internet|utilities|amenities)\b/i,
    ],
  },
  {
    id: 'background',
    label: 'About You',
    patterns: [
      /\b(i am|i'm|my name|myself)\b/i,
      /\b(student|professional|nurse|doctor|teacher|engineer)\b/i,
      /\b(work at|working at|employed|job at)\b/i,
      /\b(years? old|age|background|bio)\b/i,
      /\b(relocating|moving|new to|visiting)\b/i,
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    patterns: [
      /\b(storage|store|closet|space for)\b/i,
      /\b(luggage|bags?|boxes?|belongings)\b/i,
      /\b(bring|keep|leave|store)\b/i,
      /\b(furniture|stuff|things|items)\b/i,
    ],
  },
];

// Implement topic detection from user query
export const detectTopicFromQuery = (query) => {
  const lowerQuery = query.toLowerCase();

  // Topic patterns
  const topicPatterns = {
    pricing: /price|cost|rent|budget|afford|cheap|expensive/i,
    neighborhood: /neighborhood|area|location|where|live/i,
    amenities: /amenity|feature|gym|pool|parking|laundry/i,
    commute: /commute|transit|subway|bus|train|walk/i,
    safety: /safe|crime|security|family/i,
    comparison: /compare|vs|versus|better|difference/i
  };

  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(lowerQuery)) {
      return topic;
    }
  }

  return 'general';
};

function detectTopics(text) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const detectedTopics = [];

  for (const topic of FREEFORM_TOPICS) {
    const isDetected = topic.patterns.some(pattern => pattern.test(text));
    if (isDetected) {
      detectedTopics.push(topic.id);
    }
  }

  return detectedTopics;
}

function TopicIndicators({ detectedTopics }) {
  return (
    <div className="topic-indicators">
      {FREEFORM_TOPICS.map((topic) => {
        const isDetected = detectedTopics.includes(topic.id);
        return (
          <span
            key={topic.id}
            className={`topic-chip ${isDetected ? 'topic-detected' : ''}`}
          >
            {isDetected && <span className="topic-checkmark">&#10003;</span>}
            {topic.label}
          </span>
        );
      })}
    </div>
  );
}

export function FreeformInput({ value, onChange }) {
  const detectedTopics = detectTopics(value);

  return (
    <div className="freeform-container">
      <div className="freeform-header">
        <p className="freeform-instruction">
          Describe your unique logistics needs in your own words
        </p>
      </div>

      <textarea
        className="freeform-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`ex.
I need a quiet space near downtown, weekly from Monday to Friday, I commute to the city on a weekly basis.

Send to (415) 555-5555 and guest@mail.com`}
        rows={8}
        aria-label="Market research description"
      />

      <TopicIndicators detectedTopics={detectedTopics} />

      <div className="info-banner">
        <div className="info-banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#31135D" />
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">!</text>
          </svg>
        </div>
        <span className="info-banner-text">Include your email and phone number for faster processing</span>
      </div>
    </div>
  );
}

export function ContactForm({ email, phone, onEmailChange, onPhoneChange }) {
  return (
    <div className="contact-container">
      <h3 className="contact-heading">Where do we send the report?</h3>

      <div className="contact-form-group">
        <label className="contact-label" htmlFor="email-input">
          Your email <span className="contact-required">*</span>
        </label>
        <input
          id="email-input"
          type="email"
          className="contact-input"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your.email@example.com"
          required
          aria-required="true"
        />
      </div>

      <div className="contact-form-group">
        <label className="contact-label" htmlFor="phone-input">
          Phone number (optional)
        </label>
        <input
          id="phone-input"
          type="tel"
          className="contact-input"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="(415) 555-5555"
        />
      </div>

      <p className="contact-disclaimer">
        We&apos;ll send your personalized market research report to this email address.
      </p>
    </div>
  );
}
