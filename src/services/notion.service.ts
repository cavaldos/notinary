import axiosinstance from './axios.config';

const NotionService = {
    async getWordInprogress() {
        const response = (await axiosinstance.get(`/api/notion`)) as Record<string, unknown>;

        // If the API returned an error (non-2xx), it would have thrown
        // But double-check the response payload
        if (response?.success === false) {
            throw new Error((response.error as string) || 'Failed to fetch in-progress items');
        }

        return response;
    },

    async upDateToDone(id: string) {
        const response = (await axiosinstance.post(`/api/notion`, {
            pageId: id,
        })) as Record<string, unknown>;

        if (response?.success === false) {
            throw new Error((response.error as string) || 'Failed to update status');
        }

        return response;
    },

    async updateSpacedTime(pageId: string, selectValue: string, status: string) {
        const levels = ['L1', 'L2', 'L3', 'L4', 'L5'];

        if (!levels.includes(selectValue)) {
            throw new Error('Giá trị select không hợp lệ');
        }

        if (status !== 'up' && status !== 'down') {
            throw new Error('Status phải là "up" hoặc "down"');
        }

        // Tìm index của level hiện tại
        const currentIndex = levels.indexOf(selectValue);
        let newIndex: number;

        if (status === 'up') {
            newIndex = Math.min(currentIndex + 1, levels.length - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }

        const newSelectValue = levels[newIndex];

        const response = (await axiosinstance.post(`/api/notion/query`, {
            pageId: pageId,
            propertyName: 'Spaced Time',
            selectValue: newSelectValue,
        })) as Record<string, unknown>;

        if (response?.success === false) {
            throw new Error((response.error as string) || 'Failed to update spaced time');
        }

        return response;
    },

    async batchMoveToLevel(pageIds: string[], targetLevel: string) {
        const levels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

        if (!levels.includes(targetLevel)) {
            throw new Error('Target level không hợp lệ');
        }

        const operations = pageIds.map((pageId) => ({
            pageId,
            propertyName: 'Spaced Time',
            selectValue: targetLevel,
        }));

        const response = (await axiosinstance.post(`/api/notion/batch`, {
            operations,
        })) as Record<string, unknown>;

        if (response?.success === false) {
            throw new Error((response.error as string) || 'Failed to batch update spaced time');
        }

        return response;
    },

    async getSpacedTimeItems(pageSize: number, equalsValue: string) {
        const response = (await axiosinstance.post(`/api/notion/space`, {
            pageSize: pageSize,
            equalsValue: equalsValue,
        })) as Record<string, unknown>;

        // API route may return success:false for rate-limit errors
        // (those come through as 502 status → axios throws → we re-throw)
        // But also check the payload for safety
        if (response?.success === false) {
            throw new Error((response.error as string) || 'Failed to fetch spaced time items');
        }

        return response;
    },
};

export default NotionService;
