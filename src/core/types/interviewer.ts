export interface Interviewer {
    id?: number
    name: string
    email: string
    location: string
    phone: string
    updatedAt: string
    interviewer_role: string
}

export interface InterviewersResponse {
    data: Interviewer[]
    total: number
    page: number
    limit: number
}
