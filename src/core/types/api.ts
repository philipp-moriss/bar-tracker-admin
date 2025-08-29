export interface ApiError {
    response?: {
        data?: {
            message?: string
        }
        status?: number
    }
    message: string
}
