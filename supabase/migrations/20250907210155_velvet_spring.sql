/*
  # Initial Schema for Ad2Earn Application

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - References auth.users
      - `email` (text, unique)
      - `username` (text, unique)
      - `balance` (decimal) - Current balance
      - `total_earned` (decimal) - Total lifetime earnings
      - `ads_watched` (integer) - Number of ads watched
      - `referral_code` (text, unique) - User's referral code
      - `referred_by` (uuid) - References users.id for referrer
      - `created_at` (timestamp)

    - `tasks`
      - `id` (uuid, primary key)
      - `type` (text) - 'telegram' or 'ad'
      - `title` (text) - Task title
      - `description` (text) - Task description
      - `reward` (decimal) - Reward amount
      - `channel_url` (text) - For telegram tasks
      - `channel_name` (text) - For telegram tasks
      - `ad_type` (text) - For ad tasks: 'interstitial' or 'rewarded'
      - `created_at` (timestamp)

    - `user_tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References users.id
      - `task_id` (uuid) - References tasks.id
      - `completed_at` (timestamp)
      - Unique constraint on user_id, task_id

    - `referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid) - References users.id
      - `referred_id` (uuid) - References users.id
      - `reward_earned` (decimal) - Commission earned
      - `created_at` (timestamp)

    - `withdrawals`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References users.id
      - `amount` (decimal) - Withdrawal amount
      - `payment_method` (text) - 'dana' or 'gopay'
      - `payment_address` (text) - Payment details
      - `status` (text) - 'pending', 'completed', 'failed'
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for reading public task information

  3. Functions
    - Function to handle user creation with referral
    - Function to complete telegram tasks
    - Function to complete ad tasks  
    - Function to create withdrawal requests
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  balance decimal(10,2) DEFAULT 0.00,
  total_earned decimal(10,2) DEFAULT 0.00,
  ads_watched integer DEFAULT 0,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('telegram', 'ad')),
  title text NOT NULL,
  description text NOT NULL,
  reward decimal(10,2) NOT NULL DEFAULT 0.00,
  channel_url text,
  channel_name text,
  ad_type text CHECK (ad_type IN ('interstitial', 'rewarded')),
  created_at timestamptz DEFAULT now()
);

-- User tasks (completed tasks tracking)
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_earned decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Withdrawals table  
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('dana', 'gopay')),
  payment_address text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Tasks policies (public read)
CREATE POLICY "Anyone can read tasks" ON tasks
  FOR SELECT TO authenticated
  USING (true);

-- User tasks policies
CREATE POLICY "Users can read own completed tasks" ON user_tasks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task completions" ON user_tasks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" ON referrals
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Withdrawals policies
CREATE POLICY "Users can read own withdrawals" ON withdrawals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawals" ON withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Functions

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text), 1, 8));
    SELECT count(*) > 0 INTO exists FROM users WHERE referral_code = code;
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Function to handle user creation with referral
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ref_code text;
  referrer_id uuid;
BEGIN
  -- Generate unique referral code
  ref_code := generate_referral_code();
  
  -- Check for referral code in URL params (you'll handle this in your app)
  -- For now, we'll just create the user
  INSERT INTO users (
    id,
    email,
    username,
    referral_code,
    referred_by
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    ref_code,
    NULL
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to complete telegram task
CREATE OR REPLACE FUNCTION complete_telegram_task(
  task_id uuid,
  user_id uuid,
  reward_amount decimal
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if task already completed
  IF EXISTS (SELECT 1 FROM user_tasks WHERE user_tasks.user_id = complete_telegram_task.user_id AND user_tasks.task_id = complete_telegram_task.task_id) THEN
    RAISE EXCEPTION 'Task already completed';
  END IF;
  
  -- Insert completed task
  INSERT INTO user_tasks (user_id, task_id) VALUES (complete_telegram_task.user_id, complete_telegram_task.task_id);
  
  -- Update user balance and total earned
  UPDATE users SET 
    balance = balance + reward_amount,
    total_earned = total_earned + reward_amount
  WHERE id = complete_telegram_task.user_id;
  
  -- Handle referral bonus (20% to referrer)
  UPDATE users SET 
    balance = balance + (reward_amount * 0.20),
    total_earned = total_earned + (reward_amount * 0.20)
  WHERE id = (SELECT referred_by FROM users WHERE id = complete_telegram_task.user_id)
  AND (SELECT referred_by FROM users WHERE id = complete_telegram_task.user_id) IS NOT NULL;
  
  -- Log referral earnings
  INSERT INTO referrals (referrer_id, referred_id, reward_earned)
  SELECT referred_by, complete_telegram_task.user_id, reward_amount * 0.20
  FROM users 
  WHERE id = complete_telegram_task.user_id AND referred_by IS NOT NULL
  ON CONFLICT (referrer_id, referred_id) 
  DO UPDATE SET reward_earned = referrals.reward_earned + EXCLUDED.reward_earned;
END;
$$;

-- Function to complete ad task
CREATE OR REPLACE FUNCTION complete_ad_task(
  user_id uuid,
  reward_amount decimal
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user balance, total earned, and ads watched
  UPDATE users SET 
    balance = balance + reward_amount,
    total_earned = total_earned + reward_amount,
    ads_watched = ads_watched + 1
  WHERE id = complete_ad_task.user_id;
  
  -- Handle referral bonus (20% to referrer)
  UPDATE users SET 
    balance = balance + (reward_amount * 0.20),
    total_earned = total_earned + (reward_amount * 0.20)
  WHERE id = (SELECT referred_by FROM users WHERE id = complete_ad_task.user_id)
  AND (SELECT referred_by FROM users WHERE id = complete_ad_task.user_id) IS NOT NULL;
  
  -- Log referral earnings
  INSERT INTO referrals (referrer_id, referred_id, reward_earned)
  SELECT referred_by, complete_ad_task.user_id, reward_amount * 0.20
  FROM users 
  WHERE id = complete_ad_task.user_id AND referred_by IS NOT NULL
  ON CONFLICT (referrer_id, referred_id) 
  DO UPDATE SET reward_earned = referrals.reward_earned + EXCLUDED.reward_earned;
END;
$$;

-- Function to create withdrawal request
CREATE OR REPLACE FUNCTION create_withdrawal_request(
  user_id uuid,
  withdraw_amount decimal,
  payment_method text,
  payment_address text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance decimal;
BEGIN
  -- Check user balance
  SELECT balance INTO current_balance FROM users WHERE id = create_withdrawal_request.user_id;
  
  IF current_balance < withdraw_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Create withdrawal request
  INSERT INTO withdrawals (user_id, amount, payment_method, payment_address)
  VALUES (create_withdrawal_request.user_id, withdraw_amount, create_withdrawal_request.payment_method, create_withdrawal_request.payment_address);
  
  -- Deduct from user balance
  UPDATE users SET balance = balance - withdraw_amount WHERE id = create_withdrawal_request.user_id;
END;
$$;

-- Insert some sample telegram tasks
INSERT INTO tasks (type, title, description, reward, channel_url, channel_name) VALUES
('telegram', '🚀 Join Our Main Channel', 'Join our official Telegram channel for updates and announcements', 0.10, 'https://t.me/yourmainechannel', '@yourmainechannel'),
('telegram', '💬 Join Discussion Group', 'Join our community discussion group', 0.08, 'https://t.me/yourdiscussiongroup', '@yourdiscussiongroup'),
('telegram', '📢 Join News Channel', 'Stay updated with our latest news and features', 0.05, 'https://t.me/yournewschannel', '@yournewschannel');