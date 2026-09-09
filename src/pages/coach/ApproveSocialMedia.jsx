import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPendingSocialPosts, approveSocialMediaPost } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Share2, CheckCircle2, XCircle, ExternalLink, AlertCircle } from 'lucide-react';

export default function ApproveSocialMedia() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({}); // { [postID]: 5 }
  const [feedbacks, setFeedbacks] = useState({}); // { [postID]: 'Well done' }
  const [actionInProgress, setActionInProgress] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await getPendingSocialPosts();
        if (res && res.success) {
          setPosts(res.data);
          const initialScores = {};
          const initialFeedbacks = {};
          res.data.forEach(p => {
            initialScores[p.postID] = p.score ?? 5;
            initialFeedbacks[p.postID] = p.feedback || '';
          });
          setScores(initialScores);
          setFeedbacks(initialFeedbacks);
        }
      } catch (err) {
        console.error(err);
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
      const res = await approveSocialMediaPost(post.postID, Number(scoreVal), feedbackVal, coachID);
      if (res && res.success) {
        setNotice({
          type: 'success',
          text: `Post by ${post.studentName} ${isApproved ? 'approved (+ ' + scoreVal + ' pts)' : 'rejected'}.`
        });
        setPosts(prev => prev.map(p =>
          p.postID === post.postID
            ? { ...p, status: isApproved ? 'Approved' : 'Rejected', score: scoreVal, feedback: feedbackVal }
            : p
        ));
      }
    } catch (err) {
      setNotice({ type: 'error', text: 'Failed to update post status.' });
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading submitted social media posts..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Approve Social Media Posts</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Review resident learning posts on LinkedIn, Twitter, and Facebook. Award up to 5 points each (5% program weight).
        </p>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-blue-50 text-brand-success border border-blue-200'
              : 'bg-red-50 text-brand-error border border-brand-error/20'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-brand-primary" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="portal-card text-center py-12 text-brand-neutral-muted">
          <Share2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-sm">No pending social media posts to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isProcessed = post.status !== 'Pending';

            return (
              <div
                key={post.postID}
                className={`portal-card border-l-4 transition-all ${
                  post.status === 'Approved'
                    ? 'border-l-brand-success'
                    : post.status === 'Rejected'
                    ? 'border-l-brand-error'
                    : 'border-l-brand-primary'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge-primary">{post.platform}</span>
                      <span className="text-xs font-bold text-brand-neutral">
                        {post.studentName} (#{post.studentNumber})
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-brand-neutral-muted">Submitted: {post.submittedAt}</span>
                      {isProcessed && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ml-auto ${
                          post.status === 'Approved' ? 'badge-success' : 'badge-error'
                        }`}>
                          {post.status} ({post.score}/5)
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-brand-neutral">
                      Topic: <span className="font-normal text-brand-neutral-muted">{post.topic}</span>
                    </p>

                    <div>
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                      >
                        <span>Open & Inspect Post ({post.platform})</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Right: Scoring Form */}
                  {!isProcessed ? (
                    <div className="w-full lg:w-80 bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-brand-neutral">Score Awarded:</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.5"
                            value={scores[post.postID] ?? 5}
                            onChange={(e) => setScores(prev => ({ ...prev, [post.postID]: Number(e.target.value) }))}
                            className="w-16 text-center font-bold text-sm py-1 border border-brand-neutral-border rounded-lg"
                          />
                          <span className="text-xs text-gray-400">/ 5</span>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Feedback note to resident..."
                        value={feedbacks[post.postID] || ''}
                        onChange={(e) => setFeedbacks(prev => ({ ...prev, [post.postID]: e.target.value }))}
                        className="form-input text-xs"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={actionInProgress === post.postID}
                          onClick={() => handleAction(post, true)}
                          className="btn-primary py-1.5 text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>

                        <button
                          type="button"
                          disabled={actionInProgress === post.postID}
                          onClick={() => handleAction(post, false)}
                          className="btn-danger py-1.5 text-xs font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-brand-neutral-muted bg-gray-50 p-3 rounded-xl border border-gray-100 max-w-xs">
                      <span className="font-semibold block text-brand-neutral">Evaluation Recorded</span>
                      <p className="italic">"{post.feedback}"</p>
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
