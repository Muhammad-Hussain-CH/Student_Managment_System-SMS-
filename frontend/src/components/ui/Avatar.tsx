import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export const Avatar = ({ name, url, size = 'md', className }: AvatarProps) => {
  return (
    <div className={cn('relative flex-shrink-0 rounded-full overflow-hidden bg-primary-100', sizeClasses[size], className)}>
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-semibold text-primary-700">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};
