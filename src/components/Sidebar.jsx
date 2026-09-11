import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  Upload,
  FolderArchive,
  Share2,
  TrendingUp,
  QrCode,
  CheckSquare,
  MessageSquare,
  Database,
  Flag,
  Users,
  Smile,
  CheckCircle,
  ShieldCheck,
  UserCheck,
  FileBarChart,
  Layers,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { role, user } = useAuth();

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/attendance', label: 'Mark Attendance', icon: Clock },
    { to: '/student/submit-assignment', label: 'Submit Assignment', icon: Upload },
    { to: '/student/submit-module-project', label: 'Submit Module Project', icon: FolderArchive },
    { to: '/student/submit-social-media', label: 'Submit Social Media', icon: Share2 },
    { to: '/student/performance', label: 'My Performance', icon: TrendingUp },
  ];

  const coachLinks = [
    { to: '/coach/dashboard', label: 'Coach Overview', icon: LayoutDashboard },
    { to: '/coach/grade-submissions', label: 'Grade Submissions', icon: CheckSquare },
    { to: '/coach/class-activity', label: 'Record Class Activity', icon: MessageSquare },
    { to: '/coach/grade-module-projects', label: 'Grade Module Projects', icon: Database },
    { to: '/coach/grade-capstone', label: 'Grade Capstone Sprints', icon: Flag },
    { to: '/coach/grade-presentations', label: 'Grade Presentations', icon: Users },
    { to: '/coach/soft-skills', label: 'Soft Skills Evaluation', icon: Smile },
    { to: '/coach/approve-social-media', label: 'Approve Social Media', icon: CheckCircle },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Cohort Overview', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Manage Residents', icon: Users },
    { to: '/admin/coaches', label: 'Manage Coaches', icon: UserCheck },
    { to: '/admin/create-capstone-group', label: 'Create Capstone Group', icon: Layers },
    { to: '/admin/reports', label: 'Performance Reports', icon: FileBarChart },
  ];

  let links = [];
  let roleTitle = 'Navigation';

  if (role === 'student') {
    links = studentLinks;
    roleTitle = 'Resident Portal';
  } else if (role === 'coach') {
    links = coachLinks;
    roleTitle = 'Coach Operations';
  } else if (role === 'admin') {
    links = adminLinks;
    roleTitle = 'System Admin';
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-brand-neutral-border z-30 transform transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Section Header */}
          <div className="px-3 flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {roleTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Collapse sidebar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onClose) {
                      onClose();
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-xs font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-brand-primary'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-brand-neutral-border/60 bg-gray-50/70">
          <div className="text-xs space-y-1 text-brand-neutral-muted">
            <p className="font-semibold text-brand-neutral">ITF-NECA TSDP 2026</p>
            <p>ShamzBridge Consult</p>
            <p className="text-[10px] text-gray-400">Cohort 1 · Data Analytics</p>
          </div>
        </div>
      </aside>
    </>
  );
}
