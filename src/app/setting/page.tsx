'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const Setting: React.FC = () => {
    const navigate = useRouter().push;
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
            </ul>
        </div>
    );
}

export default Setting;
