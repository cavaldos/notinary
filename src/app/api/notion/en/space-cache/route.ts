import { NextResponse } from 'next/server';
import NotionDatabase from '@/lib/notion-api-en';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

// Định nghĩa thời gian cache (15 phút)
const CACHE_TTL = 15 * 60; // 15 phút

// Hàm để lấy dữ liệu từ Notion với cache
const getSpacedTimeItemsWithCache = unstable_cache(
    async (databaseId: string, pageSize: number, isEmpty: boolean, equalsValue: string) => {
        return await NotionDatabase.getSpacedTimeItems(databaseId, pageSize, isEmpty, equalsValue);
    },
    // Cache key array - các tham số ảnh hưởng đến cache
    ['notion-spaced-time-items'],
    // Tùy chọn cache
    { revalidate: CACHE_TTL, tags: ['notion-spaced-time-data'] }
);

export async function POST(request: Request) {
    try {
        const { pageSize, equalsValue, forceRefresh } = await request.json();

        const databaseId = process.env.NOTION_DATABASE_EN_ID;

        if (!databaseId) {
            return NextResponse.json(
                { success: false, message: 'Database ID là bắt buộc' },
                { status: 400 }
            );
        }
        let isEmpty = false;
        if (equalsValue === "L1") {
            isEmpty = true;
        }

        // Nếu có tham số forceRefresh=true thì lấy dữ liệu trực tiếp, không dùng cache
        const result = forceRefresh
            ? await NotionDatabase.getSpacedTimeItems(databaseId, pageSize, isEmpty, equalsValue)
            : await getSpacedTimeItemsWithCache(databaseId, pageSize, isEmpty, equalsValue);

        const response = NextResponse.json(
            {
                success: result.success,
                length: result.data?.length,
                data: result.data,
                cached: !forceRefresh,
                cachedAt: new Date().toISOString()
            },
        );

        // Thêm cache control headers
        response.headers.set('Cache-Control', `s-maxage=${CACHE_TTL}, stale-while-revalidate`);

        return response;
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

// Endpoint to clear the cache and fetch fresh data
export async function DELETE() {
    try {
        // Revalidate the cache tag
        revalidateTag('notion-spaced-time-data', 'max');

        return NextResponse.json({
            success: true,
            message: 'Cache cho spaced time items đã được xóa thành công'
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}