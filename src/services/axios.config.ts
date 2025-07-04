import axios from 'axios';

const instance = axios.create({
    baseURL: "" ,
    timeout: 5000,
    headers: { 'X-Custom-Header': 'foobar' },
});

instance.interceptors.request.use(
    function (config : any) {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    function (error : any) {
        return Promise.reject(error);
    }
);

// Add a response interceptor
instance.interceptors.response.use(
    function (response : any) {
        return response.data;
    },
    function (error : any) {
        return Promise.reject(error);
    }
);
export default instance;