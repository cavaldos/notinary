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
}
export default NotionService;