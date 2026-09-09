import React from 'react';

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-brand-primary/20 border-t-brand-primary animate-spin`}
        role="status"
        aria-label="loading"
      />
      {text && <p className="text-sm font-medium text-brand-neutral-muted">{text}</p>}
    </div>
  );
}
