import { NextResponse } from 'next/server';
import NotionDatabase from '@/lib/notion-query';
import { sleep } from '@/lib/notion-base';

const MAX_RETRIES = 3;

export async function POST(request: Request) {
    try {
        const { pageId, propertyName, selectValue } = await request.json();

        if (!pageId) {
            return NextResponse.json(
                { success: false, message: 'ID là bắt buộc' },
                { status: 400 }
            );
        }

        const databaseId = process.env.NOTION_DATABASE_EN_ID;

        if (!databaseId) {
            return NextResponse.json(
                { success: false, message: 'Database ID là bắt buộc' },
                { status: 400 }
            );
        }

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const result = await NotionDatabase.updateSelectProperty(
                pageId, propertyName, selectValue
            );

            if (result.success) {
                return NextResponse.json({
                    success: true,
                    data: result.data,
                });
            }

            const isRateLimit =
                result.error?.toLowerCase().includes('rate_limited') ||
                result.error?.includes('429');

            if (isRateLimit && attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(
                    `[query/route] Notion rate limited, retry ${attempt}/${MAX_RETRIES} in ${delay}ms`
                );
                await sleep(delay);
                continue;
            }

            return NextResponse.json(
                { success: false, error: result.error || 'Notion API error' },
                { status: 502 }
            );
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
