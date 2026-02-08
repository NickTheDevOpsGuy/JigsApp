-- Player profiles: display name and leaderboard preferences
CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Puzzler',
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT true,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);

ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON player_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read profiles for leaderboards" ON player_profiles
  FOR SELECT USING (true);
