import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecognitionLeaderboard } from '../services/api';

export default function RecognitionWidget({ destination = '/coach/recognition' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await getRecognitionLeaderboard();
        if (isMounted && res) {
          setData(res);
        }
      } catch (err) {
        console.warn('Failed to load recognition leaderboard widget:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const bGrad = data?.bestGradAcademic;
  const mOut = data?.mostOutstanding;
  const mPunc = data?.mostPunctual;
  const bTeam = data?.bestTeam;

  const bGradName = bGrad ? `${bGrad.firstName || ''} ${bGrad.lastName || ''}`.trim() || '—' : '—';
  const bGradVal = bGrad && bGrad.awardValue != null ? `Avg: ${bGrad.awardValue}/10` : '—';

  const mOutName = mOut ? `${mOut.firstName || ''} ${mOut.lastName || ''}`.trim() || '—' : '—';
  const mOutVal = mOut && mOut.awardValue != null ? `${mOut.awardValue}%` : '—';

  const mPuncName = mPunc ? `${mPunc.firstName || ''} ${mPunc.lastName || ''}`.trim() || '—' : '—';
  const mPuncVal = mPunc
    ? `${mPunc.attendanceRatePercent != null ? mPunc.attendanceRatePercent : (mPunc.awardValue != null ? mPunc.awardValue : '—')}%`
    : '—';

  const bTeamName = bTeam?.group || '—';
  const bTeamVal = bTeam && bTeam.averageScore != null
    ? `Avg: ${typeof bTeam.averageScore === 'number' ? bTeam.averageScore : bTeam.averageScore}`
    : '—';

  return (
    <div className="portal-card space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span>🏆 Recognition Leaderboard</span>
        </h3>
        <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-full">
          Live Standings
        </span>
      </div>

      {loading ? (
        <div className="space-y-2 py-2">
          <div className="h-7 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-7 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-7 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-7 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          {/* Row 1: Best Grad Academic */}
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-base shrink-0">🎓</span>
              <span className="font-semibold text-slate-600 shrink-0">Best Grad Academic</span>
              <span className="font-bold text-slate-800 truncate">{bGradName}</span>
            </div>
            <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded text-[11px] shrink-0">
              {bGradVal}
            </span>
          </div>

          {/* Row 2: Most Outstanding */}
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-base shrink-0">🏆</span>
              <span className="font-semibold text-slate-600 shrink-0">Most Outstanding</span>
              <span className="font-bold text-slate-800 truncate">{mOutName}</span>
            </div>
            <span className="font-semibold text-orange-700 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded text-[11px] shrink-0">
              {mOutVal}
            </span>
          </div>

          {/* Row 3: Most Punctual */}
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-base shrink-0">⏰</span>
              <span className="font-semibold text-slate-600 shrink-0">Most Punctual</span>
              <span className="font-bold text-slate-800 truncate">{mPuncName}</span>
            </div>
            <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded text-[11px] shrink-0">
              {mPuncVal}
            </span>
          </div>

          {/* Row 4: Best Team */}
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-base shrink-0">👥</span>
              <span className="font-semibold text-slate-600 shrink-0">Best Team</span>
              <span className="font-bold text-slate-800 truncate">{bTeamName}</span>
            </div>
            <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded text-[11px] shrink-0">
              {bTeamVal}
            </span>
          </div>
        </div>
      )}

      <div className="pt-1 border-t border-slate-100 flex justify-end">
        <Link
          to={destination}
          className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 transition-colors"
        >
          <span>View Full Leaderboard →</span>
        </Link>
      </div>
    </div>
  );
}
