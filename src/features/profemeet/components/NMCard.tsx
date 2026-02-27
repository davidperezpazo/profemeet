import React from 'react';

interface Props {
    children: React.ReactNode;
    variant?: 'flat' | 'inset';
    className?: string;
}

export function NMCard({
    children,
    variant = 'flat',
    className = ''
}: Props) {
    const baseClass = variant === 'inset' ? 'nm-inset' : 'nm-flat';

    return (
        <div className={`${baseClass} p-6 ${className}`}>
            {children}
        </div>
    );
}
