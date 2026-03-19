'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Send, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
}

interface WardReviewFormProps {
  wardName: string;
}

export default function WardReviewForm({ wardName }: WardReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [wardName]);

  const fetchReviews = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('ward_reviews')
        .select('*')
        .eq('ward_name', wardName)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to leave a review.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('ward_reviews').insert({
        user_id: user.id,
        ward_name: wardName,
        rating,
        comment
      });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="w-3 h-3 text-emerald-400" />
            Leave a Ward Review
          </h4>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your feedback on this area..."
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 min-h-[80px] transition-all"
        />

        <button
          type="submit"
          disabled={loading || !comment.trim()}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Send className="w-3 h-3" />
              Submit Review
            </>
          )}
        </button>
      </form>

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Recent Feedback
          </h4>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            {reviews.length} total
          </span>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-8 opacity-50">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
              <span className="text-[10px] uppercase tracking-tighter text-slate-400">Loading Community Pulse...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-500 italic">No reviews yet for {wardName}. Be the first!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={review.id}
                className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl space-y-2 hover:border-slate-700/80 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-2.5 h-2.5 ${
                          s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-3 italic">
                  "{review.comment}"
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                   <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-emerald-400">QS</span>
                   </div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Verified Sentinel</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
