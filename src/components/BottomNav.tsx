import { Home, Search, Book, History, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-card backdrop-blur-xl rounded-full shadow-lg shadow-black/20 border border-border/30 safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-2xl transition-all duration-200',
                  isActive 
                    ? 'bg-secondary text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
