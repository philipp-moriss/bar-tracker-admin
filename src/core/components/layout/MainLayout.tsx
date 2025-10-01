import { useDocumentTitle } from '@/core/hooks/utils/useDocumentTitle'
import { Outlet } from 'react-router-dom'

export const MainLayout = () => {

    useDocumentTitle("BarTrekker Admin")

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#1C1F2E] dark:bg-background">
            <div className="w-[430px] mx-auto bg-[#FAFBFF] dark:bg-card h-[100vh] max-h-screen md:h-[1000px] overflow-hidden shadow-xl dark:shadow-[0px_4px_20px_0px_rgba(255,255,255,0.05)]">
                <div className="full-height flex flex-col">
                    <Outlet/>
                </div>
            </div>
        </div>
    )
}
