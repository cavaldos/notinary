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

// Hàm để lấy dữ liệu từ database với các cột cụ thể
export const getFilteredDatabaseItems = async (databaseId: string): Promise<NotionResponse<any[]>> => {
    try {
        const client = getClient();
        let allResults: any[] = [];
        let hasMore = true;
        let nextCursor: string | undefined = undefined;

        // Lấy tất cả dữ liệu bằng cách phân trang
        while (hasMore) {
            // Truy vấn các items trong database với phân trang
            const response = await client.databases.query({
                database_id: databaseId,
                start_cursor: nextCursor,
                page_size: 100, // Lấy tối đa 100 dòng mỗi lần truy vấn
            });

            allResults = [...allResults, ...response.results];
            hasMore = response.has_more;
            nextCursor = response.next_cursor || undefined;
        }

        // Danh sách các cột cần lấy
        const requiredColumns = ["Word", "Type", "Status", "Level", "Spaced Time", "Pronounce", "Meaning", "Repeat"];

        // Xử lý và lọc dữ liệu
        const filteredData = allResults.map((page: any) => {
            const item: Record<string, any> = {
                id: page.id,
                url: page.url,
                created_time: page.created_time,
                last_edited_time: page.last_edited_time,
            };

            // Lọc các thuộc tính (properties) cần thiết
            Object.keys(page.properties).forEach(propertyName => {
                if (requiredColumns.includes(propertyName)) {
                    const property = page.properties[propertyName];

                    // Xử lý dữ liệu tùy theo loại thuộc tính
                    switch (property.type) {
                        case 'title':
                            item[propertyName] = property.title?.[0]?.plain_text || '';
                            break;
                        case 'rich_text':
                            item[propertyName] = property.rich_text?.[0]?.plain_text || '';
                            break;
                        case 'select':
                            item[propertyName] = property.select?.name || '';
                            break;
                        case 'multi_select':
                            item[propertyName] = property.multi_select.map((option: any) => option.name) || [];
                            break;
                        case 'number':
                            item[propertyName] = property.number;
                            break;
                        case 'date':
                            item[propertyName] = property.date?.start || null;
                            break;
                        case 'checkbox':
                            item[propertyName] = property.checkbox;
                            break;
                        case 'status':
                            item[propertyName] = property.status?.name || '';
                            break;
                        default:
                            item[propertyName] = property[property.type] || null;
                    }
                }
            });

            return item;
        });

        return {
            success: true,
            data: filteredData
        };
    } catch (error: any) {
        console.error('❌ Lỗi khi lấy dữ liệu từ database:', error.body || error.message);
        return {
            success: false,
            error: error.message || 'Không thể lấy dữ liệu từ database'
        };
    }
};

// Hàm để lấy dữ liệu từ database với Status là "In progress"
export const getInProgressItems = async (databaseId: string): Promise<NotionResponse<any[]>> => {
    try {
        const client = getClient();
        let allResults: any[] = [];
        let hasMore = true;
        let nextCursor: string | undefined = undefined;

        // Lấy tất cả dữ liệu bằng cách phân trang với filter
        while (hasMore) {
            // Truy vấn các items trong database với phân trang và filter
            const response = await client.databases.query({
                database_id: databaseId,
                start_cursor: nextCursor,
                page_size: 200, // Lấy tối đa 100 dòng mỗi lần truy vấn
                filter: {
                    property: "Status",
                    status: {
                        equals: "In progress"
                    }
                }
            });

            allResults = [...allResults, ...response.results];
            hasMore = response.has_more;
            nextCursor = response.next_cursor || undefined;
        }

        // Danh sách các cột cần lấy
        const requiredColumns = ["Word", "Type", "Status", "Level", "Spaced Time", "Pronounce", "Meaning", "Repeat"];

        // Xử lý và lọc dữ liệu
        const filteredData = allResults.map((page: any) => {
            const item: Record<string, any> = {
                id: page.id,
                url: page.url,
                created_time: page.created_time,
                last_edited_time: page.last_edited_time,
            };

            // Lọc các thuộc tính (properties) cần thiết
            Object.keys(page.properties).forEach(propertyName => {
                if (requiredColumns.includes(propertyName)) {
                    const property = page.properties[propertyName];

                    // Xử lý dữ liệu tùy theo loại thuộc tính
                    switch (property.type) {
                        case 'title':
                            item[propertyName] = property.title?.[0]?.plain_text || '';
                            break;
                        case 'rich_text':
                            item[propertyName] = property.rich_text?.[0]?.plain_text || '';
                            break;
                        case 'select':
                            item[propertyName] = property.select?.name || '';
                            break;
                        case 'multi_select':
                            item[propertyName] = property.multi_select.map((option: any) => option.name) || [];
                            break;
                        case 'number':
                            item[propertyName] = property.number;
                            break;
                        case 'date':
                            item[propertyName] = property.date?.start || null;
                            break;
                        case 'checkbox':
                            item[propertyName] = property.checkbox;
                            break;
                        case 'status':
                            item[propertyName] = property.status?.name || '';
                            break;
                        default:
                            item[propertyName] = property[property.type] || null;
                    }
                }
            });

            return item;
        });

        return {
            success: true,
            data: filteredData
        };
    } catch (error: any) {
        console.error('❌ Lỗi khi lấy dữ liệu "In progress":', error.body || error.message);
        return {
            success: false,
            error: error.message || 'Không thể lấy dữ liệu "In progress" từ database'
        };
    }
};

// Exporting the functions as a default object for backwards compatibility
const notionAPI = {
    getDatabaseInfo,
    getDatabaseColumns,
    getFilteredDatabaseItems,
    getInProgressItems
};

export default notionAPI;