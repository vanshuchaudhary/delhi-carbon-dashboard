'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Star, Send, Loader2, MessageSquare, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from '@/lib/utils';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  upvotes: number;
  created_at: string;
  // joined from profiles
  username?: string;
  avatar_url?: string;
  tier?: string;
}

/* ─── Star Rating ─────────────────────────────────────────────────────────── */
function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}) {
  const [hovered, setHovered] = useState(0);
  const dim = size === 'sm' ? 'w-4 h-4' : 'w-7 h-7';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={twMerge(
            'transition-all duration-150',
            readonly ? 'cursor-default' : 'hover:scale-125 cursor-pointer',
          )}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
        >
          <Star
            className={twMerge(
              dim,
              'transition-colors',
              (hovered || value) >= i
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-700 fill-slate-700',
            )}
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Tier Badge ──────────────────────────────────────────────────────────── */
const TIER_COLORS: Record<string, string> = {
  'Carbon Phantom':    'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'Forest Guardian':   'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'Eco Warrior':       'bg-teal-500/20 text-teal-300 border-teal-500/40',
  'Green Sentinel':    'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  'Carbon Tracker':    'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

function TierBadge({ tier }: { tier?: string }) {
  if (!tier) return null;
  const cls = TIER_COLORS[tier] ?? 'bg-slate-700/40 text-slate-300 border-slate-600/40';
  return (
    <span className={twMerge('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', cls)}>
      {tier}
    </span>
  );
}

/* ─── Review Card ─────────────────────────────────────────────────────────── */
function ReviewCard({
  review,
  currentUserId,
  onUpvote,
}: {
  review: Review;
  currentUserId?: string;
  onUpvote: (id: string) => void;
}) {
  return (
    <div className="group flex flex-col gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 transition-all duration-300">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <img
          src={review.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_id}`}
          alt={review.username ?? 'Sentinel'}
          className="w-10 h-10 rounded-full border border-slate-700 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-100 truncate">
              {review.username ?? 'Sentinel Agent'}
            </span>
            <TierBadge tier={review.tier} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating value={review.rating} readonly size="sm" />
            <span className="text-[10px] text-slate-600 font-mono">
              {formatDistanceToNow(review.created_at)}
            </span>
          </div>
        </div>

        {/* Upvote */}
        <button
          onClick={() => onUpvote(review.id)}
          className="flex flex-col items-center gap-0.5 group/heart transition-transform hover:scale-110 active:scale-95 ml-auto"
          aria-label="Upvote"
        >
          <Heart className="w-5 h-5 text-rose-400 group-hover/heart:fill-rose-400 transition-colors" />
          <span className="text-[10px] font-black text-rose-400 font-mono">{review.upvotes}</span>
        </button>
      </div>

      {/* Comment */}
      <p className="text-sm text-slate-300 leading-relaxed pl-[52px]">
        {review.comment}
      </p>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function CommunityVoice() {
  const { user, isGuest } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load reviews + join with profiles
  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      setLoadingReviews(false);
      return;
    }

    // Batch-fetch profiles for user_ids
    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, tier')
      .in('id', userIds);

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    const enriched: Review[] = data.map(r => ({
      ...r,
      username: profileMap[r.user_id]?.username ?? r.user_id.slice(0, 8) + '…',
      avatar_url: profileMap[r.user_id]?.avatar_url,
      tier: profileMap[r.user_id]?.tier,
    }));

    setReviews(enriched);
    setLoadingReviews(false);
  }, []);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  // Subscribe to real-time inserts
  useEffect(() => {
    const channel = supabase
      .channel('reviews-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, () => {
        loadReviews();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to leave a review.'); return; }
    if (rating === 0) { toast.error('Please select a star rating.'); return; }
    if (comment.trim().length < 10) { toast.error('Comment must be at least 10 characters.'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      rating,
      comment: comment.trim(),
      upvotes: 0,
    });

    if (error) {
      toast.error('Failed to submit review: ' + error.message);
    } else {
      toast.success('🌱 Review submitted! Thank you, Sentinel.');
      setRating(0);
      setComment('');
    }
    setSubmitting(false);
  };

  const handleUpvote = async (reviewId: string) => {
    // Optimistic update
    setReviews(prev =>
      prev.map(r => r.id === reviewId ? { ...r, upvotes: r.upvotes + 1 } : r)
    );
    const { error } = await supabase.rpc('increment_review_upvotes', { review_id: reviewId });
    if (error) {
      // Roll back
      setReviews(prev =>
        prev.map(r => r.id === reviewId ? { ...r, upvotes: r.upvotes - 1 } : r)
      );
      toast.error('Could not register your upvote.');
    }
  };

  const isLoggedIn = !!user && !isGuest;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Community Voice</h2>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
            Shape Delhi's sustainable future
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Live Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Submit Form ── (2 cols) */}
        <div className="xl:col-span-2">
          <div className="glass-panel p-6 border border-slate-800/60 flex flex-col gap-5 h-full">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Leave Your Assessment
              </h3>
            </div>

            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                  <ShieldCheck className="w-7 h-7 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-300">Sentinel Authentication Required</p>
                  <p className="text-xs text-slate-600 mt-1">Sign in to share your feedback with the community.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Star Rating */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Delhi Sustainability Rating
                  </label>
                  <StarRating value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <span className="text-[10px] text-emerald-400 font-mono animate-in fade-in duration-200">
                      {['', 'Needs urgent action', 'Below expectations', 'Progressing', 'On the right track', 'Excellent progress!'][rating]}
                    </span>
                  )}
                </div>

                {/* Comment */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="review-comment"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]"
                  >
                    Suggestions for Delhi's Future
                  </label>
                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={5}
                    maxLength={1000}
                    placeholder="Share your ideas for a cleaner, greener Delhi…"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 resize-none transition-all duration-200 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-700"
                  />
                  <div className="text-[10px] text-slate-600 font-mono text-right">
                    {comment.length}/1000
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || rating === 0 || comment.trim().length < 10}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black uppercase tracking-widest transition-all duration-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Review</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Review Feed ── (3 cols) */}
        <div className="xl:col-span-3 flex flex-col gap-3">
          {loadingReviews ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest animate-pulse">
                  Loading community voices…
                </p>
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="glass-panel p-12 flex flex-col items-center gap-4 text-center border border-slate-800/40">
              <MessageSquare className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-bold text-slate-500">Be the first to share your assessment!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
              {reviews.map(r => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  currentUserId={user?.id}
                  onUpvote={handleUpvote}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
