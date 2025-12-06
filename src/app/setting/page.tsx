'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NotionService from '@/services/notion.service';

const Setting: React.FC = () => {
    const navigate = useRouter().push;
    const [resetting, setResetting] = useState(false);
    const items = [
        {
            label: "Vault",
            path: "/setting/vault"
        },
        {
            label: "Theme",
            path: "/setting/theme"
        },

    ];

    const handleResetCache = async () => {
        setResetting(true);
        try {
            const response: any = await NotionService.resetCache();
            if (response?.success) {
            } else {
            }
        } catch (error: any) {
            console.error('Lỗi khi reset cache:', error);
            alert('Xảy ra lỗi khi reset cache');
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-[85%] font-bold p-6">
            <h1 className="text-4xl font-bold mb-6">Settings</h1>
            <ul className="flex flex-col gap-4 w-full max-w-sm">
                {items.map((item, index) => (
                    <li
                        onClick={() => navigate(item.path)}
                        key={index} className="bg-white p-4 rounded-full shadow-md text-center text-lg
                                                 hover:shadow-lg hover:cursor-pointer">
                        {item.label}
                    </li>
                ))}
                <li
                    onClick={handleResetCache}
                    className="bg-white p-4 rounded-full shadow-md text-center text-lg hover:shadow-lg hover:cursor-pointer text-red-600">
                    {resetting ? 'Resetting cache...' : 'Reset Cache'}
                </li>
            </ul>
        </div>
    );
}

export default Setting;
