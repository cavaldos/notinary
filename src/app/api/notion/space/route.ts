import { NextResponse } from 'next/server';
import NotionDatabase from '@/lib/notion-api-en';
import { withRetry, sleep } from '@/lib/notion-base';

const MAX_RETRIES = 3;

export async function POST(request: Request) {
    try {
        const { pageSize, equalsValue } = await request.json();

        const databaseId = process.env.NOTION_DATABASE_EN_ID;

        if (!databaseId) {
            return NextResponse.json(
                { success: false, message: 'Database ID là bắt buộc' },
                { status: 400 }
            );
        }

        // Retry loop with exponential backoff for rate limits
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const result = await NotionDatabase.getSpacedTimeItems(
                databaseId, pageSize, false, equalsValue
            );

            if (result.success) {
                return NextResponse.json({
                    success: true,
                    length: result.data?.length,
                    data: result.data,
                });
            }

            // Check if this is a rate-limit error
            const isRateLimit =
                result.error?.toLowerCase().includes('rate_limited') ||
                result.error?.includes('429');

            if (isRateLimit && attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.warn(
                    `[space/route] Notion rate limited, retry ${attempt}/${MAX_RETRIES} in ${delay}ms`
                );
                await sleep(delay);
                continue;
            }

            // Non-retryable error or out of retries → return error status
            return NextResponse.json(
                { success: false, error: result.error || 'Notion API error' },
                { status: 502 }
            );
        }
    } catch (error: any) {
        console.error('[space/route] Unexpected error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
