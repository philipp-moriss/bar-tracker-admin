import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/core/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover'
import { ROUTES } from '@/core/constants/routes'
import { Menu, X, User, LogOut } from 'lucide-react'
import { LanguageSelect } from '@/core/feauture/language/LanguageSelect'

export const AdminHeader = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = () => {
        // clearUser()
        navigate('/customer/login')
    }

    const isActive = (path: string) => location.pathname === path

    const closeMenu = () => setIsMenuOpen(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16">
            <div className="flex h-full">
                {/* Левая часть - как nav bar */}
                <div className="w-64 bg-[#F7F8FF] border-r border-b border-border flex items-center px-6">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden mr-4"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                        <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
                    </div>
                </div>

                {/* Правая часть - элементы управления */}
                <div className="flex-1 bg-white border-b border-border flex items-center justify-end px-6">
                    <div className="flex items-center gap-4">
                        <LanguageSelect size="md" />

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/50"
                                >
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {/* {user?.email ? user.email.split('@')[0] : 'User_name'} */}
                                        User_name
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" align="end">
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t('admin.nav.logout')}
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="fixed inset-0 top-16 bg-[#F7F8FF] z-40 md:hidden">
                    <nav className="flex flex-col p-4">
                        <Button
                            variant={isActive(ROUTES.ADMIN.FORMS.LIST) ? 'default' : 'ghost'}
                            onClick={() => {
                                navigate(`${ROUTES.ADMIN.FORMS.LIST}?reset=1`)
                                closeMenu()
                            }}
                            className={`w-full justify-start mb-2 rounded-lg ${
                                isActive(ROUTES.ADMIN.FORMS.LIST) 
                                    ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
                                    : 'hover:bg-[#F0F1FF] text-[#000000]'
                            }`}
                        >
                            {t('admin.nav.forms')}
                        </Button>
                        <Button
                            variant={isActive(ROUTES.ADMIN.ANSWERS.LIST) ? 'default' : 'ghost'}
                            onClick={() => {
                                navigate(ROUTES.ADMIN.ANSWERS.LIST)
                                closeMenu()
                            }}
                            className={`w-full justify-start mb-2 rounded-lg ${
                                isActive(ROUTES.ADMIN.ANSWERS.LIST) 
                                    ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
                                    : 'hover:bg-[#F0F1FF] text-[#000000]'
                            }`}
                        >
                            {t('admin.nav.answers')}
                        </Button>
                        <Button
                            variant={isActive(ROUTES.ADMIN.INTERVIEWERS.LIST) ? 'default' : 'ghost'}
                            onClick={() => {
                                navigate(ROUTES.ADMIN.INTERVIEWERS.LIST)
                                closeMenu()
                            }}
                            className={`w-full justify-start mb-2 rounded-lg ${
                                isActive(ROUTES.ADMIN.INTERVIEWERS.LIST) 
                                    ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
                                    : 'hover:bg-[#F0F1FF] text-[#000000]'
                            }`}
                        >
                            {t('admin.nav.interviewers')}
                        </Button>
                        <Button
                            variant={isActive(ROUTES.ADMIN.IMAGES.LIST) ? 'default' : 'ghost'}
                            onClick={() => {
                                navigate(ROUTES.ADMIN.IMAGES.LIST)
                                closeMenu()
                            }}
                            className={`w-full justify-start mb-2 rounded-lg ${
                                isActive(ROUTES.ADMIN.IMAGES.LIST) 
                                    ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
                                    : 'hover:bg-[#F0F1FF] text-[#000000]'
                            }`}
                        >
                            {t('admin.nav.images')}
                        </Button>
                        <Button
                            variant={isActive(ROUTES.ADMIN.APPLICATION.LIST) ? 'default' : 'ghost'}
                            onClick={() => {
                                navigate(ROUTES.ADMIN.APPLICATION.LIST)
                                closeMenu()
                            }}
                            className={`w-full justify-start mb-2 rounded-lg ${
                                isActive(ROUTES.ADMIN.APPLICATION.LIST) 
                                    ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
                                    : 'hover:bg-[#F0F1FF] text-[#000000]'
                            }`}
                        >
                            {t('admin.nav.application')}
                        </Button>
                        <Button
                            variant={isActive(ROUTES.ADMIN.CONTACTS.LIST) ? 'default' : 'ghost'}
                            onClick={() => {
                                navigate(ROUTES.ADMIN.CONTACTS.LIST)
                                closeMenu()
                            }}
                            className={`w-full justify-start mb-2 rounded-lg ${
                                isActive(ROUTES.ADMIN.CONTACTS.LIST) 
                                    ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
                                    : 'hover:bg-[#F0F1FF] text-[#000000]'
                            }`}
                        >
                            {t('admin.nav.contacts')}
                        </Button>
                        <Button
                            variant={isActive('/admin/contact-info') ? 'default' : 'ghost'}
                            onClick={() => {
                                navigate('/admin/contact-info')
                                closeMenu()
                            }}
                            className={`w-full justify-start mb-2 rounded-lg ${
                                isActive('/admin/contact-info') 
                                    ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
                                    : 'hover:bg-[#F0F1FF] text-[#000000]'
                            }`}
                        >
                            {t('admin.nav.contactInfo')}
                        </Button>
                        <Button
                            variant={isActive('/admin/custom-forms') ? 'default' : 'ghost'}
                            onClick={() => {
                                navigate('/admin/custom-forms')
                                closeMenu()
                            }}
                            className={`w-full justify-start mb-2 rounded-lg ${
                                isActive('/admin/custom-forms') 
                                    ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
                                    : 'hover:bg-[#F0F1FF] text-[#000000]'
                            }`}
                        >
                            {t('admin.nav.customForms')}
                        </Button>
                        <Button
                            variant={isActive('/admin/custom-forms/responses') ? 'default' : 'ghost'}
                            onClick={() => {
                                navigate('/admin/custom-forms/responses')
                                closeMenu()
                            }}
                            className={`w-full justify-start mb-2 rounded-lg ${
                                isActive('/admin/custom-forms/responses') 
                                    ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
                                    : 'hover:bg-[#F0F1FF] text-[#000000]'
                            }`}
                        >
                            {t('admin.customForms.responses.title')}
                        </Button>
                    </nav>
                </div>
            )}
        </header>
  );
}
