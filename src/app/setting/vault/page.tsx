'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Vault: React.FC = () => {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-[85%] font-bold p-6 relative">
            <button
                className="absolute top-4 left-4  font-extrabold text-black py-2 px-4"
                onClick={() => router.back()}>
                <ChevronLeft className='font-extrabold text-4xl' />
            </button>
        </div>
    );
};

export default Vault;