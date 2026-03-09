// Sidebar: main navigation with collapsible menu
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Instagram,
  Youtube,
  Music2,
  Kanban,
  Sparkles,
  BarChart3,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/instagram', icon: Instagram, label: 'Instagram' },
  { to: '/tiktok', icon: Music2, label: 'TikTok' },
  { to: '/youtube', icon: Youtube, label: 'YouTube' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/script-generator', icon: Sparkles, label: 'Script Generator' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/brain', icon: Brain, label: 'Joshua Brain' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-jb-card border-r border-jb-border z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-jb-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-jb-accent flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-jb-bg" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-jb-text tracking-tight whitespace-nowrap">
            Joshua Brain
          </span>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-jb-accent/10 text-jb-accent'
                  : 'text-jb-text-secondary hover:text-jb-text hover:bg-jb-bg'
              }`
            }
          >
            <item.icon size={19} className="flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center h-12 border-t border-jb-border text-jb-text-muted hover:text-jb-text transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
