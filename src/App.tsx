import { RouterProvider } from 'react-router-dom'
import { router } from '@/core/routing/routes'
import { useWindowHeight } from '@/core/hooks/ui/useWindowHeight'

function App() {
    useWindowHeight();

    return (
        <>
            <RouterProvider router={router} />
        </>
    )
}

export default App
