import React, { useState, useEffect, useCallback } from 'react';
import { getRecognitionLeaderboard } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  GraduationCap,
  Trophy,
  Clock,
  Users,
  RefreshCw,
  Sparkles,
  Award,
  Medal,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function Recognition() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await getRecognitionLeaderboard();
      if (res && res.success !== false) {
        setData(res);
      } else {
        setError(res?.message || 'Unable to retrieve recognition standings.');
      }
    } catch (err) {
      console.error('Error fetching recognition leaderboard:', err);
      setError('A network or server error occurred while retrieving leaderboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const bGrad = data?.bestGradAcademic;
  const mOut = data?.mostOutstanding;
  const mPunc = data?.mostPunctual;
  const bTeam = data?.bestTeam;

  const bGradName = bGrad ? `${bGrad.firstName || ''} ${bGrad.lastName || ''}`.trim() : null;
  const mOutName = mOut ? `${mOut.firstName || ''} ${mOut.lastName || ''}`.trim() : null;
  const mPuncName = mPunc ? `${mPunc.firstName || ''} ${mPunc.lastName || ''}`.trim() : null;
  const bTeamName = bTeam?.group ? bTeam.group : null;

  // Sort allTeams descending by averageScore
  const sortedTeams = Array.isArray(data?.allTeams)
    ? [...data.allTeams].sort((a, b) => (Number(b.averageScore) || 0) - (Number(a.averageScore) || 0))
    : [];

  const formatPercent = (val) => {
    if (val == null || isNaN(val)) return '0.0%';
    const num = Number(val);
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 font-sans max-w-7xl mx-auto">
      {/* Header Banner & Section 3: Refresh Button */}
      <div className="bg-gradient-to-r from-[#003E7E] via-[#0054A6] to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-blue-400/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Cohort Hall of Fame · ITF-NECA TSDP 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              🏆 Recognition Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
              Honoring standout academic excellence, steadfast consistency, punctuality, and exemplary group collaboration across all active residents.
            </p>
          </div>

          {/* Section 3: Refresh Button */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            {data?.computedAt && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-[11px] font-mono text-blue-100 border border-white/15 backdrop-blur-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-200" />
                <span>
                  Updated {new Date(data.computedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            )}

            <button
              type="button"
              id="refresh-recognition-btn"
              onClick={() => fetchLeaderboard(true)}
              disabled={refreshing || loading}
              className="bg-white hover:bg-orange-50 text-[#003E7E] font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              title="Re-fetch latest recognition standings"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#003E7E] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Loading recognition standings and awards..." />
        </div>
      ) : error ? (
        <div className="portal-card bg-red-50 border-red-200 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => fetchLeaderboard(false)}
            className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
          </button>
        </div>
      ) : (
        <>
          {/* Section 1 — Four Award Cards (2x2 grid on desktop, 1 column on mobile) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-amber-500" />
                  <span>Distinguished Resident & Team Accolades</span>
                </h2>
                <p className="text-xs text-brand-neutral-muted">
                  Official automated recognitions computed from technical evaluations, project milestones, and attendance logs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Best Grad Academic (Blue #0054A6 accent) */}
              <div className="portal-card relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0054A6]" />
                
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0054A6] bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full inline-block">
                        Academic Honors
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>🎓 Best Grad Academic</span>
                      </h3>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0054A6] border border-blue-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <GraduationCap className="w-6 h-6 text-[#0054A6]" />
                    </div>
                  </div>

                  {bGrad && bGradName ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xl font-bold text-slate-900 tracking-tight">
                          {bGradName}
                        </div>
                        {bGrad.classGroup && (
                          <div className="text-xs font-semibold text-slate-500 mt-0.5">
                            Class Group: {bGrad.classGroup}
                          </div>
                        )}
                      </div>

                      {/* Large award value */}
                      <div className="pt-1">
                        <div className="text-3xl font-black text-[#0054A6] tracking-tight">
                          {bGrad.awardValue != null ? `${Number(bGrad.awardValue).toFixed(2)} / 10` : '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          Weighted academic composite average
                        </div>
                      </div>

                      {/* Component breakdown */}
                      <div className="pt-3 border-t border-slate-100 text-xs font-medium text-slate-600 bg-slate-50/80 -mx-6 -mb-6 p-4 rounded-b-2xl">
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Component Breakdown:
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-700">
                          <span>
                            Technical:{' '}
                            <strong className="text-[#0054A6]">
                              {bGrad.components?.technical != null ? Number(bGrad.components.technical).toFixed(1) : '—'}
                            </strong>
                          </span>
                          <span className="text-slate-300">·</span>
                          <span>
                            Module Projects:{' '}
                            <strong className="text-[#0054A6]">
                              {bGrad.components?.moduleProjects != null ? Number(bGrad.components.moduleProjects).toFixed(1) : '—'}
                            </strong>
                          </span>
                          <span className="text-slate-300">·</span>
                          <span>
                            Capstone:{' '}
                            <strong className="text-[#0054A6]">
                              {bGrad.components?.capstone != null ? Number(bGrad.components.capstone).toFixed(1) : '—'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                      <p className="text-xs font-medium text-slate-500">
                        No data yet — awards will appear once students have been graded.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Most Outstanding (Orange #F58220 accent) */}
              <div className="portal-card relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F58220]" />

                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#F58220] bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-full inline-block">
                        Overall Performance
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>🏆 Most Outstanding</span>
                      </h3>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F58220] border border-orange-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Trophy className="w-6 h-6 text-[#F58220]" />
                    </div>
                  </div>

                  {mOut && mOutName ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xl font-bold text-slate-900 tracking-tight">
                          {mOutName}
                        </div>
                        {mOut.classGroup && (
                          <div className="text-xs font-semibold text-slate-500 mt-0.5">
                            Class Group: {mOut.classGroup}
                          </div>
                        )}
                      </div>

                      {/* Large award value */}
                      <div className="pt-1">
                        <div className="text-3xl font-black text-[#F58220] tracking-tight">
                          {mOut.awardValue != null ? `${Number(mOut.awardValue).toFixed(1)}%` : '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          Highest cumulative program score across all coursework
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 bg-orange-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl flex items-center justify-between">
                        <span className="font-semibold text-orange-950">Cohort Rank:</span>
                        <span className="font-bold text-[#F58220] px-2 py-0.5 rounded bg-white border border-orange-200 text-xs">
                          🥇 #1 Overall
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                      <p className="text-xs font-medium text-slate-500">
                        No data yet — awards will appear once students have been graded.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Most Punctual (Green accent #10B981) */}
              <div className="portal-card relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />

                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full inline-block">
                        Consistency & Dedication
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>⏰ Most Punctual</span>
                      </h3>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>

                  {mPunc && mPuncName ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xl font-bold text-slate-900 tracking-tight">
                          {mPuncName}
                        </div>
                        {mPunc.classGroup && (
                          <div className="text-xs font-semibold text-slate-500 mt-0.5">
                            Class Group: {mPunc.classGroup}
                          </div>
                        )}
                      </div>

                      {/* Large award value */}
                      <div className="pt-1">
                        <div className="text-3xl font-black text-emerald-600 tracking-tight">
                          {mPunc.attendanceRatePercent != null
                            ? `${Number(mPunc.attendanceRatePercent).toFixed(1)}% attendance rate`
                            : (mPunc.awardValue != null ? `${Number(mPunc.awardValue).toFixed(1)}% attendance rate` : '—')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          Highest prompt attendance across verified daily sessions
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 bg-emerald-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl flex items-center justify-between">
                        <span className="font-semibold text-emerald-950">Discipline Record:</span>
                        <span className="font-bold text-emerald-700 px-2 py-0.5 rounded bg-white border border-emerald-200 text-xs">
                          ⭐ Exemplary Attendance
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                      <p className="text-xs font-medium text-slate-500">
                        No data yet — awards will appear once students have been graded.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Best Team (Purple accent #8B5CF6) */}
              <div className="portal-card relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-600" />

                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full inline-block">
                        Team Collaboration
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>👥 Best Team</span>
                      </h3>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>

                  {bTeam && bTeamName ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xl font-bold text-slate-900 tracking-tight">
                          {bTeamName}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">
                          Top Performing Group
                        </div>
                      </div>

                      {/* Large award value */}
                      <div className="pt-1">
                        <div className="text-3xl font-black text-purple-600 tracking-tight">
                          Avg {bTeam.averageScore != null ? Number(bTeam.averageScore).toFixed(1) : '—'}% · {bTeam.memberCount || 0} members
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          Highest collaborative group average across evaluated deliverables
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 bg-purple-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl flex items-center justify-between">
                        <span className="font-semibold text-purple-950">Team Status:</span>
                        <span className="font-bold text-purple-700 px-2 py-0.5 rounded bg-white border border-purple-200 text-xs">
                          🥇 Leading Group
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                      <p className="text-xs font-medium text-slate-500">
                        No data yet — awards will appear once students have been graded.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 — Full Team Standings Table */}
          <div className="portal-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-primary" />
                  <span>Full Team Standings Table</span>
                </h2>
                <p className="text-xs text-brand-neutral-muted mt-0.5">
                  Complete rankings of all class groups sorted by collective average score descending
                </p>
              </div>

              <span className="badge-primary text-xs self-start sm:self-auto">
                {sortedTeams.length} {sortedTeams.length === 1 ? 'Team' : 'Teams'} Registered
              </span>
            </div>

            {sortedTeams.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No teams yet.</p>
                <p className="text-xs text-slate-500">
                  Team standings will appear once project groups have completed assignments and received ratings.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                      <th className="py-3 px-4 text-center w-24">Rank</th>
                      <th className="py-3 px-4">Group</th>
                      <th className="py-3 px-4 text-center">Average Score</th>
                      <th className="py-3 px-4 text-center">Members</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sortedTeams.map((team, idx) => {
                      const rank = idx + 1;
                      const isRank1 = rank === 1;
                      const isRank2 = rank === 2;
                      const isRank3 = rank === 3;

                      let medalIcon = null;
                      let rowStyle = 'hover:bg-slate-50/80 transition-colors';

                      if (isRank1) {
                        medalIcon = '🥇';
                        rowStyle = 'bg-amber-50/40 hover:bg-amber-50/70 font-semibold transition-colors';
                      } else if (isRank2) {
                        medalIcon = '🥈';
                        rowStyle = 'bg-slate-50/50 hover:bg-slate-100/60 transition-colors';
                      } else if (isRank3) {
                        medalIcon = '🥉';
                        rowStyle = 'bg-orange-50/30 hover:bg-orange-50/60 transition-colors';
                      }

                      return (
                        <tr key={team.group || idx} className={rowStyle}>
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span className="inline-flex items-center justify-center gap-1.5 font-mono">
                              {medalIcon && <span className="text-base">{medalIcon}</span>}
                              <span className={isRank1 ? 'text-amber-800 font-extrabold text-sm' : 'text-slate-700'}>
                                {rank}
                              </span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                            <div className="flex items-center gap-2">
                              <span>{team.group}</span>
                              {isRank1 && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                                  Leading Team
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-extrabold ${
                                isRank1
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isRank2
                                  ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                  : isRank3
                                  ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                  : 'bg-blue-50 text-brand-primary border border-blue-200'
                              }`}
                            >
                              {formatPercent(team.averageScore)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                            <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-mono text-xs">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{team.memberCount != null ? team.memberCount : '—'}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
