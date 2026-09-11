import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

const FACILITATOR_QUOTES = [
  {
    quote: "Success is not served à la carte.",
    punchline: "You have to take the whole menu — including the debugging and the retries!",
    category: "Mindset"
  },
  {
    quote: "Learn to ask questions.",
    punchline: "Don't forget to ask questions and learn better. A closed mouth is an empty dataframe!",
    category: "Learning"
  },
  {
    quote: "You cannot do it alone.",
    punchline: "Team up and aggregate! Even SQL requires a GROUP BY to make sense of the crowd.",
    category: "Teamwork"
  },
  {
    quote: "Don't you dare DELETE FROM customers alone — tell me WHERE!",
    punchline: "A missing WHERE clause has caused more tears than any machine learning loss function.",
    category: "SQL Humor"
  },
  {
    quote: "Error 404: Even your VLOOKUP gave up on this one.",
    punchline: "Time to upgrade to XLOOKUP, or at least double-check the sheet range!",
    category: "Excel Humor"
  },
  {
    quote: "You can't GROUP BY without an aggregate.",
    punchline: "Individual efforts without teamwork are just un-aggregated rows.",
    category: "Data Philosophy"
  },
  {
    quote: "Never drop tables in production and call it 'data cleaning'.",
    punchline: "Take a deep breath, review your script, and let's get back on track.",
    category: "Best Practices"
  },
  {
    quote: "SELECT * FROM life WHERE stress = 0; — 0 rows returned.",
    punchline: "Relax, refresh your browser, and remember that even pipelines need maintenance.",
    category: "Data Humor"
  },
  {
    quote: "Correlation is not causation.",
    punchline: "However, your missing bracket definitely caused this specific error.",
    category: "Analytics"
  },
  {
    quote: "Inner Join your efforts, Outer Join your excuses.",
    punchline: "Filter out the noise, keep the signal, and try running it one more time.",
    category: "Motivation"
  },
  {
    quote: "Even the best machine learning models have a high loss function on Mondays.",
    punchline: "Keep training your weights. Convergence is just around the corner!",
    category: "AI / ML Humor"
  },
  {
    quote: "A data analyst without curiosity is like a spreadsheet without gridlines.",
    punchline: "Stay curious, ask what broke, and let's get this resolved.",
    category: "Wisdom"
  }
];

export default function ErrorPage({
  source = 'page',
  title,
  message,
  onRetry
}) {
  const { user } = useAuth();
  
  // Pick an initial quote randomly
  const [quoteIndex] = useState(() => 
    Math.floor(Math.random() * FACILITATOR_QUOTES.length)
  );

  const activeQuote = FACILITATOR_QUOTES[quoteIndex];

  // Determine login path based on user role
  const getLoginPath = () => {
    if (user?.role === 'coach') return '/coach/login';
    if (user?.role === 'admin') return '/admin/login';
    return '/student/login';
  };

  // Format the "near door" source text
  const getNearDoorText = () => {
    const s = String(source || '').toLowerCase().trim();
    if (s === 'network' || s.includes('internet') || s.includes('wifi')) {
      return 'Uh-oh, seems your network is near door!';
    }
    if (s === 'page' || s.includes('404') || s.includes('route')) {
      return 'Uh-oh, seems this page is near door!';
    }
    if (s === 'database' || s.includes('backend') || s.includes('api') || s.includes('sheet')) {
      return 'Uh-oh, seems the backend connection is near door!';
    }
    if (s === 'session' || s.includes('auth') || s.includes('login')) {
      return 'Uh-oh, seems your session is near door!';
    }
    if (s === 'query' || s.includes('sql')) {
      return 'Uh-oh, seems your query is near door!';
    }
    return `Uh-oh, seems your ${source || 'system'} is near door!`;
  };


  const handleRetryAction = () => {
    if (typeof onRetry === 'function') {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between items-center relative selection:bg-brand-primary selection:text-white">
      {/* Spacer to keep center balance */}
      <div className="hidden sm:block h-2" />

      {/* Main Centered Content */}
      <div className="max-w-4xl w-full text-center my-auto py-4 px-4">
        {/* Error Walk GIF Animation & Dynamic "Near Door" Pill (Centered) */}
        <div className="flex flex-col items-center justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-white border border-slate-200/90 shadow-sm flex items-center justify-center p-2 overflow-hidden mb-3">
            <img
              src="/logos/error-walk.gif"
              alt="Walk of error animation"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-brand-secondary-dark text-xs sm:text-sm font-semibold shadow-xs text-center">
            <span className="w-2 h-2 rounded-full bg-brand-secondary animate-ping" />
            <span>{getNearDoorText()}</span>
          </div>
        </div>

        {/* Big Facilitator Quote Title — 2x Larger */}
        <div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto mb-4 leading-[1.12]">
            "{title || activeQuote.quote}"
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-6 leading-relaxed">
            {message || activeQuote.punchline}
          </p>
        </div>

        {/* Action Button & Log In Link */}
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRetryAction}
            className="btn-primary px-6 py-2.5 shadow-sm hover:shadow transition-all text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <p className="text-xs sm:text-sm text-slate-500">
            If you still can't load this page, go back to{' '}
            <Link
              to={getLoginPath()}
              className="text-brand-primary hover:text-brand-primary-dark font-semibold underline underline-offset-2 transition-colors"
            >
              log in
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Bottom Footer - Ultra Compact & Vertically Centered */}
      <footer className="w-full h-8 sm:h-9 shrink-0 flex items-center justify-center text-center text-[11px] sm:text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 px-4">
        <p className="m-0 leading-none flex flex-wrap items-center justify-center gap-1">
          <span>© {new Date().getFullYear()} ITF-NECA Technical Skills Development Project (TSDP) · Powered by</span>
          <strong className="text-slate-600 font-semibold">ShamzBridge Consult</strong>
        </p>
      </footer>
    </div>
  );
}
