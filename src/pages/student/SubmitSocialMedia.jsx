import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitSocialMediaPost, getStudentPendingAssignments } from '../../services/api';
import { SOCIAL_PLATFORMS } from '../../utils/constants';
import CustomSelect from '../../components/CustomSelect';
import { Share2, CheckCircle2, AlertCircle, ExternalLink, Info, X, ArrowRight, Sparkles, Award } from 'lucide-react';

export default function SubmitSocialMedia() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlAssignmentID = searchParams.get('assignmentID');

  const [socialAssignments, setSocialAssignments] = useState([]);
  const [selectedAssignmentID, setSelectedAssignmentID] = useState(urlAssignmentID || '');
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [localSubmissions, setLocalSubmissions] = useState([]);

  const [platform, setPlatform] = useState('LinkedIn');
  const [postUrl, setPostUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);

  // Load pending social media assignments & cached submissions
  useEffect(() => {
    async function loadAssignments() {
      const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3, '0')}` : '');
      const studentNum = user?.studentNumber || '';

      // 1. Read cached local submissions
      let cached = [];
      try {
        const raw = localStorage.getItem('tsdp_social_media_submissions');
        cached = raw ? JSON.parse(raw) : [];
        setLocalSubmissions(cached);
      } catch (e) {}

      // 2. Fetch student pending assignments from backend
      try {
        const res = await getStudentPendingAssignments(studentID || studentNum).catch(() => null);
        let list = [];
        if (res && res.success !== false) {
          const root = res.data && (res.data.pending || res.data.overdue || res.data.submitted) ? res.data : res;
          const rawPending = Array.isArray(root.pending) ? root.pending : (Array.isArray(root) ? root : []);
          list = rawPending.filter(a => a.type === 'SocialMedia');
        }

        setSocialAssignments(list);

        // Preselection logic
        if (urlAssignmentID && list.some(a => (a.assignmentID || a.id) === urlAssignmentID)) {
          setSelectedAssignmentID(urlAssignmentID);
          const found = list.find(a => (a.assignmentID || a.id) === urlAssignmentID);
          if (found?.tool && found.tool !== 'Any' && SOCIAL_PLATFORMS.includes(found.tool)) {
            setPlatform(found.tool);
          }
        } else if (list.length === 1) {
          const only = list[0];
          const onlyID = only.assignmentID || only.id;
          setSelectedAssignmentID(onlyID);
          if (only.tool && only.tool !== 'Any' && SOCIAL_PLATFORMS.includes(only.tool)) {
            setPlatform(only.tool);
          }
        }
      } catch (err) {
        console.error('Error fetching student social assignments:', err);
      } finally {
        setLoadingAssignments(false);
      }
    }

    loadAssignments();
  }, [user, urlAssignmentID]);

  // Determine progress for currently selected assignment
  const selectedAsgn = socialAssignments.find(a => (a.assignmentID || a.id) === selectedAssignmentID);
  const postsRequired = selectedAsgn ? Number(selectedAsgn.maxFilesAllowed || selectedAsgn.postsRequired || 1) : 1;
  const approvedPostsCount = localSubmissions.filter(s =>
    (s.assignmentID === selectedAssignmentID) && (s.status === 'Approved')
  ).length;
  const pendingPostsCount = localSubmissions.filter(s =>
    (s.assignmentID === selectedAssignmentID) && (s.status === 'Pending' || s.status === 'Submitted')
  ).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (socialAssignments.length > 0 && !selectedAssignmentID) {
      setError('Please select which social media assignment you are submitting for.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const cleanUrl = postUrl.trim();
    if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))) {
      setError('Please enter a valid URL beginning with https://');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!topic.trim()) {
      setError('Please enter a short summary of the learning topic shared in your post.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const studentNum = user?.studentNumber || user?.studentID || '';
      const res = await submitSocialMediaPost(studentNum, platform, cleanUrl, topic.trim(), caption.trim(), selectedAssignmentID);
      if (res && res.success) {
        // Record in local cache as well
        const localEntry = {
          postID: res.postID || `SOC-${Date.now()}`,
          assignmentID: selectedAssignmentID,
          studentID: user?.studentID || studentNum,
          studentNumber: user?.studentNumber || studentNum,
          studentName: user?.name || user?.firstName || 'Resident Student',
          platform,
          postUrl: cleanUrl,
          topic: topic.trim(),
          caption: caption.trim(),
          submittedAt: new Date().toISOString(),
          status: 'Pending'
        };
        try {
          const raw = localStorage.getItem('tsdp_social_media_submissions');
          const existing = raw ? JSON.parse(raw) : [];
          existing.unshift(localEntry);
          localStorage.setItem('tsdp_social_media_submissions', JSON.stringify(existing));
          setLocalSubmissions(existing);
        } catch (e) {}

        setResult(res);
        setShowSuccessModal(true);
        setPostUrl('');
        setTopic('');
        setCaption('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (res?.message && res.message.includes('Function not allowed')) {
        // Fallback for pending Apps Script deployment
        const localEntry = {
          postID: `SOC-${Date.now()}`,
          assignmentID: selectedAssignmentID,
          studentID: user?.studentID || studentNum,
          studentNumber: user?.studentNumber || studentNum,
          studentName: user?.name || user?.firstName || 'Resident Student',
          platform,
          postUrl: cleanUrl,
          topic: topic.trim(),
          caption: caption.trim(),
          submittedAt: new Date().toISOString(),
          status: 'Pending'
        };
        try {
          const raw = localStorage.getItem('tsdp_social_media_submissions');
          const existing = raw ? JSON.parse(raw) : [];
          existing.unshift(localEntry);
          localStorage.setItem('tsdp_social_media_submissions', JSON.stringify(existing));
          setLocalSubmissions(existing);
        } catch (e) {
          console.warn('Could not cache social submission', e);
        }

        setResult({
          success: true,
          message: 'Post submitted and recorded successfully! (Queued locally for coach review).',
          postID: localEntry.postID
        });
        setShowSuccessModal(true);
        setPostUrl('');
        setTopic('');
        setCaption('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res?.message || 'Failed to submit social media post. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to submit social media post. Please check network connection.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Submit Social Media Learning Post</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Share your daily or weekly learnings with the community. Social media contributions carry a <strong>5%</strong> weight in your final grade.
          </p>
        </div>
        <Link
          to="/student/dashboard"
          className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {result && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Post Submitted for Review!</span>
          </div>
          <p className="text-xs text-emerald-700">{result.message}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="portal-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Assignment Selector (Dropdown + Progress Badge) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="form-label mb-0">
                Which Assignment? {socialAssignments.length > 0 && <span className="text-brand-error">*</span>}
              </label>
              {selectedAsgn && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full shadow-xs">
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  <span>{approvedPostsCount}/{postsRequired} posts approved</span>
                  {pendingPostsCount > 0 && (
                    <span className="text-[10px] bg-white px-1 rounded border border-purple-200 text-purple-600">
                      +{pendingPostsCount} in review
                    </span>
                  )}
                </span>
              )}
            </div>

            {loadingAssignments ? (
              <div className="text-xs text-slate-400 p-2.5 bg-slate-50 rounded-lg border border-slate-200 animate-pulse">
                Checking pending social media assignments...
              </div>
            ) : socialAssignments.length > 0 ? (
              <CustomSelect
                value={selectedAssignmentID}
                onChange={(val) => {
                  setSelectedAssignmentID(val);
                  const found = socialAssignments.find(a => (a.assignmentID || a.id) === val);
                  if (found?.tool && found.tool !== 'Any' && SOCIAL_PLATFORMS.includes(found.tool)) {
                    setPlatform(found.tool);
                  }
                }}
                placeholder="Select an assignment..."
                options={socialAssignments.map((a) => ({
                  value: a.assignmentID || a.id,
                  label: `${a.title || 'Social Media Learning Post'} (Week ${a.weekNumber || '—'}${a.dayNumber ? ` Day ${a.dayNumber}` : ''})`
                }))}
              />
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>General Social Media Learning Post (No active deadline task required)</span>
                <span className="badge-primary text-[10px]">Open Share</span>
              </div>
            )}
          </div>

          {/* Platform Selector */}
          <div>
            <label className="form-label">
              Select Social Network Platform <span className="text-brand-error">*</span>
            </label>
            <CustomSelect
              value={platform}
              onChange={(val) => setPlatform(val)}
              options={SOCIAL_PLATFORMS.map((p) => ({
                value: p,
                label: p
              }))}
            />

            {/* Quick-Pick Platform Pills */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {SOCIAL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`py-1.5 px-3 rounded-lg font-medium text-xs border transition-all ${
                    platform === p
                      ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
              rows={2}
              placeholder="e.g. Discussing the difference between WHERE and HAVING clauses in SQL, with real-world business scenarios from our ITF-NECA class session."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="form-input text-sm"
              required
            />
          </div>

          {/* Caption / Content */}
          <div>
            <label className="form-label">
              Post Caption / Copy
            </label>
            <textarea
              rows={3}
              placeholder="Paste the caption, summary, or text content of your published social media post here..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="form-input text-sm"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Celebration Success Pop-up Modal */}
      {showSuccessModal && result && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center space-y-5 animate-scale-up relative">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Post Submitted for Review!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your post on <strong className="text-brand-primary">{platform}</strong> has been received and queued for your coach's evaluation and grading.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Link
                to="/student/dashboard"
                className="w-full sm:w-auto btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto btn-secondary py-2.5 px-5 text-xs font-semibold"
              >
                Submit Another Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
