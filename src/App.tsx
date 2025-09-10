import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Home, CheckCircle, Users, Wallet, Mail, Lock, User, Play, Copy, Share2, Smartphone, CreditCard, ArrowLeft } from 'lucide-react';
import { telegramWebApp } from './lib/telegram';
import { supabase, isSupabaseAvailable } from './lib/supabase';
import { AdGramService, ADGRAM_CONFIG } from './lib/adgram';
import { Task, User as UserType } from './types';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adGramService] = useState(() => AdGramService.getInstance());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userStats, setUserStats] = useState({
    balance: 0.00,
    totalEarned: 0.00,
    adsWatched: 0,
    referrals: 0
  });

  // Fallback tasks jika Supabase tidak tersedia
  const fallbackTasks = [
    {
      id: '1',
      type: 'telegram' as const,
      title: '🚀 Join Bear App Channel',
      description: 'Join our main Bear App channel for updates and announcements',
      reward: '0.01',
      channel_url: 'https://t.me/bearappxyz',
      channel_name: '@bearappxyz',
      created_at: new Date().toISOString()
    },
    {
      id: '2', 
      type: 'telegram' as const,
      title: '💬 Join Bear App Discussion',
      description: 'Join our Bear App discussion group for community chat',
      reward: '0.01',
      channel_url: 'https://t.me/bearappdiscussion',
      channel_name: '@bearappdiscussion',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      type: 'telegram' as const,
      title: '📢 Join News Bear App', 
      description: 'Stay updated with Bear App latest news and features',
      reward: '0.01',
      channel_url: 'https://t.me/bearappnews',
      channel_name: '@bearappnews',
      created_at: new Date().toISOString()
    }
  ];
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Telegram Web App
        const tgUser = telegramWebApp.getUser();
        let currentUser = null;
        
        if (tgUser) {
          currentUser = {
            id: tgUser.id.toString(),
            email: `${tgUser.id}@telegram.user`,
            username: tgUser.username || tgUser.first_name || 'User',
            balance: 0,
            total_earned: 0,
            ads_watched: 0,
            referral_code: `ref_${tgUser.id}`,
            created_at: new Date().toISOString()
          };
        } else {
          // Fallback for testing outside Telegram
          currentUser = {
            id: '12345',
            email: 'demo@telegram.user',
            username: 'demo_user',
            balance: 0,
            total_earned: 0,
            ads_watched: 0,
            referral_code: 'ref_12345',
            created_at: new Date().toISOString()
          };
        }
        
        setUser(currentUser);
        
        // Load tasks from Supabase dengan fallback
        try {
          if (isSupabaseAvailable()) {
            const { data: tasksData, error } = await supabase
              .from('tasks')
              .select('*')
              .eq('type', 'telegram');
              
            if (!error && tasksData && tasksData.length > 0) {
              setTasks(tasksData);
            } else {
              // Gunakan fallback tasks jika Supabase gagal atau kosong
              console.log('Using fallback tasks - Supabase returned no data');
              setTasks(fallbackTasks);
            }
          } else {
            // Gunakan fallback tasks jika Supabase tidak tersedia
            console.log('Using fallback tasks - Supabase not configured');
            setTasks(fallbackTasks);
          }
        } catch (error) {
          console.error('Error loading tasks from Supabase:', error);
          // Gunakan fallback tasks jika ada error
          setTasks(fallbackTasks);
        }
        
        // Handle start parameter for referrals
        const startParam = telegramWebApp.getStartParam();
        if (startParam && startParam.startsWith('ref_')) {
          console.log('Referral code:', startParam.replace('ref_', ''));
        }
        
        // Initialize AdGram
        try {
          await adGramService.init(ADGRAM_CONFIG.BLOCK_ID_1);
          console.log('AdGram initialized successfully');
        } catch (error) {
          console.error('Failed to initialize AdGram:', error);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    // 1) balance dari server
const bal = await secureGet('/api/balance');
if (bal?.ok) {
  setUserStats(prev => ({ ...prev, balance: Number(bal.balance) || 0 }));
}

// 2) tasks dari server (sudah flag is_completed)
const tl = await secureGet('/api/tasks/list');
if (tl?.ok) setTasks(tl.tasks);
    initializeApp();
  }, []);
  
  const handleTelegramTaskComplete = async (taskId: string, reward: number) => {
  try {
    telegramWebApp.hapticFeedback('success');

    const out = await securePost('/api/tasks/complete', {
      task_id: taskId,
      reward
    });

    if (!out?.ok) throw new Error(out?.error || 'Server error');

    // Refresh dari server biar tidak bisa diakalin
    const [bal, tl] = await Promise.all([
      secureGet('/api/balance'),
      secureGet('/api/tasks/list')
    ]);
    if (bal?.ok) setUserStats(prev => ({ ...prev, balance: Number(bal.balance) || 0 }));
    if (tl?.ok) setTasks(tl.tasks);

    telegramWebApp.showAlert(`Task completed! +$${reward.toFixed(2)} earned!`);
  } catch (e:any) {
    telegramWebApp.showAlert(e.message || 'Error completing task');
  }
};
      
      // Update local stats (selalu berhasil)
      setUserStats(prev => ({
        ...prev,
        balance: prev.balance + reward,
        totalEarned: prev.totalEarned + reward
      }));
      
      // Mark task as completed locally
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, is_completed: true }
          : task
      ));
      
      telegramWebApp.showAlert(`Task completed! +$${reward.toFixed(2)} earned!`);
    } catch (error) {
      console.error('Error completing telegram task:', error);
      telegramWebApp.showAlert('Error completing task. Please try again.');
    }
  };
  
  const handleAdTaskComplete = async (reward: number, blockId: string) => {
    try {
      // Show AdGram ad first
      const adResult = await adGramService.showAd(blockId);
      
      if (!adResult.success) {
        telegramWebApp.showAlert(`Failed to show ad: ${adResult.error || 'Unknown error'}`);
        return;
      }
      
      telegramWebApp.hapticFeedback('success');
      
      // Coba simpan ke Supabase dulu
      try {
        if (user && isSupabaseAvailable()) {
          supabase.rpc('complete_ad_task', {
            user_id: user.id,
            reward_amount: reward
          }).then(({ error }) => {
            if (error) {
              console.error('Supabase error:', error);
            }
          });
        }
      } catch (supabaseError) {
        console.error('Failed to save to Supabase:', supabaseError);
      }
      
      // Update local stats (selalu berhasil)
      setUserStats(prev => ({
        ...prev,
        balance: prev.balance + reward,
        totalEarned: prev.totalEarned + reward,
        adsWatched: prev.adsWatched + 1
      }));
      
      telegramWebApp.showAlert(`Ad completed! +$${reward.toFixed(2)} earned!`);
    } catch (error) {
      console.error('Error completing ad task:', error);
      telegramWebApp.showAlert('Error completing task. Please try again.');
    }
  };

  const navigateTo = (page) => {
    telegramWebApp.hapticFeedback('selection');
    setCurrentPage(page);
    
    if (page !== 'home') {
      telegramWebApp.showBackButton(() => {
        setCurrentPage('home');
        telegramWebApp.hideBackButton();
      });
    } else {
      telegramWebApp.hideBackButton();
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Bear App</h1>
          <p className="text-white/70">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Navigation component for Telegram Mini App
  const TelegramNavbar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 shadow-xl z-50">
      <div className="flex justify-around items-center py-3 px-4">
        {[
          { page: 'home', icon: Home, label: 'Home' },
          { page: 'tasks', icon: CheckCircle, label: 'Tasks' },
          { page: 'referrals', icon: Users, label: 'Referrals' },
          { page: 'withdraw', icon: Wallet, label: 'Withdraw' }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;

          return (
            <button
              key={item.page}
              onClick={() => navigateTo(item.page)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Home Page
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome {user?.username}! 🚀
          </h1>
          <p className="text-lg text-white/70">
            Earn money by watching ads!
          </p>
        </motion.div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
          >
            <div className="text-center">
              <p className="text-white/70 text-sm">Balance</p>
              <p className="text-2xl font-bold text-white">${userStats.balance.toFixed(2)}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
          >
            <div className="text-center">
              <p className="text-white/70 text-sm">Ads Watched</p>
              <p className="text-2xl font-bold text-white">{userStats.adsWatched}</p>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateTo('tasks')}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg"
          >
            📺 Watch Ads
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateTo('referrals')}
            className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg"
          >
            👥 Invite Friends
          </motion.button>
        </div>

        {/* Telegram Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            📱 Telegram Tasks
          </h2>
          
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">{task.title}</h3>
                    <p className="text-white/50 text-xs">{task.channel_name}</p>
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                      +${parseFloat(task.reward).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    {task.is_completed ? (
                      <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-medium text-center">
                        ✅ Completed
                      </div>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => telegramWebApp.openTelegramLink(task.channel_url)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium"
                        >
                          Join
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTelegramTaskComplete(task.id, parseFloat(task.reward))}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium"
                        >
                          Claim
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Tasks Page
  const TasksPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-20">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            📺 Watch Ads & Earn!
          </h1>
          <p className="text-lg text-white/70">
            Complete ad tasks and boost earnings
          </p>
        </motion.div>

        {/* Ad Tasks */}
        <div className="space-y-4 mb-8">
          {[
            { title: '🎬 Interstitial Ad', reward: 0.003, description: 'Watch full ad', blockId: ADGRAM_CONFIG.BLOCK_ID_1 },
            { title: '🏆 Rewarded Ad', reward: 0.003, description: 'Watch video ad', blockId: ADGRAM_CONFIG.BLOCK_ID_2 },
            { title: '⭐ Premium Ad', reward: 0.003, description: 'Premium content', blockId: ADGRAM_CONFIG.BLOCK_ID_3 }
          ].map((task, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="text-white" size={24} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{task.title}</h3>
                <p className="text-white/70 text-sm mb-4">{task.description}</p>
                
                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-lg font-bold mb-4 inline-block">
                  +${task.reward.toFixed(3)}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAdTaskComplete(task.reward, task.blockId)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
                >
                  Watch Ad
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            📊 Your Stats
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
              <p className="text-white/70 text-sm">Ads Watched</p>
              <p className="text-2xl font-bold text-white">{userStats.adsWatched}</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
              <p className="text-white/70 text-sm">Total Earned</p>
              <p className="text-2xl font-bold text-white">${userStats.totalEarned.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // --- ganti seluruh fungsi ReferralsPage dengan ini ---
const ReferralsPage = () => {
  // --- di ReferralsPage() ---
const botUsername = 'bearapp_bot';
const referralLink = `https://t.me/${botUsername}?start=ref_${user?.id || '12345'}`;

const shareReferralLink = async () => {
  telegramWebApp.hapticFeedback('medium');

  const message =
    `🚀 Join Bear App dan mulai earning!\n\n` +
    `🔗 Referral saya: ${referralLink}`;

  if (telegramWebApp.isInTelegram()) {
    // KIRIM HANYA TEKS — TIDAK ADA url=
    telegramWebApp.openTelegramLink(
      `https://t.me/share/url?text=${encodeURIComponent(message)}`
    );
    return;
  }

  // Di browser biasa: share API -> fallback copy
  if (navigator.share) {
    try {
      await navigator.share({ text: message });
      return;
    } catch { /* fallback ke copy */ }
  }

  try {
    await navigator.clipboard.writeText(message);
    telegramWebApp.showAlert('Referral text copied!');
  } catch {
    telegramWebApp.showAlert(message); // tampilkan agar bisa long-press copy
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-20">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            👥 Referral Program
          </h1>
          <p className="text-lg text-white/70">
            Earn 10% from friends forever!
          </p>
        </motion.div>

        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center"
          >
            <p className="text-white/70 text-sm">Referrals</p>
            <p className="text-2xl font-bold text-white">{userStats.referrals}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center"
          >
            <p className="text-white/70 text-sm">Commission</p>
            <p className="text-2xl font-bold text-white">10%</p>
          </motion.div>
        </div>

        {/* Share Button (tetap sama tampilannya, cuma aksi diganti) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            🚀 Invite Friends
          </h2>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareReferralLink}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center space-x-2"
          >
            <Share2 size={20} />
            <span>Share Referral Link</span>
          </motion.button>

          <div className="mt-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
            <h3 className="text-yellow-400 font-bold mb-2 text-center">🎉 How It Works</h3>
            <div className="space-y-2 text-center text-sm text-white/80">
              <p>1. Share your referral link</p>
              <p>2. Friends join and earn money</p>
              <p>3. You get 10% commission forever!</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
// --- akhir pengganti ReferralsPage ---

  // Withdraw Page
  const WithdrawPage = () => {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('dana');
    const [paymentAddress, setPaymentAddress] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      const withdrawAmount = parseFloat(amount);
      
      if (withdrawAmount < 0.2) {
        telegramWebApp.showAlert('Minimum withdrawal amount is $0.20');
        return;
      }
      
      if (withdrawAmount > userStats.balance) {
        telegramWebApp.showAlert('Insufficient balance');
        return;
      }

      const confirmed = await telegramWebApp.showConfirm(`Withdraw $${withdrawAmount.toFixed(2)} to your ${paymentMethod.toUpperCase()} account?`);
      
      if (confirmed) {
        setUserStats(prev => ({
          ...prev,
          balance: prev.balance - withdrawAmount
        }));
        
        telegramWebApp.hapticFeedback('success');
        telegramWebApp.showAlert('Withdrawal request submitted successfully!');
        setAmount('');
        setPaymentAddress('');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-20">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              💰 Withdraw Earnings
            </h1>
            <p className="text-lg text-white/70">
              Cash out to your payment method
            </p>
          </motion.div>

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8 text-center"
          >
            <p className="text-white/70 text-lg mb-2">Available Balance</p>
            <p className="text-3xl font-bold text-white mb-2">
              ${userStats.balance.toFixed(2)}
            </p>
            <p className="text-white/60 text-sm">
              Minimum withdrawal: $0.20
            </p>
          </motion.div>

          {/* Withdrawal Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.20"
                    max={userStats.balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-4">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      telegramWebApp.hapticFeedback('selection');
                      setPaymentMethod('dana');
                    }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      paymentMethod === 'dana'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-white/5 border-white/20 text-white/70'
                    }`}
                  >
                    <Smartphone className="mx-auto mb-2" size={24} />
                    <div className="font-semibold">Dana</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      telegramWebApp.hapticFeedback('selection');
                      setPaymentMethod('gopay');
                    }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      paymentMethod === 'gopay'
                        ? 'bg-green-600/20 border-green-500 text-white'
                        : 'bg-white/5 border-white/20 text-white/70'
                    }`}
                  >
                    <CreditCard className="mx-auto mb-2" size={24} />
                    <div className="font-semibold">GoPay</div>
                  </button>
                </div>
              </div>

              {/* Payment Address/Phone */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  {paymentMethod === 'dana' ? 'Dana Phone Number' : 'GoPay Phone Number'}
                </label>
                <input
                  type="text"
                  value={paymentAddress}
                  onChange={(e) => setPaymentAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="+62 812-3456-7890"
                  required
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!amount || parseFloat(amount) < 0.2}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw ${amount || '0.00'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  };

  // Main render logic
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <main>
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'tasks' && <TasksPage />}
          {currentPage === 'referrals' && <ReferralsPage />}
          {currentPage === 'withdraw' && <WithdrawPage />}
        </main>
        <TelegramNavbar />
      </div>
    </>
  );
};

export default App;
