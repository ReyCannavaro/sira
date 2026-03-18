export type HeroClass = "logic_warrior" | "web_mage" | "data_ranger";
export type LearningPath = "web_dev" | "machine_learning" | "computer_science";
export type Language = "javascript" | "python";
export type Difficulty = "easy" | "normal" | "hard" | "expert";
export type AttemptStatus =
  | "syntax_error"
  | "logic_error"
  | "passed_dirty"
  | "passed_clean";

export type BadgeCategory = "technical" | "behavioral" | "community";
export type BadgeRarity = "common" | "rare" | "epic" | "legendary";
export type CommunityType = "squad" | "school";
export type MemberRole = "leader" | "member";

export interface Profile {
  id:           string;
  username:     string;
  display_name: string;
  avatar_url:   string | null;
  hero_class:   HeroClass | null;
  bio:          string | null;
  is_public:    boolean;
  created_at:   string;
  updated_at:   string;
}

export interface UserStats {
  user_id:          string;
  total_exp:        number;
  current_level:    number;
  weekly_exp:       number;
  quests_completed: number;
  str_score:        number;
  int_score:        number;
  agi_score:        number;
  current_streak:   number;
  longest_streak:   number;
  last_active_date: string | null;
  hints_used_total: number;
  clean_code_avg:   number;
}

export interface UserWithStats extends Profile {
  user_stats: UserStats | null;
}

export interface Region {
  id:            string;
  slug:          string;
  name:          string;
  description:   string | null;
  learning_path: LearningPath;
  accent_color:  string;
  order_index:   number;
  exp_reward:    number;
  badge_id:      string | null;
  is_active:     boolean;
}

export interface RegionWithProgress extends Region {
  total_quests:     number;
  completed_quests: number;
  completion_pct:   number;
  is_unlocked:      boolean;
}

export interface TestCase {
  input:           string;
  expected_output: string;
}

export interface Hint {
  level: 1 | 2;
  text:  string;
}

export interface Quest {
  id:                     string;
  region_id:              string;
  slug:                   string;
  title:                  string;
  story_intro:            string | null;
  instructions:           string;
  language:               Language;
  starter_code:           string | null;
  expected_output:        string;
  test_cases:             TestCase[];
  hints:                  Hint[];
  difficulty:             Difficulty;
  exp_reward:             number;
  order_index:            number;
  prerequisite_quest_id:  string | null;
  is_active:              boolean;
}

export type QuestNodeStatus = "locked" | "active" | "completed";

export interface QuestMapData {
  id:           string;
  slug:         string;
  title:        string;
  difficulty:   Difficulty;
  exp_reward:   number;
  status:       QuestNodeStatus;
  order_index:  number;
}

export interface QuestAttempt {
  id:                   string;
  user_id:              string;
  quest_id:             string;
  submitted_code:       string;
  status:               AttemptStatus;
  correctness_score:    number | null;
  efficiency_score:     number | null;
  speed_score:          number | null;
  final_score:          number | null;
  exp_earned:           number;
  hints_used_count:     number;
  is_first_pass:        boolean;
  execution_output:     string | null;
  socratic_feedback:    string | null;
  attempt_duration_sec: number | null;
  created_at:           string;
}

export interface Badge {
  id:             string;
  slug:           string;
  name:           string;
  description:    string;
  category:       BadgeCategory;
  rarity:         BadgeRarity;
  icon_url:       string | null;
  trigger_type:   string;
  trigger_config: Record<string, unknown> | null;
}

export interface UserBadge {
  id:          string;
  user_id:     string;
  badge_id:    string;
  earned_at:   string;
  is_featured: boolean;
  badge?:      Badge;
}

export interface Community {
  id:               string;
  owner_id:         string;
  name:             string;
  description:      string | null;
  type:             CommunityType;
  invite_code:      string;
  is_public:        boolean;
  focus_topic:      string | null;
  member_count:     number;
  weekly_exp_total: number;
  squad_war_rank:   number | null;
  created_at:       string;
}

export interface CommunityMember {
  id:                      string;
  community_id:            string;
  user_id:                 string;
  role:                    MemberRole;
  joined_at:               string;
  weekly_exp_contribution: number;
}

export interface MemberWithStats extends CommunityMember {
  profile: Pick<Profile, "username" | "display_name" | "avatar_url">;
  stats:   Pick<UserStats, "current_level" | "total_exp" | "weekly_exp" | "quests_completed">;
  latest_badge:    Badge | null;
  last_active_date: string | null;
  status:          "active" | "inactive";
}

export interface Streak {
  id:            string;
  user_id:       string;
  activity_date: string;
  quests_done:   number;
  exp_earned:    number;
}

export interface QuestSubmitRequest {
  code:             string;
  hints_used_count: number;
  duration_sec:     number;
}

export interface QuestSubmitResponse {
  success:         boolean;
  attempt_id:      string;
  exp_earned:      number;
  bonus_breakdown: {
    base:             number;
    clean_code_bonus: number;
    multiplier:       number;
  };
  new_total_exp:      number;
  new_level:          number;
  level_up:           boolean;
  unlocked_perks:     string[];
  new_badges:         Badge[];
  is_region_complete: boolean;
  error:              string | null;
}

export interface CreateCommunityRequest {
  name:         string;
  type:         CommunityType;
  description?: string;
  is_public?:   boolean;
  focus_topic?: string;
}