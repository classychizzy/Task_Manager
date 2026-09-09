import apiClient from "./client";

// export const checkBackendHealth = async () => {
//     const response = await apiClient.get("/health");
//     return response.data;
// };

export const checkBackendHealth = async () => {
    console.log("Axios base URL:", apiClient.defaults.baseURL);

    const response = await apiClient.get("/health");

    console.log("Requested URL:", response.config.url);
    console.log("Full URL:", `${response.config.baseURL}${response.config.url}`);

    return response.data;
};
