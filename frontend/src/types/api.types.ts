export interface ApiRequestOptions extends RequestInit {
    headers?: HeadersInit;
}

export interface ApiErrorResponse {
    message: string;
    statusCode?: number;
}