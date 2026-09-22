import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",

    },
});

//logic for handling refresh tokens


let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh once per request, and only on auth failures
        if (
            (error.response?.status === 401 || error.response?.status === 403) &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // If a refresh is already in progress, queue this request until it's done
                return new Promise((resolve) => {
                    refreshQueue.push(() => resolve(apiClient(originalRequest)));
                });
            }

            isRefreshing = true;
            try {
                await apiClient.post("/auth/refresh"); // adjust path to match your actual endpoint
                isRefreshing = false;
                refreshQueue.forEach((cb) => cb());
                refreshQueue = [];
                return apiClient(originalRequest); // retry the original failed request
            } catch (refreshError) {
                isRefreshing = false;
                refreshQueue = [];
                // Refresh itself failed — refresh token is dead too, force logout
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
export default apiClient;