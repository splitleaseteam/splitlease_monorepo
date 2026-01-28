/**
 * Host Experience Review Survey Configuration
 * Defines all 11 steps, their fields, and validation rules
 */

export const TOTAL_STEPS = 11;

export const STEP_CONFIG = {
  1: {
    id: 'name',
    title: 'What is your name?',
    subtitle: 'Let us know who we\'re speaking with',
    fields: ['hostName'],
    required: false
  },
  2: {
    id: 'experience',
    title: 'Please describe your experience',
    subtitle: 'Tell us about your overall experience using Split Lease',
    fields: ['experienceDescription'],
    required: true
  },
  3: {
    id: 'priorChallenge',
    title: 'Prior to Split Lease',
    subtitle: 'What was your biggest challenge before using our platform?',
    fields: ['priorChallenge'],
    required: false
  },
  4: {
    id: 'challengeImpact',
    title: 'How did that challenge affect you?',
    subtitle: 'Describe how this challenge impacted your hosting experience',
    fields: ['challengeImpact'],
    required: false
  },
  5: {
    id: 'whatChanged',
    title: 'What changed after using Split Lease?',
    subtitle: 'How has your experience improved since joining us?',
    fields: ['whatChanged'],
    required: false
  },
  6: {
    id: 'whatStoodOut',
    title: 'What stood out to you?',
    subtitle: 'Was there anything particularly memorable about our service?',
    fields: ['whatStoodOut'],
    required: false
  },
  7: {
    id: 'additionalService',
    title: 'Additional Services',
    subtitle: 'Is there any service you wish we offered?',
    fields: ['additionalServiceNeeded'],
    required: false
  },
  8: {
    id: 'publicShare',
    title: 'Share Your Story',
    subtitle: 'Would you be comfortable with us sharing your feedback publicly?',
    fields: ['canSharePublicly'],
    required: false,
    inputType: 'boolean'
  },
  9: {
    id: 'recommend',
    title: 'How likely are you to recommend Split Lease?',
    subtitle: 'On a scale of 1-10, how likely would you recommend us to a friend?',
    fields: ['recommendationScore'],
    required: false,
    inputType: 'slider',
    min: 1,
    max: 10
  },
  10: {
    id: 'thankSomeone',
    title: 'Anyone to thank?',
    subtitle: 'Is there anyone at Split Lease you want to thank for excellent service?',
    fields: ['staffToThank'],
    required: false
  },
  11: {
    id: 'questions',
    title: 'Any questions?',
    subtitle: 'Do you have any questions regarding our service?',
    fields: ['additionalQuestions'],
    required: false
  }
};

export const INITIAL_FORM_STATE = {
  hostName: '',
  experienceDescription: '',
  priorChallenge: '',
  challengeImpact: '',
  whatChanged: '',
  whatStoodOut: '',
  additionalServiceNeeded: '',
  canSharePublicly: false,
  recommendationScore: 8, // Default to 8 for positive bias
  staffToThank: '',
  additionalQuestions: ''
};

export const LOCAL_STORAGE_KEY = 'hostExperienceReviewDraft';
