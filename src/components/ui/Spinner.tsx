import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const Spinner = ({ size = 'md', className, label }: SpinnerProps) => {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={cn('animate-spin text-primary-500', className)}
        size={sizes[size]}
      />
      {label && (
        <p className="text-sm text-secondary-600 animate-pulse">{label}</p>
      )}
    </div>
  );
};

export default Spinner;