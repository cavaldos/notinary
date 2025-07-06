import { extractPropertyValue } from '@/lib/notion-base';
import getClient from '@/lib/notion-base';

// Hàm để lấy thông tin database
export const getDatabaseInfo = async (databaseId: string): Promise<any> => {
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
        console.error('Lỗi khi lấy thông tin database:2', error);
        return {
            success: false,
            error: error.message || 'Không thể lấy thông tin database'
        };
    }
};

// Hàm để lấy danh sách các cột (properties) của database
export const getDatabaseColumns = async (databaseId: string): Promise<any> => {
    try {
        const client = getClient();
        const response = await client.databases.retrieve({
            database_id: databaseId,
        });

        const columns: any[] = [];
        const properties = response.properties;

        Object.keys(properties).forEach((key) => {
            const prop = properties[key];
            const columnInfo: any = {
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

        const databaseInfo: any = {
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
export const getFilteredDatabaseItems = async (databaseId: string): Promise<any> => {
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
                    item[propertyName] = extractPropertyValue(property);
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
export const getInProgressItems = async (databaseId: string, pageSize: number = 200): Promise<any> => {
    try {
        const client = getClient();

        // Truy vấn các items trong database với page_size cố định
        const response = await client.databases.query({
            database_id: databaseId,
            page_size: pageSize,
            filter: {
                or: [
                    {
                        property: "Status",
                        status: {
                            equals: "In progress"
                        }
                    },
                    {
                        property: "Status",
                        status: {
                            equals: "Not started"
                        }
                    }
                ]
            }
        });

        // Danh sách các cột cần lấy
        const requiredColumns = ["Word", "Type", "Status", "Level", "Spaced Time", "Pronounce", "Meaning", "Repeat"];

        // Xử lý và lọc dữ liệu
        const filteredData = response.results.map((page: any) => {
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
                    item[propertyName] = extractPropertyValue(property);
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

export const getSpacedTimeItems = async (
    databaseId: string,
    pageSize: number = 200,
    includeEmpty: boolean = true,
    spacedTimeValue: string,
    notStatus: string = "Done"
): Promise<any> => {
    try {
        const client = getClient();
        let allResults: any[] = [];
        let hasMore = true;
        let nextCursor: string | undefined = undefined;

        // Tạo filter cho Spaced Time dựa vào tham số includeEmpty
        const spacedTimeFilters: any[] = [];

        if (includeEmpty) {
            spacedTimeFilters.push({
                property: "Spaced Time",
                select: {
                    is_empty: true
                }
            });
        }

        spacedTimeFilters.push({
            property: "Spaced Time",
            select: {
                equals: spacedTimeValue
            }
        });

        // Lấy tất cả dữ liệu bằng cách phân trang
        while (hasMore) {
            // Truy vấn các items trong database với phân trang
            const response = await client.databases.query({
                database_id: databaseId,
                start_cursor: nextCursor,
                page_size: 100, // Lấy tối đa 100 dòng mỗi lần truy vấn
                filter: {
                    and: [
                        {
                            or: spacedTimeFilters
                        },
                        {
                            property: "Status",
                            status: {
                                does_not_equal: notStatus
                            }
                        }
                    ]
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
                    item[propertyName] = extractPropertyValue(property);
                }
            });

            return item;
        });

        return {
            success: true,
            data: filteredData
        };
    } catch (error: any) {
        console.error('❌ Lỗi khi lấy dữ liệu "Spaced Time":', error.body || error.message);
        return {
            success: false,
            error: error.message || 'Không thể lấy dữ liệu "Spaced Time" từ database'
        };
    }
};





// Hàm để cập nhật trạng thái của một mục
export const updateStatus = async (pageId: string, status: string): Promise<any> => {
    try {
        const client = getClient();

        // Gọi API để cập nhật trạng thái của trang
        const response = await client.pages.update({
            page_id: pageId,
            properties: {
                "Status": {
                    status: {
                        name: status
                    }
                }
            }
        });

        return {
            success: true,
            data: response
        };
    } catch (error: any) {
        console.error('❌ Lỗi khi cập nhật trạng thái thành "Done":', error.body || error.message);
        return {
            success: false,
            error: error.message || 'Không thể cập nhật trạng thái'
        };
    }
};



// Exporting the functions as a default object for backwards compatibility
const notionAPI = {
    getDatabaseInfo,
    getDatabaseColumns,
    getFilteredDatabaseItems,
    getInProgressItems,
    updateStatus,
    getSpacedTimeItems
};

export default notionAPI;