import { cn } from '@/lib/utils'

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
}

export function LoadingSpinner({
  className,
  size = 'md',
  variant = 'primary',
  ...props
}: LoadingSpinnerProps) {
  const sizeStyles = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const variantStyles = {
    primary: 'text-green-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  }

  return (
    <div
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <svg
        className={cn(
          'animate-spin',
          sizeStyles[size],
          variantStyles[variant]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export function LoadingDots({
  className,
  size = 'md',
  color = 'bg-green-600',
  ...props
}: LoadingDotsProps) {
  const sizeStyles = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  }

  return (
    <div className={cn('flex space-x-1', className)} {...props}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-bounce',
            sizeStyles[size],
            color
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  )
}

interface LoadingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number
  variant?: 'primary' | 'secondary'
  showLabel?: boolean
}

export function LoadingBar({
  className,
  progress = 0,
  variant = 'primary',
  showLabel = false,
  ...props
}: LoadingBarProps) {
  const variantStyles = {
    primary: 'bg-green-600',
    secondary: 'bg-gray-600'
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Loading</span>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={cn(
            'h-2.5 rounded-full transition-all duration-300',
            variantStyles[variant]
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}