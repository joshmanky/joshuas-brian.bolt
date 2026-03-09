// Layout: main app shell with sidebar + content area + mobile drawer
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-jb-bg">
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <Sidebar collapsed={false} onToggle={() => {}} onMobileClose={() => setMobileOpen(false)} />
        </div>
      )}

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
        }`}
      >
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-jb-border bg-jb-bg/80 backdrop-blur-md flex-shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-jb-text-secondary hover:text-jb-text p-1"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="lg:hidden text-sm font-bold text-jb-text tracking-tight">Joshua Brain</div>
          <div className="hidden lg:block" />
          <div />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
