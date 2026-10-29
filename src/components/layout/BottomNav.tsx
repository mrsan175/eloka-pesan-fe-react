import { Link, useLocation } from 'react-router-dom';
import { Home, Search, User, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Beranda',
    },
    {
      path: '/search',
      icon: Search,
      label: 'Cari Outlet',
    },
    {
      path: '/history',
      icon: History,
      label: 'Riwayat',
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profil',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-safe-bottom z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 relative',
                'min-w-[70px]',
                isActive
                  ? 'text-primary-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 active:scale-95'
              )}
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={cn(
                    'transition-all duration-200',
                    isActive && 'scale-110 text-primary-600'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  'text-[11px] tracking-tight',
                  isActive ? 'font-bold text-primary-600' : 'font-medium text-slate-500'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
