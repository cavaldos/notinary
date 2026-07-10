import { NextResponse } from 'next/server';
import NotionDatabase from '@/lib/notion-query';
import { sleep } from '@/lib/notion-base';

const MAX_RETRIES = 3;
const DELAY_BETWEEN_MS = 300;

export async function POST(request: Request) {
    try {
        const { operations } = await request.json();

        if (!Array.isArray(operations) || operations.length === 0) {
            return NextResponse.json(
                { success: false, message: 'operations must be a non-empty array' },
                { status: 400 }
            );
        }

        const results: { pageId: string; success: boolean; error?: string }[] = [];

        for (const op of operations) {
            const { pageId, propertyName, selectValue } = op;

            if (!pageId || !propertyName || selectValue === undefined) {
                results.push({ pageId, success: false, error: 'Missing required fields' });
                continue;
            }

            let lastError: string | undefined;

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                const result = await NotionDatabase.updateSelectProperty(
                    pageId,
                    propertyName,
                    selectValue,
                );

                if (result.success) {
                    results.push({ pageId, success: true });
                    break;
                }

                lastError = result.error || 'Notion API error';
                const isRateLimit =
                    result.error?.toLowerCase().includes('rate_limited') ||
                    result.error?.includes('429');

                if (isRateLimit && attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.warn(
                        `[batch/route] Rate limited for ${pageId}, retry ${attempt}/${MAX_RETRIES} in ${delay}ms`,
                    );
                    await sleep(delay);
                    continue;
                }

                if (attempt === MAX_RETRIES) {
                    results.push({ pageId, success: false, error: lastError });
                }
            }

            // Brief delay between items to avoid hammering Notion
            await sleep(DELAY_BETWEEN_MS);
        }

        const succeeded = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        return NextResponse.json({
            success: failed === 0,
            results,
            summary: { total: operations.length, succeeded, failed },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 },
        );
    }
}
