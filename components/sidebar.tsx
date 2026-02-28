'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  Ticket,
  MapPin,
  Layers,
  Image as ImageIcon,
  HelpCircle,
  Navigation,
  Cpu,
  LogOut,
  Menu,
  X,
  Church,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/darshan', label: 'Darshan Updates', icon: Users },
  { href: '/dashboard/ssd', label: 'SSD Status', icon: Ticket },
  { href: '/dashboard/places', label: 'Places', icon: MapPin },
  { href: '/dashboard/services', label: 'Services', icon: Layers },
  { href: '/dashboard/wallpapers', label: 'Wallpapers', icon: ImageIcon },
  { href: '/dashboard/help', label: 'Help Content', icon: HelpCircle },
  { href: '/dashboard/ssd-locations', label: 'SSD Locations', icon: Navigation },
  { href: '/dashboard/scraper', label: 'Scraper', icon: Cpu },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try {
      await authApi.logout();
      router.replace('/login');
    } catch {
      toast.error('Logout failed');
    }
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Church size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Tirumala Admin</p>
          <p className="text-xs text-gray-400">TTD Backend</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item.href, item.exact)
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <item.icon size={18} className="shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-gray-900 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-gray-900 text-white shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile sidebar */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-60 bg-gray-900 h-full">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
