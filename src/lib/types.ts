export type ExperienceLevel = 'student' | 'no-exp' | '1yr' | 'bsc' | 'experienced';
export type FacilityLevel = '2' | '3' | '4' | '5' | '6' | 'private' | 'faith' | 'ngo';
export type SubscriptionStatus = 'free' | 'monthly' | 'season' | 'half-year' | 'one-time';
export type ProgressStatus = 'unread' | 'read' | 'revised' | 'mastered';
export type PostCategory = 'interview-exp' | 'ward-tip' | 'general' | 'job-alert';
export type ReportReason = 'spam' | 'harassment' | 'wrong_info' | 'other';
export type ContentType = 'post' | 'post_reply' | 'scenario_comment' | 'scenario';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'sw';

export interface User {
  id: string;
  email: string;
  name: string | null;
  experience_level: ExperienceLevel | null;
  target_facility_level: FacilityLevel | null;
  county: string | null;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  coins: number;
  streak_count: number;
  last_active_date: string | null;
  preferred_language: Language;
  theme: Theme;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Scenario {
  id: string;
  slug: string;
  title: string;
  swahili_title: string | null;
  facility_level: string;
  department: string;
  trap_type: string;
  experience_level: string;
  scenario_text: string;
  swahili_scenario_text: string | null;
  what_board_tests: string;
  wrong_answer: string;
  swahili_wrong_answer: string | null;
  right_answer: string;
  swahili_right_answer: string | null;
  image_url: string | null;
  english_audio_url: string | null;
  swahili_audio_url: string | null;
  external_resources: { title: string; url: string }[];
  memory_stickiness: number;
  verified_by: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  category: PostCategory;
  is_anonymous: boolean;
  facility_level: string | null;
  county: string | null;
  like_count: number;
  reply_count: number;
  status: 'published' | 'flagged' | 'removed';
  created_at: string;
  author?: { name: string | null };
}

export interface PostReply {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  is_anonymous: boolean;
  status: 'published' | 'flagged' | 'removed';
  created_at: string;
  author?: { name: string | null };
}

export interface ScenarioComment {
  id: string;
  scenario_id: string;
  user_id: string;
  body: string;
  is_anonymous: boolean;
  status: 'published' | 'flagged' | 'removed';
  created_at: string;
  author?: { name: string | null };
  like_count?: number;
}

export interface Payment {
  id: string;
  user_id: string;
  amount_kes: number;
  plan: string;
  mpesa_ref: string | null;
  intasend_ref: string | null;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
}

export interface DrugCalc {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content_md: string;
  version: string;
  last_updated: string;
}

export interface Facility {
  id: string;
  name: string;
  level: string;
  county: string;
  wards: string[];
  notes: string | null;
  created_by?: string | null;
  verified: boolean;
  created_at: string;
}

export interface WardTip {
  id: string;
  tip: string;
  department: string | null;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
