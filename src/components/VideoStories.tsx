'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Play, X, Upload, Loader2, Video, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface VideoStory {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string;
  caption?: string;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

/* ─── Story Bubble ───────────────────────────────────────────────────────── */
function StoryBubble({
  story,
  onClick,
}: {
  story: VideoStory;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 flex-shrink-0"
      aria-label={`Watch ${story.username ?? 'Sentinel'}'s story`}
    >
      {/* Circular bubble with gradient ring */}
      <div className="relative p-[2px] rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-emerald-600 shadow-[0_0_20px_rgba(52,211,153,0.3)] group-hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] transition-all duration-300 group-hover:scale-105">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-900 border-2 border-slate-950">
          {story.thumbnail_url ? (
            <img
              src={story.thumbnail_url}
              alt={story.username ?? 'Story'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <img
                src={story.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user_id}`}
                alt={story.username ?? 'Sentinel'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
            <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 fill-white transition-opacity duration-200 drop-shadow-lg" />
          </div>
        </div>
      </div>
      {/* Name */}
      <span className="text-[10px] font-bold text-slate-300 truncate max-w-[72px] sm:max-w-[80px]">
        {story.username ?? 'Sentinel'}
      </span>
    </button>
  );
}

/* ─── Video Modal ─────────────────────────────────────────────────────────── */
function VideoModal({
  story,
  onClose,
}: {
  story: VideoStory;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  useEffect(() => {
    videoRef.current?.play();
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Video */}
        <div className="relative w-full aspect-[9/16] bg-slate-950">
          {/* Loading skeleton */}
          {isVideoLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 z-10">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest animate-pulse">Loading Story…</p>
            </div>
          )}
          <video
            ref={videoRef}
            src={story.video_url}
            controls
            playsInline
            loop
            onLoadStart={() => setIsVideoLoading(true)}
            onCanPlay={() => { setIsVideoLoading(false); videoRef.current?.play(); }}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent">
          <img
            src={story.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user_id}`}
            alt={story.username ?? 'Sentinel'}
            className="w-8 h-8 rounded-full border border-slate-600"
          />
          <span className="text-sm font-bold text-white">{story.username ?? 'Sentinel Agent'}</span>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm text-white leading-relaxed">{story.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Upload Button ───────────────────────────────────────────────────────── */
function UploadBubble({ onUpload, uploading }: { onUpload: () => void; uploading: boolean }) {
  return (
    <button
      onClick={onUpload}
      disabled={uploading}
      className="group flex flex-col items-center gap-2 flex-shrink-0"
      aria-label="Upload your story"
    >
      <div className="relative p-[2px] rounded-full bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-emerald-500/50 group-hover:to-emerald-600/50 transition-all duration-300 group-hover:scale-105">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-slate-900 border-2 border-slate-950 border-dashed border-slate-700">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          ) : (
            <Plus className="w-7 h-7 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          )}
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-400 transition-colors">
        {uploading ? 'Uploading…' : 'Add Story'}
      </span>
    </button>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function VideoStories() {
  const { user, isGuest } = useAuth();
  const [stories, setStories] = useState<VideoStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeStory, setActiveStory] = useState<VideoStory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('video_stories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    setStories(data.map(s => ({
      ...s,
      username: profileMap[s.user_id]?.username ?? s.user_id.slice(0, 8) + '…',
      avatar_url: profileMap[s.user_id]?.avatar_url,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { loadStories(); }, [loadStories]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be under 50 MB.');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('user-videos')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-videos')
      .getPublicUrl(path);

    // Prompt for caption
    const caption = window.prompt('Add a caption for your story (optional):', '') ?? '';

    const { error: dbError } = await supabase.from('video_stories').insert({
      user_id: user.id,
      video_url: publicUrl,
      caption: caption.slice(0, 200),
    });

    if (dbError) {
      toast.error('Failed to save story: ' + dbError.message);
    } else {
      toast.success('🎬 Story uploaded! Your community can now watch it.');
      await loadStories();
    }

    setUploading(false);
    // Reset input
    e.target.value = '';
  };

  const isLoggedIn = !!user && !isGuest;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
          <Video className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Video Stories</h2>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
            Share how you're protecting Delhi
          </p>
        </div>
        {isLoggedIn && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 active:scale-95"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading…' : 'Upload Story'}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Story bubbles */}
      <div className="glass-panel p-5 border border-slate-800/60">
        {loading ? (
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-slate-800 animate-pulse" />
                <div className="w-12 h-2 rounded-full bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {/* Upload bubble (first in row, only for logged-in users) */}
            {isLoggedIn && (
              <UploadBubble
                onUpload={() => fileInputRef.current?.click()}
                uploading={uploading}
              />
            )}

            {stories.length === 0 && !isLoggedIn && (
              <div className="flex flex-col items-center gap-3 py-8 w-full text-center">
                <Video className="w-10 h-10 text-slate-700" />
                <p className="text-sm text-slate-600 font-medium">No stories yet. Be the first to share!</p>
              </div>
            )}

            {stories.map(story => (
              <StoryBubble
                key={story.id}
                story={story}
                onClick={() => setActiveStory(story)}
              />
            ))}
          </div>
        )}

        {!isLoggedIn && stories.length >= 0 && (
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest text-center mt-3">
            Sign in to upload your own story
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { emoji: '🌱', label: 'Show your green commute', desc: 'Metro, cycling, walking — every choice counts' },
          { emoji: '📊', label: 'Carbon Guard experience', desc: 'How did emissions alerts change your day?' },
          { emoji: '🏙️', label: "Delhi's green spaces", desc: 'Share parks, gardens, and sustainable spots' },
        ].map(tip => (
          <div key={tip.label} className="flex gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <span className="text-2xl flex-shrink-0">{tip.emoji}</span>
            <div>
              <p className="text-xs font-bold text-slate-300">{tip.label}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {activeStory && (
        <VideoModal story={activeStory} onClose={() => setActiveStory(null)} />
      )}
    </div>
  );
}
