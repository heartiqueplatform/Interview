export const PLANS = {
  monthly: { name: 'Monthly', price: 299, duration_days: 30, label: 'KES 299 / month' },
  season: { name: 'Season', price: 699, duration_days: 90, label: 'KES 699 / 3 months' },
  'half-year': { name: 'Half-year', price: 1199, duration_days: 180, label: 'KES 1,199 / 6 months' },
  'one-time': { name: 'One-time', price: 2499, duration_days: 36500, label: 'KES 2,499 / lifetime (first 100 only)' },
} as const;

export const FREE_SCENARIO_LIMIT = 5;

export const COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Machakos',
  'Meru',
  'Kakamega',
  'Garissa',
  'Kisii',
  'Nyeri',
  'Embu',
  'Kitale',
  'Malindi',
  'Lamu',
  'Kericho',
  'Bomet',
  'Narok',
  'Naivasha',
  'Other',
];

export const DEPARTMENTS = [
  'Medical',
  'Surgical',
  'Maternity',
  'Pediatrics',
  'ICU',
  'Theatre',
  'Emergency',
  'Psychiatric',
  'Community',
  'OPD',
  'Renal',
  'Oncology',
];

export const TRAP_TYPES = [
  'Ethical dilemma',
  'Clinical judgment',
  'Communication',
  'Prioritization',
  'Policy',
];

export const PROFANITY_EN = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'cunt'];
export const PROFANITY_SW = ['malaya', 'mkundu', 'fala', 'mjinga', 'shenzi', 'pumbavu'];
