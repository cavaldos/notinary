'use client';

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

const ThemeRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useSelector((state: RootState) => state.setting?.theme || 'light');

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    }, [theme]);

    return <>{children}</>;
};

export default ThemeRoot;
