import { NextRequest, NextResponse } from 'next/server';
import NotionDatabase from '@/lib/notion-api-en';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

// Định nghĩa thời gian cache (5 phút)
const CACHE_TTL = 10 * 60; // 5 phút

// Hàm để lấy dữ liệu từ Notion với cache
const getNotionDataWithCache = unstable_cache(
    async (databaseId: string) => {
        return await NotionDatabase.getFilteredDatabaseItems(databaseId);
    },
    // Cache key array - các tham số ảnh hưởng đến cache
    ['notion-in-progress-items'],
    // Tùy chọn cache
    { revalidate: CACHE_TTL, tags: ['notion-data'] }
);

export async function GET(request: NextRequest) {
    try {
        const databaseId = process.env.NOTION_DATABASE_EN_ID;
        const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

        if (!databaseId) {
            return NextResponse.json(
                { success: false, message: 'Database ID là bắt buộc' },
                { status: 400 }
            );
        }

        // Nếu có tham số refresh=true thì lấy dữ liệu trực tiếp, không dùng cache
        const result = forceRefresh
            ? await NotionDatabase.getFilteredDatabaseItems(databaseId)
            : await getNotionDataWithCache(databaseId);

        // Tạo response với cache control headers
        const response = NextResponse.json({
            success: true,
            property: result.data?.length,
            data: result, // Trả về array các tên property
            message: 'Lấy thông tin database thành công',
            cached: !forceRefresh,
            cachedAt: new Date().toISOString()
        });

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

// Endpoint để xóa cache và lấy dữ liệu mới
export async function POST() {
    try {
        // Revalidate the cache tag
        revalidateTag('notion-data', 'max');

        return NextResponse.json({
            success: true,
            message: 'Cache đã được xóa thành công'
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}