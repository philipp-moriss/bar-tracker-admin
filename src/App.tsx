import { RouterProvider } from 'react-router-dom'
import { router } from '@/core/routing/routes'
import { useWindowHeight } from '@/core/hooks/ui/useWindowHeight'
import { useAuthInit } from '@/core/hooks/useAuthInit'

function App() {
    useWindowHeight();
    useAuthInit(); // Инициализируем аутентификацию

    return (
        <>
            <RouterProvider router={router} />
        </>
    )
}

export default App
