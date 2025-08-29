import { Button } from '@/core/components/ui/button'
import { ROUTES } from '@/core/constants/routes'
import { ClipboardList, List, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

export const AdminNavBar = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path
  const isRTL = i18n.language === 'ar' || i18n.language === 'he'

  return (
    <nav
      className={`hidden md:flex flex-col gap-2 w-64 min-h-[calc(100vh-64px)] bg-[#F7F8FF] border-border py-6 px-2 fixed top-16 z-40 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Button
        variant={isActive(ROUTES.ADMIN.FORMS.LIST) ? 'default' : 'ghost'}
        onClick={() => navigate(`${ROUTES.ADMIN.FORMS.LIST}?reset=1`)}
        className={`justify-start gap-2 rounded-lg ${
          isActive(ROUTES.ADMIN.FORMS.LIST) 
            ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
            : 'hover:bg-[#F0F1FF] text-[#000000]'
        }`}
      >
        <List className="h-4 w-4" />
        {t('admin.nav.forms')}
      </Button>
      <Button
        variant={isActive(ROUTES.ADMIN.ANSWERS.LIST) ? 'default' : 'ghost'}
        onClick={() => navigate(ROUTES.ADMIN.ANSWERS.LIST)}
        className={`justify-start gap-2 rounded-lg ${
          isActive(ROUTES.ADMIN.ANSWERS.LIST) 
            ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
            : 'hover:bg-[#F0F1FF] text-[#000000]'
        }`}
      >
        <ClipboardList className="h-4 w-4" />
        {t('admin.nav.answers')}
      </Button>
      <Button
        variant={isActive(ROUTES.ADMIN.INTERVIEWERS.LIST) ? 'default' : 'ghost'}
        onClick={() => navigate(ROUTES.ADMIN.INTERVIEWERS.LIST)}
        className={`justify-start gap-2 rounded-lg ${
          isActive(ROUTES.ADMIN.INTERVIEWERS.LIST) 
            ? 'bg-[#DBDEFF] hover:bg-[#DBDEFF] text-[#3B46C4]' 
            : 'hover:bg-[#F0F1FF] text-[#000000]'
        }`}
      >
        <Users className="h-4 w-4" />
        {t('admin.nav.interviewers')}
      </Button>
    </nav>
  )
} 