import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, User, Menu, X, ShieldCheck, GraduationCap, Award } from 'lucide-react';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, role, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [logoErrors, setLogoErrors] = useState({});

  const handleLogout = () => {
    logout();
    if (role === 'coach') {
      navigate('/coach/login');
    } else if (role === 'admin') {
      navigate('/admin/login');
    } else {
      navigate('/student/login');
    }
  };

  const handleLogoError = (key) => {
    setLogoErrors(prev => ({ ...prev, [key]: true }));
  };

  const getRoleBadge = () => {
    if (role === 'student') {
      return (
        <span className="badge-primary flex items-center gap-1">
          <GraduationCap className="w-3 h-3" /> Resident {user?.studentNumber ? `#${user.studentNumber}` : ''}
        </span>
      );
    }
    if (role === 'coach') {
      return (
        <span className="badge-secondary flex items-center gap-1">
          <Award className="w-3 h-3" /> Coach
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="badge-success flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Administrator
        </span>
      );
    }
    return null;
  };

  return (
    <header className="bg-white border-b border-brand-neutral-border sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Hamburger (mobile) + Brand / Partner Logos */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-brand-neutral hover:bg-gray-100 focus:outline-none"
                aria-label="Toggle Navigation"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              {/* Partner Logos or Fallback Emblems */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* ITF Logo */}
                {!logoErrors['itf'] ? (
                  <img
                    src="/logos/itf-logo.png"
                    alt="ITF"
                    className="h-8 sm:h-9 object-contain"
                    onError={() => handleLogoError('itf')}
                  />
                ) : (
                  <div className="h-8 px-2 rounded bg-emerald-600 text-white font-medium text-xs flex items-center shadow-xs">
                    ITF
                  </div>
                )}

                {/* NECA Logo */}
                {!logoErrors['neca'] ? (
                  <img
                    src="/logos/neca-logo.png"
                    alt="NECA"
                    className="h-8 sm:h-9 object-contain"
                    onError={() => handleLogoError('neca')}
                  />
                ) : (
                  <div className="h-8 px-2 rounded bg-brand-primary text-white font-medium text-xs flex items-center shadow-xs">
                    NECA
                  </div>
                )}

                {/* ShamzBridge Logo */}
                {!logoErrors['shamzbridge'] ? (
                  <img
                    src="/logos/shamzbridge-logo.png"
                    alt="ShamzBridge Consult"
                    className="h-8 sm:h-9 object-contain"
                    onError={() => handleLogoError('shamzbridge')}
                  />
                ) : (
                  <div className="h-8 px-2 rounded bg-brand-secondary text-white font-medium text-xs flex items-center shadow-xs">
                    SHAMZBRIDGE
                  </div>
                )}
              </div>

              {/* Text branding */}
              <div className="hidden md:block pl-2 border-l border-gray-300">
                <span className="block text-xs font-semibold uppercase tracking-wider text-brand-primary leading-tight">
                  TSDP 2026
                </span>
                <span className="block text-[11px] font-normal text-slate-500 leading-tight">
                  Data Analysis Grading Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Tutorial Link, Role Badge, User Info & Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Tutorial Button */}
            <Link
              to="/tutorial"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-primary bg-brand-primary-light hover:bg-blue-100 rounded-lg transition-colors"
              title="View Architecture & Tutorial Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutorial & Docs</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
                {/* Role and Name */}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-medium text-slate-800 truncate max-w-[140px]">
                    {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                  </span>
                  {getRoleBadge()}
                </div>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-brand-neutral-muted hover:text-brand-error hover:bg-red-50 transition-colors focus:outline-none"
                  title="Log out of portal"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <Link to="/student/login" className="btn-primary py-1.5 px-3 text-xs">
                  Resident Login
                </Link>
                <Link to="/coach/login" className="btn-outline py-1.5 px-3 text-xs hidden sm:inline-flex">
                  Coach Portal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
