import React from 'react';
import { CheckCircle2, TrendingUp } from 'lucide-react';

// 9 core performance metrics sorted by weight descending (highest first)
const COMPONENTS_CONFIG = [
  { id: 'capstoneProjects', name: 'Capstone Projects', weight: 25, scoreKeys: ['capstoneScore', 'capstoneProjectsScore'], color: 'bg-amber-500' },
  { id: 'moduleProjects', name: 'Module Projects', weight: 20, scoreKeys: ['moduleProjectsScore', 'moduleProjectScore'], color: 'bg-emerald-500' },
  { id: 'technicalAssignments', name: 'Technical Assignments', weight: 10, scoreKeys: ['technicalAssignmentsScore', 'technicalScore'], color: 'bg-blue-500' },
  { id: 'groupPresentations', name: 'Group Presentations', weight: 10, scoreKeys: ['groupPresentationsScore', 'groupPresentationScore'], color: 'bg-cyan-500' },
  { id: 'attendance', name: 'Attendance', weight: 10, scoreKeys: ['attendanceScore'], color: 'bg-teal-500' },
  { id: 'softSkills', name: 'Soft Skills', weight: 10, scoreKeys: ['softSkillsScore', 'softSkillsEvaluationScore'], color: 'bg-pink-500' },
  { id: 'professionalAssignments', name: 'Professional Assignments', weight: 5, scoreKeys: ['professionalAssignmentsScore', 'professionalScore'], color: 'bg-orange-500' },
  { id: 'classActivities', name: 'Class Activities', weight: 5, scoreKeys: ['classActivitiesScore', 'classActivityScore'], color: 'bg-indigo-500' },
  { id: 'socialMedia', name: 'Social Media', weight: 5, scoreKeys: ['socialMediaScore', 'socialMediaPostsScore'], color: 'bg-purple-500' }
];

// Helper to determine performance progress bar color
function getPerformanceColor(rawScore, contribution) {
  if (!contribution || rawScore === 0) return 'bg-slate-300';
  if (rawScore >= 90) return 'bg-emerald-500';
  if (rawScore >= 70) return 'bg-blue-500';
  if (rawScore >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ScoreTable({ breakdown = {}, performance = null, totalScore = null }) {
  // Source object for performance metrics
  const perf = performance || (breakdown && !breakdown.technicalAssignments ? breakdown : (breakdown || {}));

  // Build the component array
  const components = COMPONENTS_CONFIG.map((c) => {
    // Look up contribution from API response
    let contributionVal = null;
    for (const key of c.scoreKeys) {
      if (perf[key] !== undefined && perf[key] !== null && perf[key] !== '') {
        contributionVal = perf[key];
        break;
      }
    }

    // Fallback to breakdown object if available
    if (contributionVal === null && breakdown?.[c.id] !== undefined) {
      const bData = breakdown[c.id];
      contributionVal = typeof bData === 'object' ? (bData.score ?? bData.weighted) : bData;
    }

    const contribution = contributionVal !== null && !isNaN(Number(contributionVal))
      ? Number(contributionVal)
      : 0;

    // Raw Score = (Contribution ÷ Weight) × 100
    const rawScore = c.weight > 0 ? (contribution / c.weight) * 100 : 0;
    const isAssessed = contribution > 0;

    return {
      ...c,
      contribution,
      rawScore,
      isAssessed
    };
  });

  // Total Final Score = Sum of all Contributions (or finalScore from API)
  const sumOfContributions = components.reduce((sum, c) => sum + c.contribution, 0);
  const totalContribution = totalScore !== null && totalScore !== undefined && !isNaN(Number(totalScore))
    ? Number(totalScore)
    : sumOfContributions;

  const totalRawPercent = Math.min(100, Math.max(0, totalContribution));
  const totalBarColor = getPerformanceColor(totalRawPercent, totalContribution);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Grading Component Breakdown</h3>
          <p className="text-xs text-brand-neutral-muted">
            9 core performance metrics weighted according to TSDP 2026 syllabus
          </p>
        </div>
        <div className="flex items-center gap-2 bg-brand-primary-light px-3.5 py-1.5 rounded-lg border border-brand-primary/20">
          <TrendingUp className="w-4 h-4 text-brand-primary" />
          <span className="text-xs font-medium text-slate-700">Total Weighted Score:</span>
          <span className="text-base font-semibold text-brand-primary">
            {totalContribution > 0 ? `${totalContribution.toFixed(1)}%` : '0.0%'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4 font-medium">Component</th>
              <th className="py-3 px-4 font-medium text-center">Weight</th>
              <th className="py-3 px-4 font-medium text-center">Raw Score</th>
              <th className="py-3 px-4 font-medium text-center">Contribution</th>
              <th className="py-3 px-4 font-medium">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {components.map((c) => {
              const barColor = getPerformanceColor(c.rawScore, c.contribution);

              return (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${c.color}`} />
                    {c.name}
                  </td>
                  <td className="py-3 px-4 text-center font-normal text-slate-500">
                    {c.weight}%
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-slate-800">
                    {c.isAssessed ? (
                      `${c.rawScore.toFixed(1)}%`
                    ) : (
                      <span className="text-slate-400 text-xs font-normal">Not assessed</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-brand-primary">
                    {c.contribution.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 min-w-[150px]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${barColor} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${c.isAssessed ? Math.min(100, Math.max(0, c.rawScore)) : 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-normal text-slate-500 w-20 text-right">
                        {c.isAssessed ? `${c.rawScore.toFixed(1)}%` : <span className="text-slate-400">Not assessed</span>}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800">
              <td className="py-3.5 px-4 text-slate-800 font-medium">
                TOTAL
              </td>
              <td className="py-3.5 px-4 text-center text-slate-700 font-medium">
                100%
              </td>
              <td className="py-3.5 px-4 text-center text-slate-400 font-normal">
                —
              </td>
              <td className="py-3.5 px-4 text-center text-lg text-brand-primary font-semibold">
                {totalContribution.toFixed(2)}
              </td>
              <td className="py-3.5 px-4 min-w-[150px]">
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${totalBarColor} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${totalRawPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-20 text-right">
                    {totalContribution.toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
