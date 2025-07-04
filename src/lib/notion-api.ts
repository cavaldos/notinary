import { Client } from '@notionhq/client';

interface ColumnOption {
    name: string;
    color: string;
}

interface ColumnInfo {
    name: string;
    type: string;
    id: string;
    options?: ColumnOption[];
    database_id?: string;
    expression?: string;
    format?: string;
}

interface DatabaseInfo {
    database_name: string;
    total_columns: number;
    columns: ColumnInfo[];
}

interface NotionResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

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

// Hàm để lấy thông tin database
export const getDatabaseInfo = async (databaseId: string): Promise<NotionResponse> => {
    try {
        const client = getClient();
        const response = await client.databases.retrieve({
            database_id: databaseId,
        });

        return {
            success: true,
            data: response
        };
    } catch (error: any) {
        console.error('Lỗi khi lấy thông tin database:', error);
        return {
            success: false,
            error: error.message || 'Không thể lấy thông tin database'
        };
    }
};

// Hàm để lấy danh sách các cột (properties) của database
export const getDatabaseColumns = async (databaseId: string): Promise<NotionResponse<DatabaseInfo>> => {
    try {
        const client = getClient();
        const response = await client.databases.retrieve({
            database_id: databaseId,
        });

        const columns: ColumnInfo[] = [];
        const properties = response.properties;

        Object.keys(properties).forEach((key) => {
            const prop = properties[key];
            const columnInfo: ColumnInfo = {
                name: key,
                type: prop.type,
                id: prop.id
            };

            // Thêm thông tin chi tiết cho từng loại cột
            switch (prop.type) {
                case 'select':
                    columnInfo.options = (prop as any).select?.options?.map((opt: any) => ({
                        name: opt.name,
                        color: opt.color
                    }));
                    break;
                case 'multi_select':
                    columnInfo.options = (prop as any).multi_select?.options?.map((opt: any) => ({
                        name: opt.name,
                        color: opt.color
                    }));
                    break;
                case 'status':
                    columnInfo.options = (prop as any).status?.options?.map((opt: any) => ({
                        name: opt.name,
                        color: opt.color
                    }));
                    break;
                case 'relation':
                    columnInfo.database_id = (prop as any).relation?.database_id;
                    break;
                case 'formula':
                    columnInfo.expression = (prop as any).formula?.expression;
                    break;
                case 'number':
                    columnInfo.format = (prop as any).number?.format;
                    break;
            }

            columns.push(columnInfo);
        });

        const databaseInfo: DatabaseInfo = {
            database_name: (response as any).title?.map((t: any) => t.text.content).join('') || 'Unknown Database',
            total_columns: columns.length,
            columns: columns
        };

        return {
            success: true,
            data: databaseInfo
        };
    } catch (error: any) {
        console.error('❌ Lỗi khi lấy danh sách cột:', error.body || error.message);
        return {
            success: false,
            error: error.message || 'Không thể lấy danh sách cột'
        };
    }
};

// Exporting the functions as a default object for backwards compatibility
const notionAPI = {
    getDatabaseInfo,
    getDatabaseColumns
};

export default notionAPI;