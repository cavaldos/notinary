import axiosinstance from './axios.config';



const NotionService = {
    async getWordInprogress() {
        try {
            const response = await axiosinstance.get(`/api/notion`);
            return response
        }
        catch (error: any) {
            console.error('Lỗi khi lấy thông tin database:1', error);
            return {
                success: false,
                error: error.message || 'Không thể lấy thông tin database'
            };
        }
    },
    async getEntireWord() {
        try {
            const response = await axiosinstance.get(`/api/cache`);
            return response
        }
        catch (error: any) {
            console.error('Lỗi khi lấy thông tin database:1', error);
            return {
                success: false,
                error: error.message || 'Không thể lấy thông tin database'
            };
        }
    },
    async upDateToDone(id: string) {
        try {
            const response = await axiosinstance.post(`/api/notion`,
                {
                    pageId: id
                }
            );
            return response
        }
        catch (error: any) {
            console.error('Lỗi khi lấy thông tin từ Notion:', error);
            return {
                success: false,
                error: error.message || 'Không thể lấy thông tin từ Notion'
            };
        }
    },

    en: {
        async updateSpacedTime(pageId: string, propertyName: string, selectValue: string) {
            if (propertyName !== "Spaced Time") {
                return {
                    success: false,
                    error: 'Tên thuộc tính không hợp lệ'
                };
            }
            if (selectValue !== "Familiar" && selectValue !== "Competent" && selectValue !== "Expert" && selectValue !== "Mastery") {
                return {
                    success: false,
                    error: 'Giá trị select là bắt buộc'
                };
            }
            try {
                const response = await axiosinstance.post(`/api/notion/query`,
                    {
                        pageId: pageId,
                        propertyName: propertyName,
                        selectValue: selectValue
                    }
                );
                return response
            }
            catch (error: any) {
                console.error('Lỗi khi cập nhật thuộc tính:', error);
                return {
                    success: false,
                    error: error.message || 'Không thể cập nhật thuộc tính'
                };
            }
        }
    }
}
export default NotionService;