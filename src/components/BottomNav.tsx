import { Home, Search, Book, History, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const navItems = [
  { path: '/', icon: Home, label: 'Today' },
  { path: '/log', icon: Search, label: 'Log' },
  { path: '/foods', icon: Book, label: 'Foods' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = useMemo(() => {
    const index = navItems.findIndex(item => item.path === location.pathname);
    return index >= 0 ? index : 0;
  }, [location.pathname]);

  const indicatorWidth = `calc(${100 / navItems.length}% - 2.4px)`;
  const indicatorLeft = `calc(${(activeIndex / navItems.length) * 100}% + 6px)`;

  return (
    <nav 
      className="fixed left-0 right-0 z-50 pointer-events-none flex justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
    >
      <div className="nav-pill pointer-events-auto">
        {/* Sliding indicator */}
        <div
          aria-hidden="true"
          className="nav-indicator"
          style={{ 
            width: indicatorWidth, 
            left: indicatorLeft 
          }}
        />

        {/* Nav items */}
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors duration-200 focus-visible:outline-none',
                isActive 
                  ? 'text-foreground dark:text-white' 
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span 
                className={cn(
                  'max-w-[72px] truncate text-center text-[10px] leading-none',
                  isActive ? 'font-semibold' : 'font-normal'
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}