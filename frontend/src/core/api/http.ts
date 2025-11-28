export const api = {
    get: (url: string) => fetch(url).then(r => r.json()),
    post: (url: string, body?: any) =>
        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined
        }).then(r => r.json())
};
