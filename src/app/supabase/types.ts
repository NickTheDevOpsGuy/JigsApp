/**
 * Supabase generated types: Database, Json (tables: player_stats, etc.).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      player_stats: {
        Row: {
          id: string;
          user_id: string;
          puzzles_completed: number;
          total_play_time_seconds: number;
          daily_streak: number;
          best_daily_streak: number;
          last_played_at: string;
          created_at: string;
          updated_at: string;
          xp?: number;
          level?: number;
          prestige_count?: number;
          challenge_wins?: number;
          mastery_streak?: number;
          best_mastery_streak?: number;
          mastery_last_date?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          puzzles_completed?: number;
          total_play_time_seconds?: number;
          daily_streak?: number;
          best_daily_streak?: number;
          last_played_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          puzzles_completed?: number;
          total_play_time_seconds?: number;
          daily_streak?: number;
          best_daily_streak?: number;
          last_played_at?: string;
          created_at?: string;
          updated_at?: string;
          xp?: number;
          level?: number;
          prestige_count?: number;
          challenge_wins?: number;
          mastery_streak?: number;
          best_mastery_streak?: number;
          mastery_last_date?: string;
        };
      };
      completions: {
        Row: {
          id: string;
          user_id: string;
          puzzle_date: string;
          elapsed_seconds: number;
          grid_rows: number;
          grid_cols: number;
          is_daily: boolean;
          created_at: string;
          cut_type?: string;
          is_mastery?: boolean;
          visual_modifier?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          puzzle_date: string;
          elapsed_seconds: number;
          grid_rows: number;
          grid_cols: number;
          is_daily: boolean;
          created_at?: string;
          cut_type?: string;
          is_mastery?: boolean;
          visual_modifier?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          puzzle_date: string;
          elapsed_seconds: number;
          grid_rows: number;
          grid_cols: number;
          is_daily: boolean;
          created_at: string;
          is_mastery: boolean;
          visual_modifier: string;
        }>;
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        }>;
      };
    };
  };
}

export type PlayerStats = Database["public"]["Tables"]["player_stats"]["Row"];
export type Completion = Database["public"]["Tables"]["completions"]["Row"];
export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];
