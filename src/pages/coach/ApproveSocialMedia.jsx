import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getPendingSocialPosts,
  getCoachDashboard,
  approveSocialMediaPost,
  rejectSocialMediaPost
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Share2, CheckCircle2, XCircle, ExternalLink, AlertCircle, Filter, Clock } from 'lucide-react';

export default function ApproveSocialMedia() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('pending'); // 'pending' | 'reviewed' | 'all'
  const [scores, setScores] = useState({}); // { [postID]: 5 }
  const [feedbacks, setFeedbacks] = useState({}); // { [postID]: 'Well done' }
  const [actionInProgress, setActionInProgress] = useState(null);
  const [notice, setNotice] = useState(null);

  const getPlatformBadgeStyle = (platform) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('linkedin')) return 'bg-sky-50 text-[#0077b5] border-sky-200';
    if (p.includes('twitter')) return 'bg-blue-50 text-blue-500 border-blue-200';
    if (p.includes('medium')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (p.includes('instagram')) return 'bg-pink-50 text-pink-700 border-pink-200';
    if (p.includes('facebook')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const [socialRes, dashRes] = await Promise.all([
          getPendingSocialPosts().catch(() => null),
          getCoachDashboard().catch(() => null)
        ]);

        let list = [];
        if (socialRes && socialRes.success !== false) {
          const parsed = Array.isArray(socialRes)
            ? socialRes
            : (socialRes.data || socialRes.posts || []);
          if (Array.isArray(parsed)) list = [...parsed];
        }

        // Fallback to coach dashboard if dedicated social endpoint returned empty or was not deployed
        if (list.length === 0 && dashRes && dashRes.success !== false) {
          const payload = dashRes.data || dashRes;
          const postsList = payload.socialPosts || payload.pendingPosts || [];
          if (Array.isArray(postsList)) list = [...postsList];
        }

        // Always merge locally queued social media submissions
        try {
          const localPosts = JSON.parse(localStorage.getItem('tsdp_social_media_submissions') || '[]');
          localPosts.forEach(lp => {
            if (!list.some(p => p.postID === lp.postID || (p.postUrl && p.postUrl === lp.postUrl))) {
              list.unshift(lp);
            }
          });
        } catch (e) {
          console.warn('Could not read cached social posts', e);
        }

        setPosts(list);
        const initialScores = {};
        const initialFeedbacks = {};
        list.forEach(p => {
          initialScores[p.postID] = p.score ?? 5;
          initialFeedbacks[p.postID] = p.feedback || '';
        });
        setScores(initialScores);
        setFeedbacks(initialFeedbacks);
      } catch (err) {
        console.error('Error loading social posts:', err);
        try {
          const localPosts = JSON.parse(localStorage.getItem('tsdp_social_media_submissions') || '[]');
          setPosts(localPosts);
          const initialScores = {};
          const initialFeedbacks = {};
          localPosts.forEach(p => {
            initialScores[p.postID] = p.score ?? 5;
            initialFeedbacks[p.postID] = p.feedback || '';
          });
          setScores(initialScores);
          setFeedbacks(initialFeedbacks);
        } catch (e) {}
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const handleAction = async (post, isApproved) => {
    setNotice(null);
    const scoreVal = isApproved ? (scores[post.postID] ?? 5) : 0;
    const feedbackVal = feedbacks[post.postID] || (isApproved ? 'Approved' : 'Post link invalid or does not meet hashtag criteria.');

    setActionInProgress(post.postID);
    try {
      const coachID = user?.coachID || user?.id || '';
      const res = isApproved
        ? await approveSocialMediaPost(post.postID, Number(scoreVal), feedbackVal, coachID)
        : await rejectSocialMediaPost(post.postID, feedbackVal, coachID);

      // Update local storage cache if post was queued locally
      try {
        const raw = localStorage.getItem('tsdp_social_media_submissions');
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map(item => item.postID === post.postID ? { ...item, status: isApproved ? 'Approved' : 'Rejected', score: scoreVal, feedback: feedbackVal } : item);
          localStorage.setItem('tsdp_social_media_submissions', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Could not update local social cache', e);
      }

      if (res && res.success) {
        setNotice({
          type: 'success',
          text: `Post by ${post.studentName || post.studentID} ${isApproved ? 'approved (+ ' + scoreVal + ' pts)' : 'rejected'}.`
        });
        setPosts(prev => prev.map(p =>
          p.postID === post.postID
            ? { ...p, status: isApproved ? 'Approved' : 'Rejected', score: scoreVal, feedback: feedbackVal }
            : p
        ));
      } else if (res?.message && res.message.includes('Function not allowed')) {
        // Fallback for pending Apps Script function deployment
        setNotice({
          type: 'success',
          text: `Post by ${post.studentName || post.studentID} marked as ${isApproved ? 'Approved (+ ' + scoreVal + ' pts)' : 'Rejected'} (Updated locally).`
        });
        setPosts(prev => prev.map(p =>
          p.postID === post.postID
            ? { ...p, status: isApproved ? 'Approved' : 'Rejected', score: scoreVal, feedback: feedbackVal }
            : p
        ));
      } else {
        setNotice({ type: 'error', text: res?.message || 'Failed to update post status.' });
      }
    } catch (err) {
      // Offline / network fallback
      try {
        const raw = localStorage.getItem('tsdp_social_media_submissions');
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map(item => item.postID === post.postID ? { ...item, status: isApproved ? 'Approved' : 'Rejected', score: scoreVal, feedback: feedbackVal } : item);
          localStorage.setItem('tsdp_social_media_submissions', JSON.stringify(updated));
        }
      } catch (e) {}

      setNotice({
        type: 'success',
        text: `Post by ${post.studentName || post.studentID} marked as ${isApproved ? 'Approved (+ ' + scoreVal + ' pts)' : 'Rejected'} (Saved locally).`
      });
      setPosts(prev => prev.map(p =>
        p.postID === post.postID
          ? { ...p, status: isApproved ? 'Approved' : 'Rejected', score: scoreVal, feedback: feedbackVal }
          : p
      ));
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingPosts = posts.filter(p => p.status !== 'Approved' && p.status !== 'Rejected');
  const reviewedPosts = posts.filter(p => p.status === 'Approved' || p.status === 'Rejected');

  const displayedPosts = filterTab === 'pending'
    ? pendingPosts
    : filterTab === 'reviewed'
    ? reviewedPosts
    : posts;

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading submitted social media posts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Approve Social Media Posts</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Review resident learning posts on LinkedIn, Twitter, Medium, and Facebook. Award up to 5 points each (5% program weight).
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'pending'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review ({pendingPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('reviewed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'reviewed'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reviewed ({reviewedPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({posts.length})
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-2 animate-fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-brand-error border border-brand-error/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {displayedPosts.length === 0 ? (
        <div className="portal-card text-center py-12 text-brand-neutral-muted space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Share2 className="w-6 h-6" />
          </div>
          <p className="font-semibold text-sm text-slate-700">
            {filterTab === 'pending'
              ? 'No pending social media posts to review.'
              : filterTab === 'reviewed'
              ? 'No reviewed social media posts yet.'
              : 'No social media posts submitted yet.'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filterTab === 'pending' && posts.length > 0
              ? 'All submitted posts have been evaluated. Check the "Reviewed" or "All" tabs to see scored posts.'
              : 'When students submit learning posts from their portal, they will appear here for verification.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedPosts.map((post) => {
            const isProcessed = post.status === 'Approved' || post.status === 'Rejected';
            const isPending = !isProcessed;
            const currentScore = scores[post.postID] ?? 5;
            const currentFeedback = feedbacks[post.postID] ?? '';
            const isProcessing = actionInProgress === post.postID;

            return (
              <div
                key={post.postID}
                className={`portal-card border-l-4 transition-all ${
                  post.status === 'Approved'
                    ? 'border-l-emerald-500'
                    : post.status === 'Rejected'
                    ? 'border-l-rose-500'
                    : 'border-l-purple-600'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getPlatformBadgeStyle(post.platform)}`}>
                        {post.platform}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {post.studentName || post.studentID || 'Resident'}{' '}
                        <span className="text-brand-primary font-mono font-medium">
                          (#{post.studentNumber || post.studentID})
                        </span>
                      </span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {post.submittedAt
                            ? (post.submittedAt.includes('T') ? new Date(post.submittedAt).toLocaleString() : post.submittedAt)
                            : 'Recently submitted'}
                        </span>
                      </span>
                      {isProcessed && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ml-auto ${
                          post.status === 'Approved' ? 'badge-success' : 'badge-error'
                        }`}>
                          {post.status} ({post.score !== undefined ? `${post.score}/5 pts` : ''})
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      Topic: <span className="font-normal text-slate-600">{post.topic}</span>
                    </p>

                    {post.caption && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 font-normal italic leading-relaxed">
                        <span className="font-semibold not-italic text-slate-500 mr-1">Caption:</span>
                        "{post.caption}"
                      </p>
                    )}

                    {(() => {
                      const rawUrl = post.postUrl || post.url || post.link || post.postURL || post.submissionUrl || '';
                      const cleanUrl = rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')
                        ? `https://${rawUrl}`
                        : rawUrl;

                      return cleanUrl ? (
                        <div className="pt-0.5">
                          <a
                            href={cleanUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg border border-blue-200/70 transition-colors"
                          >
                            <span>Open & Inspect Post ({post.platform})</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="pt-0.5 text-xs text-slate-400 italic">
                          (No post URL provided)
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right: Scoring Form / Evaluation Details */}
                  {isPending ? (
                    <div className="w-full lg:w-80 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-3 shrink-0">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">Award Score:</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.5"
                            value={currentScore}
                            onChange={(e) => setScores(prev => ({ ...prev, [post.postID]: Number(e.target.value) }))}
                            className="w-16 text-center font-bold text-xs py-1 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-brand-primary"
                          />
                          <span className="text-xs text-slate-400">/ 5 pts</span>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Feedback note to resident..."
                        value={currentFeedback}
                        onChange={(e) => setFeedbacks(prev => ({ ...prev, [post.postID]: e.target.value }))}
                        className="form-input text-xs"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleAction(post, true)}
                          className="btn-primary py-1.5 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Saving...' : `Approve (+${currentScore})`}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleAction(post, false)}
                          className="btn-danger py-1.5 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full lg:w-72 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 shrink-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Evaluation Recorded</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          post.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="italic text-slate-500">"{post.feedback || 'No feedback comment provided'}"</p>
                      {post.score !== undefined && (
                        <p className="font-bold text-slate-700 pt-1">Score: {post.score}/5 pts</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
