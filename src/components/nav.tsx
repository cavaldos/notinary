
'use client'

import React from 'react';
import { Grid3X3, Gamepad2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation'
const Navbar: React.FC = () => {
    const navigate = useRouter().push;
    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 ">
                <div className="flex justify-center items-center py-4 px-6">
                    <div className="flex items-center space-x-[50px] text-xl ">
                        {/* Menu Button */}
                        <button
                            onClick={() => navigate('/')}
                            className={`flex items-center justify-center w-12 h-12 rounded-full
                                 transition-all duration-200 bg-beige text-black custom_sd2`}
                        >
                            <Grid3X3 size={20} />
                        </button>

                        {/* Games Button */}
                        <button
                            onClick={() => navigate('/games')}
                            className={`flex items-center justify-center px-6 py-3 rounded-full
                                 transition-all duration-200 bg-beige text-black custom_sd2 `}
                        >
                            <Gamepad2 size={18} className="mr-2" />
                            <span className="">Games</span>
                        </button>

                        {/* Setting Button */}
                        <button
                            onClick={() => navigate('/setting')}
                            className={`flex items-center justify-center w-12 h-12 rounded-full
                                 transition-all duration-200 bg-beige text-black custom_sd2`}
                        >
                            <Settings size={20} />
                        </button>

                    </div>
                </div>
            </div></>
    );
}
export default Navbar;