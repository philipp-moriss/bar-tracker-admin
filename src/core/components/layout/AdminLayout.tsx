import {AdminHeader} from "@/core/components/layout/AdminHeader";
import {AdminNavBar} from "@/core/components/layout/AdminNavBar";
import {Outlet} from "react-router-dom";
import { useDocumentTitle } from "@/core/hooks/utils/useDocumentTitle";
import { Toaster } from "../ui/toast/sonner";
import { useTranslation } from 'react-i18next';

export const AdminLayout = () => {

    useDocumentTitle("Admin Panel")
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar' || i18n.language === 'he';

    return (
        <div className="min-h-screen bg-background overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <AdminHeader />
            <div className="flex">
                <AdminNavBar />
                <main className={`flex-1 h-[calc(100vh-64px)] mt-16 overflow-hidden ${isRTL ? 'md:pr-64' : 'md:pl-64'}`}>
                    <div className="container mx-auto p-4 h-full overflow-y-auto scrollbar-hide">
                        <Outlet />
                    </div>
                </main>
            </div>
            <Toaster />
        </div>
    )
}
