import React from 'react';
import { GRADING_WEIGHTS } from '../utils/constants';
import { CheckCircle2, TrendingUp } from 'lucide-react';

export default function ScoreTable({ breakdown = {}, totalScore = null }) {
  // Calculate running weighted total
  const hasBreakdownData = Object.keys(breakdown).length > 0;
  const calculatedTotal = Object.keys(breakdown).reduce((sum, key) => {
    return sum + (Number(breakdown[key]?.weighted) || 0);
  }, 0);

  const displayTotal = totalScore !== null && totalScore !== undefined
    ? `${totalScore}%`
    : hasBreakdownData && calculatedTotal > 0
      ? `${calculatedTotal.toFixed(1)}%`
      : '—';

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Grading Component Breakdown</h3>
          <p className="text-xs text-brand-neutral-muted">9 core performance metrics weighted according to TSDP 2026 syllabus</p>
        </div>
        <div className="flex items-center gap-2 bg-brand-primary-light px-3.5 py-1.5 rounded-lg border border-brand-primary/20">
          <TrendingUp className="w-4 h-4 text-brand-primary" />
          <span className="text-xs font-medium text-slate-700">Total Weighted Score:</span>
          <span className="text-base font-semibold text-brand-primary">{displayTotal}</span>
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
            {GRADING_WEIGHTS.map((item) => {
              const compData = breakdown?.[item.id];
              const hasScore = compData?.score !== undefined && compData?.score !== null && compData?.score !== '';
              const rawScore = hasScore ? Number(compData.score) : null;
              const weightedScore = compData?.weighted !== undefined && compData?.weighted !== null
                ? compData.weighted
                : rawScore !== null
                  ? (rawScore * (item.weight / 100)).toFixed(1)
                  : null;
              const percentOfWeight = rawScore !== null ? (rawScore / 100) * 100 : 0;

              return (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-center font-normal text-slate-500">
                    {item.weight}%
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-slate-800">
                    {rawScore !== null ? `${rawScore}/100` : '—'}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-brand-primary">
                    {weightedScore !== null ? `+${weightedScore}%` : '—'}
                  </td>
                  <td className="py-3 px-4 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, percentOfWeight))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-normal text-slate-400 w-12 text-right">
                        {rawScore !== null ? `${rawScore}%` : 'Pending'}
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
                Total Weighted Aggregate
              </td>
              <td className="py-3.5 px-4 text-center text-slate-700 font-medium">100%</td>
              <td className="py-3.5 px-4 text-center text-slate-400 font-normal">—</td>
              <td className="py-3.5 px-4 text-center text-lg text-brand-primary font-semibold">
                {displayTotal}
              </td>
              <td className="py-3.5 px-4 text-xs font-medium text-brand-success flex items-center gap-1.5 pt-4">
                <CheckCircle2 className="w-4 h-4" /> Active Program Evaluation
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

