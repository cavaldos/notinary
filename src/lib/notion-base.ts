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


// Hàm để trích xuất giá trị từ các loại thuộc tính (property) của Notion
const extractPropertyValue = (property: any): any => {
    switch (property.type) {
        case 'title':
            return property.title?.[0]?.plain_text || '';
        case 'rich_text':
            return property.rich_text?.[0]?.plain_text || '';
        case 'select':
            return property.select?.name || '';
        case 'multi_select':
            return property.multi_select.map((option: any) => option.name) || [];
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