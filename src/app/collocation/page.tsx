'use client'
import { use } from 'react'

export default function SpaceTime({
    params,
}: {
    params: Promise<{ space: string }>
}) {
    const { space } = use(params)

    return (
        <div>
            <p>{space}</p>
        </div>
    )
}