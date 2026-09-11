import React from 'react';

export function CardSkeleton() {
  return (
    <div className="portal-card animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-1/3 mb-3"></div>
      <div className="h-8 bg-slate-200 rounded w-1/2"></div>
      <div className="h-3 bg-slate-200 rounded w-2/3 mt-3"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, title = true }) {
  return (
    <div className="portal-card animate-pulse">
      {title && <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-slate-100 items-center">
            <div className="h-3 bg-slate-200 rounded flex-1"></div>
            <div className="h-3 bg-slate-200 rounded flex-1"></div>
            <div className="h-3 bg-slate-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KPIGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default {
  CardSkeleton,
  TableSkeleton,
  KPIGridSkeleton
};
