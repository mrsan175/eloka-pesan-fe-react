import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import BottomNav from './BottomNav';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  showHeader?: boolean;
  headerTitle?: string;
  headerShowBack?: boolean;
  headerRightAction?: ReactNode;
  headerTransparent?: boolean;
  className?: string;
  containerClassName?: string;
}

const Layout = ({
  children,
  showBottomNav = true,
  showHeader = false,
  headerTitle,
  headerShowBack,
  headerRightAction,
  headerTransparent,
  className,
  containerClassName,
}: LayoutProps) => {
  return (
    <div className={cn('min-h-screen flex flex-col bg-slate-50', className)}>
      {showHeader && (
        <Header
          title={headerTitle}
          showBack={headerShowBack}
          rightAction={headerRightAction}
          transparent={headerTransparent}
        />
      )}

      <main
        className={cn(
          'flex-1',
          showBottomNav && 'pb-20',
          containerClassName
        )}
      >
        {children}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default Layout;
