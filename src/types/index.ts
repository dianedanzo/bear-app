export interface User {
  id: string;
  email: string;
  username: string;
  balance: number;
  total_earned: number;
  ads_watched: number;
  referral_code: string;
  referred_by?: string;
  created_at: string;
}

export interface Task {
  id: string;
  type: 'telegram' | 'ad';
  title: string;
  description: string;
  reward: number;
  channel_url?: string;
  channel_name?: string;
  ad_type?: 'interstitial' | 'rewarded';
  is_completed?: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_user: {
    username: string;
    created_at: string;
  };
  reward_earned: number;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  payment_method: 'dana' | 'gopay';
  payment_address: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}