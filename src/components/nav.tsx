'use client'

import React from 'react'
import { ChevronLeft, Grid3X3, ChevronRight} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

const Navbar: React.FC = () => {
    const router = useRouter()
    const pathname = usePathname()

    const levels = ['/L1', '/L2', '/L3', '/L4']
    const currentLevelIndex = levels.indexOf(pathname)

    const goPrev = () => {
        if (currentLevelIndex !== -1) {
            const prevIndex = (currentLevelIndex - 1 + levels.length) % levels.length
            router.push(levels[prevIndex])
        } else {
            router.back()
        }
    }

    const goNext = () => {
        if (currentLevelIndex !== -1) {
            const nextIndex = (currentLevelIndex + 1) % levels.length
            router.push(levels[nextIndex])
        } else {
            router.push('/L1')
        }
    }

    if (pathname === '/') return null

    return (
        <>
            <div className="fixed bottom-2 left-0 right-0 z-50 flex justify-center pb-1">
                <div className="bg-beige text-grey-dark rounded-full px-3 py-1 flex items-center gap-4 shadow-lg transition-all duration-300">
                    <button
                        onClick={goPrev}
                        className="p-1 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="p-1 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                        <Grid3X3 size={18} />
                    </button>
                    <button
                        onClick={goNext}
                        className="p-1 hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

        </>
    )
}

export default Navbar