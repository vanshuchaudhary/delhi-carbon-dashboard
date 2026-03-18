'use client';

import { useEffect, useState } from 'react';
import { getLeaderboard, claimReward, type Profile } from '@/lib/api';
import { Trophy, Medal, Star, TreeDeciduous, Users, ChevronRight, Gift, Loader2, Crown, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const { user, isGuest } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  const loadLeaderboard = async () => {
    setLoading(true);
    let data = await getLeaderboard();
    
    // If logged in, ensure current user is in the list
    if (user && !isGuest) {
      const exists = data.find(p => p.id === user.id);
      if (!exists) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (myProfile) {
          data = [...data, { ...myProfile, username: user.email?.split('@')[0] || 'You' }];
        }
      }
    }

    const sortedData = [...data]
      .sort((a, b) => b.weekly_co2_saved - a.weekly_co2_saved)
      .map((p, i) => ({ ...p, current_rank: i + 1 }));

    setProfiles(sortedData);
    setLoading(false);
  };

  const handleClaimReward = async (rewardType: string, cost: number) => {
    setClaiming(rewardType);
    
    // Find 'You' (mock profile ID)
    const currentUser = profiles.find(p => p.username === 'You');
    if (!currentUser) return;

    try {
      const success = await claimReward(currentUser.id, rewardType, cost);
      if (success) {
        // Trigger Confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#fbbf24', '#ffffff']
        });

        // Show Success Toast
        toast.success(`🎉 Reward Claimed!`, {
          description: `Check your email for your ${rewardType}.`,
        });

        // Deduct credits from the user's profile state
        setProfiles(prev => prev.map(p => 
          p.id === currentUser.id 
            ? { ...p, eco_credits: p.eco_credits - cost } 
            : p
        ));
      } else {
        toast.error('Failed to claim reward. Please try again.');
      }
    } catch (e) {
      toast.error('Something went wrong.');
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Calculating Rankings...</p>
        </div>
      </div>
    );
  }

  // Handle Empty State
  if (profiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
        <div className="p-6 bg-slate-900/50 rounded-full border border-slate-800">
           <Trophy className="w-20 h-20 text-slate-700" />
        </div>
        <div className="max-w-md">
           <h2 className="text-2xl font-bold text-slate-100 mb-2">Be the first Eco-Warrior!</h2>
           <p className="text-slate-400 mb-6 font-medium">No carbon saving data found for this week. Start a journey now and claim the top of the leaderboard.</p>
           <Link 
              href="/"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
           >
              <Compass className="w-5 h-5" /> Start a Green Route
           </Link>
        </div>
      </div>
    );
  }

  const top3 = profiles.slice(0, 3);
  const currentUser = profiles.find(p => p.id === user?.id) || profiles.find(p => p.username === 'You');

  return (
    <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto w-full">
      {/* Podium Header */}
      <div className="flex justify-center items-end gap-4 md:gap-12 mt-8 h-72">
        {/* 2nd Place */}
        {top3[1] && (
          <div className="flex flex-col items-center group">
            <div className="relative mb-4">
              <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={top3[1].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[1].username}`} alt={top3[1].username} className="w-20 h-20 rounded-full border-4 border-slate-400 shadow-xl group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -bottom-2 -right-2 bg-slate-400 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-slate-900">2</div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 w-24 h-32 rounded-t-2xl flex flex-col items-center justify-center p-2 shadow-2xl relative">
              <span className="text-[10px] font-black text-slate-400 uppercase truncate w-full text-center">{top3[1].username}</span>
              <span className="text-xs font-mono font-bold text-slate-200 mt-1">{top3[1].weekly_co2_saved}kg</span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <div className="flex flex-col items-center group -mt-12">
            <Crown className="w-10 h-10 text-yellow-500 mb-2 animate-pulse drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            <div className="relative mb-4">
              <img src={top3[0].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[0].username}`} alt={top3[0].username} className="w-28 h-28 rounded-full border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-slate-900 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-slate-900 text-lg">1</div>
            </div>
            <div className="bg-gradient-to-b from-yellow-500/20 to-slate-800/80 backdrop-blur-md border border-yellow-500/30 w-32 h-44 rounded-t-2xl flex flex-col items-center justify-center p-2 shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
              <span className="text-xs font-black text-yellow-500 uppercase truncate w-full text-center">{top3[0].username}</span>
              <span className="text-sm font-mono font-bold text-white mt-1">{top3[0].weekly_co2_saved}kg</span>
              <span className="text-[10px] text-yellow-500/70 font-medium mt-2">WEEKLY CHAMP</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <div className="flex flex-col items-center group">
            <div className="relative mb-4">
              <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={top3[2].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[2].username}`} alt={top3[2].username} className="w-16 h-16 rounded-full border-4 border-amber-700 shadow-xl group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold border-2 border-slate-900">3</div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 w-20 h-24 rounded-t-2xl flex flex-col items-center justify-center p-2 shadow-2xl">
              <span className="text-[10px] font-black text-slate-500 uppercase truncate w-full text-center">{top3[2].username}</span>
              <span className="text-xs font-mono font-bold text-slate-300 mt-1">{top3[2].weekly_co2_saved}kg</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-6 border border-slate-800/50 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" /> Community Rankings
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Real-time stats</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {profiles?.length > 0 && profiles.map((p, i) => (
                <div 
                  key={p.id}
                  className={twMerge(
                    "flex items-center gap-4 p-3 rounded-xl border transition-all duration-300 group",
                    p.id === user?.id || (p.username === 'You' && !user)
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] scale-102" 
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                  )}
                >
                  <div className="w-8 text-sm font-mono font-black text-slate-500 group-hover:text-emerald-400 flex justify-center">
                    {i < 3 ? (
                      <Crown className={twMerge(
                        "w-4 h-4",
                        i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : "text-amber-700"
                      )} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <img src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} alt={p.username} className="w-10 h-10 rounded-full border border-slate-700" />
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-100 truncate flex items-center gap-2">
                      {p.username}
                      {(p.id === user?.id || (p.username === 'You' && !user)) && <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded uppercase font-black">You</span>}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.tier}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-mono font-bold text-emerald-400 tracking-tighter">{p.weekly_co2_saved}kg</span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase text-right">Saved (Week)</span>
                  </div>
                  <div className="flex flex-col items-end w-20">
                    <span className="text-sm font-mono font-bold text-slate-300">{Math.round(p.total_co2_saved / 0.05).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase text-right">Trees Grow</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Rewards & Stats */}
        <div className="flex flex-col gap-6">
          {/* User Stats Card */}
          {currentUser && (
            <div className="glass-panel p-6 border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-6 relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 right-0 p-8 opacity-10 -mr-4 -mt-4">
                <Medal className="w-32 h-32 text-emerald-500 rotate-12" />
              </div>
              
              <div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Profile Status</span>
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative">
                    <img src={currentUser.avatar_url} alt="You" className="w-16 h-16 rounded-full border-2 border-emerald-500" />
                    <div className="absolute -bottom-1 -right-1 bg-slate-950 p-1 rounded-full border border-emerald-500/30">
                       <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-100 uppercase tracking-tighter tracking-widest">Level 12</h2>
                    <p className="text-xs text-emerald-400 font-black uppercase tracking-widest">{currentUser.tier}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-inner flex flex-col items-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Eco Credits</div>
                  <div className="text-xl font-mono font-black text-amber-400 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {currentUser.eco_credits}
                  </div>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-inner flex flex-col items-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Global Rank</div>
                  <div className="text-xl font-mono font-black text-emerald-400">
                     #{currentUser.current_rank}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  <span>To Next Tier</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[75%] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
                </div>
              </div>

              <button
                onClick={() => {
                  const text = `🌍 I've saved ${currentUser.weekly_co2_saved}kg of CO2 this week on DelhiTwin! That's equivalent to growing ${Math.round(currentUser.weekly_co2_saved * 0.05).toLocaleString()} trees. Join the green revolution! #DelhiCarbonDashboard`;
                  navigator.clipboard.writeText(text);
                  toast.success("Impact Summary Copied!", {
                    description: "Share your achievements with the world."
                  });
                }}
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Compass className="w-4 h-4" /> Share Impact
              </button>
            </div>
          )}

          {/* Claim Rewards Card */}
          <div className="glass-panel p-6 border border-slate-800/50 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500" /> Milestone Rewards
            </h3>

            <div className="flex flex-col gap-3">
              {[
                { label: 'Free Metro Day Pass', cost: 500, icon: Medal, id: 'metro_pass' },
                { label: 'O2 Generation Certificate', cost: 1200, icon: TreeDeciduous, id: 'tree_cert' },
                { label: 'Eco-Warrior Digital Asset', cost: 2500, icon: Star, id: 'badge' },
              ].map((reward) => (
                <button
                  key={reward.id}
                  disabled={!currentUser || currentUser.eco_credits < reward.cost || claiming !== null}
                  onClick={() => handleClaimReward(reward.label, reward.cost)}
                  className="flex flex-col p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:bg-slate-700 transition-colors">
                        <reward.icon className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="text-sm font-black text-slate-200 group-hover:text-amber-400 transition-colors uppercase tracking-tight">{reward.label}</span>
                    </div>
                    {claiming === reward.label ? (
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-amber-500 transition-all" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest pl-11">
                    Cost: <span className="text-amber-500">{reward.cost}</span> Credits
                  </div>
                  {currentUser && currentUser.eco_credits < reward.cost && (
                    <div className="text-[8px] text-rose-500 font-black uppercase mt-2 pl-11">Insufficient Credits</div>
                  )}
                </button>
              ))}
            </div>
            
            <p className="text-[10px] text-slate-500 text-center font-medium italic mt-2 font-mono uppercase">
              Credits reset weekly on Sunday at 23:59.
            </p>
          </div>
        </div>
      </div>
      <Toaster position="top-right" richColors closeButton theme="dark" />
    </div>
  );
}
