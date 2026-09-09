import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitSocialMediaPost } from '../../services/api';
import { SOCIAL_PLATFORMS } from '../../utils/constants';
import { Share2, CheckCircle2, AlertCircle, ExternalLink, Info } from 'lucide-react';

export default function SubmitSocialMedia() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState('LinkedIn');
  const [postUrl, setPostUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const cleanUrl = postUrl.trim();
    if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))) {
      setError('Please enter a valid URL beginning with https://');
      return;
    }

    if (!topic.trim()) {
      setError('Please enter a short summary of the learning topic shared in your post.');
      return;
    }

    setLoading(true);
    try {
      const studentNum = user?.studentNumber || user?.studentID || '';
      const res = await submitSocialMediaPost(studentNum, platform, cleanUrl, topic);
      if (res && res.success) {
        setResult(res);
        setPostUrl('');
        setTopic('');
      } else {
        setError(res?.message || 'Failed to submit social media post. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to submit social media post. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Submit Social Media Learning Post</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Share your daily or weekly learnings with the community. Social media contributions carry a <strong>5%</strong> weight in your final grade.
        </p>
      </div>

      {result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success space-y-1">
          <div className="flex items-center gap-2 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-brand-primary" />
            <span>Post Submitted for Review!</span>
          </div>
          <p className="text-xs">{result.message}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="portal-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Platform Selector */}
          <div>
            <label className="form-label">Select Social Network Platform</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SOCIAL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`py-2.5 px-3 rounded-lg font-bold text-xs border text-center transition-all ${
                    platform === p
                      ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                      : 'bg-gray-50 text-brand-neutral border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Post URL */}
          <div>
            <label className="form-label">
              Public Post URL <span className="text-brand-error">*</span>
            </label>
            <input
              type="url"
              placeholder="https://www.linkedin.com/posts/..."
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              className="form-input"
              required
            />
            <span className="text-[11px] text-brand-neutral-muted mt-1 block">
              Ensure the post visibility is set to Public so your coach can review it.
            </span>
          </div>

          {/* Learning Topic */}
          <div>
            <label className="form-label">
              Topic / Key Takeaways <span className="text-brand-error">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Discussing the difference between WHERE and HAVING clauses in SQL, with real-world business scenarios from our ITF-NECA class session."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="form-input text-sm"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 font-bold text-sm shadow-md"
          >
            {loading ? 'Submitting Post...' : 'Submit Post for Approval'}
          </button>
        </form>
      </div>

      {/* Guidelines Box */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs text-brand-neutral-muted">
        <h4 className="font-bold text-brand-neutral flex items-center gap-1.5">
          <Info className="w-4 h-4 text-brand-primary" />
          Submission Policy & Weekly Limits
        </h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Weekly Limit:</strong> You may submit up to <strong>3 posts per week</strong>.</li>
          <li><strong>Hashtags:</strong> Remember to tag <strong>#ShamzBridgeConsult #ITF #NECA #TSDP #DataAnalytics</strong> in your posts.</li>
          <li><strong>Scoring:</strong> Approved posts receive up to 5 points each from your instructor.</li>
        </ul>
      </div>
    </div>
  );
}
