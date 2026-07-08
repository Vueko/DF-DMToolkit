interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const SIZES: Record<NonNullable<SpinnerProps['size']>, string> = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
    return (
        <div
            role="status"
            aria-label="Loading"
            className={`inline-block rounded-full border-ui-surface2 border-t-arcane-light animate-spin ${SIZES[size]} ${className}`}
        />
    )
}
