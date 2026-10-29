import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
  className?: string;
  transparent?: boolean;
}

const Header = ({
  title,
  showBack = false,
  onBack,
  rightAction,
  className,
  transparent = false,
}: HeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 left-0 right-0 z-30 pt-safe-top',
        transparent ? 'bg-transparent' : 'bg-white border-b border-secondary-200',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 flex-1">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-secondary-100 active:scale-95 transition-all"
            >
              <ArrowLeft size={24} className="text-secondary-700" />
            </button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-secondary-900 truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Right Section */}
        {rightAction && <div className="flex items-center">{rightAction}</div>}
      </div>
    </header>
  );
};

export default Header;