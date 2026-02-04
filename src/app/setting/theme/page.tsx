'use client';

import React from 'react';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { setTheme } from '@/redux/features/settingSlice';

const ThemeSetting: React.FC = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const theme = useSelector((state: RootState) => state.setting?.theme || 'light');

    const options = [
        {
            key: 'light',
            label: 'Light',
            description: 'Beige background with soft shadows',
            icon: Sun,
        },
        {
            key: 'dark',
            label: 'Dark',
            description: 'Dark background with soft contrast',
            icon: Moon,
        },
    ] as const;

    return (
        <div className="flex flex-col items-center justify-center h-[85%] font-bold p-6 relative">
            <button
                className="absolute top-4 left-4 font-extrabold text-black py-2 px-4"
                onClick={() => router.back()}>
                <ChevronLeft className='font-extrabold text-4xl' />
            </button>

            <h1 className="text-4xl font-bold mb-6">Theme</h1>
            <div className="flex flex-col gap-4 w-full max-w-sm">
                {options.map((option) => {
                    const Icon = option.icon;
                    const isActive = theme === option.key;
                    return (
                        <button
                            key={option.key}
                            onClick={() => dispatch(setTheme(option.key))}
                            className={`flex items-center justify-between gap-4 w-full p-4 rounded-2xl shadow-md transition-all ${
                                isActive ? 'bg-beige text-black' : 'bg-white text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                    isActive ? 'bg-black/10' : 'bg-gray-100'
                                }`}>
                                    <Icon size={20} />
                                </span>
                                <div className="text-left">
                                    <div className="text-lg">{option.label}</div>
                                    <div className="text-sm font-normal text-gray-600">{option.description}</div>
                                </div>
                            </div>
                            <span className={`text-sm font-semibold ${isActive ? '' : 'text-gray-500'}`}>
                                {isActive ? 'Active' : 'Select'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ThemeSetting;
