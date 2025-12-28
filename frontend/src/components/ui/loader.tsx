import React from 'react';

interface LoaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Loader({ className = '', size = 'md' }: LoaderProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-[3px]'
    };

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div
                className={`${sizeClasses[size]} rounded-full border-emerald-500/30 border-t-emerald-500 animate-spin`}
                role="status"
                aria-label="Loading"
            >
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
}
