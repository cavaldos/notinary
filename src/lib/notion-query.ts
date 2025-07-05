
import getClient from '@/lib/notion-base';

/**
 * Hàm để cập nhật bất kỳ thuộc tính nào trong database Notion
 * @param pageId - ID của trang Notion cần cập nhật
 * @param properties - Đối tượng chứa các thuộc tính cần cập nhật
 * @returns Promise với kết quả cập nhật
 * 
 * Ví dụ sử dụng:
 * 
 * // Cập nhật trạng thái
 * updateDatabase('page_id', {
 *   'Status': { status: { name: 'Done' } }
 * });
 * 
 * // Cập nhật tiêu đề
 * updateDatabase('page_id', {
 *   'Title': { title: [{ text: { content: 'Tiêu đề mới' } }] }
 * });
 * 
 * // Cập nhật nhiều thuộc tính cùng lúc
 * updateDatabase('page_id', {
 *   'Status': { status: { name: 'In Progress' } },
 *   'Priority': { select: { name: 'High' } },
 *   'Due Date': { date: { start: '2025-07-10' } }
 * });
 */
export const updateDatabase = async (pageId: string, properties: Record<string, any>): Promise<any> => {
    try {
        const client = getClient();

        // Gọi API để cập nhật thuộc tính của trang
        const response = await client.pages.update({
            page_id: pageId,
            properties: properties
        });

        return {
            success: true,
            data: response
        };
    } catch (error: any) {
        console.error('❌ Lỗi khi cập nhật thuộc tính:', error.body || error.message);
        return {
            success: false,
            error: error.message || 'Không thể cập nhật thuộc tính'
        };
    }
};




/**
 * Hàm tiện ích để cập nhật giá trị của một thuộc tính select
 * @param pageId - ID của trang Notion cần cập nhật
 * @param propertyName - Tên của thuộc tính select cần cập nhật
 * @param selectValue - Giá trị mới cho thuộc tính select
 * @returns Promise với kết quả cập nhật
 */
export const updateSelectProperty = async (
    pageId: string,
    propertyName: string,
    selectValue: string
): Promise<any> => {
    const properties: Record<string, any> = {};
    properties[propertyName] = {
        select: {
            name: selectValue
        }
    };
    return updateDatabase(pageId, properties);
};

/**
 * Hàm tiện ích để cập nhật giá trị của một thuộc tính rich text
 * @param pageId - ID của trang Notion cần cập nhật
 * @param propertyName - Tên của thuộc tính rich text cần cập nhật
 * @param textContent - Nội dung văn bản mới
 * @returns Promise với kết quả cập nhật
 */
export const updateRichTextProperty = async (
    pageId: string,
    propertyName: string,
    textContent: string
): Promise<any> => {
    const properties: Record<string, any> = {};
    properties[propertyName] = {
        rich_text: [
            {
                type: "text",
                text: {
                    content: textContent
                }
            }
        ]
    };
    return updateDatabase(pageId, properties);
};

/**
 * Hàm tiện ích để cập nhật giá trị của một thuộc tính ngày tháng
 * @param pageId - ID của trang Notion cần cập nhật
 * @param propertyName - Tên của thuộc tính ngày tháng cần cập nhật
 * @param startDate - Ngày bắt đầu (định dạng ISO string)
 * @param endDate - Ngày kết thúc (tùy chọn, định dạng ISO string)
 * @returns Promise với kết quả cập nhật
 */
export const updateDateProperty = async (
    pageId: string,
    propertyName: string,
    startDate: string,
    endDate?: string
): Promise<any> => {
    const properties: Record<string, any> = {};
    const dateValue: { start: string; end?: string } = { start: startDate };

    if (endDate) {
        dateValue.end = endDate;
    }

    properties[propertyName] = { date: dateValue };
    return updateDatabase(pageId, properties);
};

/**
 * Hàm tiện ích để cập nhật giá trị của một thuộc tính checkbox
 * @param pageId - ID của trang Notion cần cập nhật
 * @param propertyName - Tên của thuộc tính checkbox cần cập nhật
 * @param checked - Trạng thái mới của checkbox (true/false)
 * @returns Promise với kết quả cập nhật
 */
export const updateCheckboxProperty = async (
    pageId: string,
    propertyName: string,
    checked: boolean
): Promise<any> => {
    const properties: Record<string, any> = {};
    properties[propertyName] = { checkbox: checked };
    return updateDatabase(pageId, properties);
};

// Exporting the functions as a default object for backwards compatibility
const notionAPI = {
    updateDatabase,
    updateSelectProperty,
    updateRichTextProperty,
    updateDateProperty,
    updateCheckboxProperty
};

export default notionAPI;