// core/api/userApi.ts
import { api } from "@/core/api/http";
// <-- your axios/fetch wrapper

export const userApi = {
    getCurrentUser: () => {
        return api.get("/users/me");
    },

    login: (payload: { username: string }) => {
        return api.post("/users/login", payload);
    },

    logout: () => {
        return api.post("/users/logout");
    },
};
