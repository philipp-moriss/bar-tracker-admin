import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/core/stores/authStore'
import { ROUTES } from "@/core/constants/routes.ts";
import { SessionExpiredModal } from '@/core/components/ui/modals/SessionExpiredModal';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated, sessionExpired } = useAuthStore()
    const location = useLocation()

    // Если сессия истекла, показываем модальное окно
    if (sessionExpired) {
        return (
            <>
                {children}
                <SessionExpiredModal />
            </>
        )
    }

    // Если пользователь не аутентифицирован, перенаправляем на страницу входа
    if (!isAuthenticated || !user) {
        return <Navigate to={ROUTES.ADMIN.LOGIN} state={{ from: location }} replace />
    }

    // Проверяем, что пользователь является администратором
    if (!user.isAdmin) {
        return <Navigate to={ROUTES.ADMIN.LOGIN} state={{ from: location }} replace />
    }

    return children
}

