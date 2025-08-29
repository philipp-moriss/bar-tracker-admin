export interface AdminLoginDto {
    email: string
    password: string
}

export interface AdminRegisterDto {
    name: string
    email: string
    password: string
}

export interface RefreshTokenDto {
    refreshToken: string
}

export interface AuthResponse {
    access_token: string
    refresh_token: string
    email: string
    userId: number
}
