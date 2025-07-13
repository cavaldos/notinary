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
        async updateSpacedTime(pageId: string, selectValue: string, status: string) {


            const levels = ["Familiar", "Competent", "Expert", "Mastery", "Master+"];

            if (!levels.includes(selectValue)) {
                return {
                    success: false,
                    error: 'Giá trị select không hợp lệ'
                };
            }

            if (status !== "up" && status !== "down") {
                return {
                    success: false,
                    error: 'Status phải là "up" hoặc "down"'
                };
            }

            // Tìm index của level hiện tại
            const currentIndex = levels.indexOf(selectValue);
            let newIndex: number;

            if (status === "up") {
                // Tăng level (nếu đã ở level cao nhất thì giữ nguyên)
                newIndex = Math.min(currentIndex + 1, levels.length - 1);
            } else {
                // Giảm level (nếu đã ở level thấp nhất thì giữ nguyên)
                newIndex = Math.max(currentIndex - 1, 0);
            }

            const newSelectValue = levels[newIndex];

            try {
                const response = await axiosinstance.post(`/api/notion/query`, {
                    pageId: pageId,
                    propertyName: "Spaced Time",
                    selectValue: newSelectValue // Sử dụng giá trị mới đã tính toán
                });
                return response;
            } catch (error: any) {
                console.error('Lỗi khi cập nhật thuộc tính:', error);
                return {
                    success: false,
                    error: error.message || 'Không thể cập nhật thuộc tính'
                };
            }
        },
        async getSpacedTimeItems(pageSize: number, equalsValue: string) {
            try {
                console.log(`Fetching spaced time items: pageSize=${pageSize}, space=${equalsValue}`);
                const response = await axiosinstance.post(`/api/notion/en/space`, {
                    pageSize: pageSize,
                    equalsValue: equalsValue
                });
                console.log('API response received successfully');
                return response;
            }
            catch (error: any) {
                console.error('Lỗi khi lấy dữ liệu từ Notion:', error);

                // Xử lý các loại lỗi khác nhau
                let errorMessage = 'Không thể lấy dữ liệu từ Notion';
                if (error.code === 'ECONNABORTED') {
                    errorMessage = 'Yêu cầu bị timeout. Vui lòng thử lại sau.';
                } else if (error.response) {
                    errorMessage = `Lỗi server: ${error.response.status} - ${error.response.statusText}`;
                } else if (error.request) {
                    errorMessage = 'Không thể kết nối đến server. Kiểm tra kết nối mạng.';
                }

                return {
                    success: false,
                    error: errorMessage,
                    originalError: error.message
                };
            }
        },

    }
}
export default NotionService;