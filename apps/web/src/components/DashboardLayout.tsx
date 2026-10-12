import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Award,
  Shield,
  FileText,
  Settings,
  Users,
  History,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Events & Workshops', path: '/dashboard/events', icon: Calendar },
    { label: 'Issued Credentials', path: '/dashboard/credentials', icon: Award },
    { label: 'Digital Badges', path: '/dashboard/badges', icon: Shield },
    { label: 'Certificate Templates', path: '/dashboard/templates', icon: FileText },
    { label: 'Organization & Keys', path: '/dashboard/settings', icon: Settings },
  ];

  const adminItems = [
    { label: 'Issuer Directory', path: '/admin/issuers', icon: Users },
    { label: 'System Audit Log', path: '/admin/audit', icon: History },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Award className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Certifier</span>
          </Link>
          <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-xs font-semibold text-slate-900 truncate">
              {user.organization.name}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <StatusBadge status={user.organization.approvalStatus || 'approved'} showIcon={false} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Issuer Portal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Governance & Audit
          </div>
          {adminItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="truncate mr-2">
              <div className="text-xs font-semibold text-slate-900 truncate">{user.displayName}</div>
              <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-800 capitalize">
              {location.pathname.replace('/dashboard/', '').replace('/dashboard', 'Overview').replace('/', ' / ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/issuers/${user.organization.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <span>Public Issuer Profile</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="h-4 w-px bg-slate-200" />
            <Link
              to="/verify"
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verify ID</span>
            </Link>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
