import { Client } from '@notionhq/client';

// Kiểm tra token và khởi tạo Notion client
const getNotionClient = (): Client => {
    if (!process.env.NOTION_TOKEN) {
        throw new Error('NOTION_TOKEN không được tìm thấy trong environment variables');
    }

    return new Client({
        auth: process.env.NOTION_TOKEN,
    });
};

// Cache client instance
let notionClient: Client | null = null;

const getClient = (): Client => {
    if (!notionClient) {
        notionClient = getNotionClient();
    }
    return notionClient;
};

/**
 * Utility sleep function
 */
export const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a Notion API call with exponential backoff retry for rate limits (429).
 * Retries up to `maxRetries` times with delays: 1s, 2s, 4s, 8s...
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options?: { maxRetries?: number; baseDelayMs?: number }
): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const baseDelayMs = options?.baseDelayMs ?? 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: unknown) {
            const err = error as Record<string, unknown>;
            const isRateLimit =
                err?.status === 429 ||
                (err?.body as Record<string, unknown>)?.code === 'rate_limited' ||
                err?.code === 'rate_limited';

            if (isRateLimit && attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                console.warn(
                    `[Notion Retry] Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`
                );
                await sleep(delay);
                continue;
            }

            throw error; // Re-throw if not rate limit or out of retries
        }
    }

    throw new Error('Max retries exceeded');
}

type NotionPropertyValue = {
    type: string;
    title?: Array<{ plain_text?: string }>;
    rich_text?: Array<{ plain_text?: string }>;
    select?: { name?: string } | null;
    multi_select?: Array<{ name?: string }>;
    number?: number | null;
    date?: { start?: string } | null;
    checkbox?: boolean;
    status?: { name?: string } | null;
} & Record<string, unknown>;

// Hàm để trích xuất giá trị từ các loại thuộc tính (property) của Notion
const extractPropertyValue = (property: NotionPropertyValue): unknown => {
    switch (property.type) {
        case 'title':
            return property.title?.[0]?.plain_text || '';
        case 'rich_text':
            return property.rich_text?.[0]?.plain_text || '';
        case 'select':
            return property.select?.name || '';
        case 'multi_select':
            return property.multi_select?.map((option) => option.name).filter((name): name is string => Boolean(name)) || [];
        case 'number':
            return property.number;
        case 'date':
            return property.date?.start || null;
        case 'checkbox':
            return property.checkbox;
        case 'status':
            return property.status?.name || '';
        default:
            return property[property.type] || null;
    }
};

export { extractPropertyValue }

export default getClient;