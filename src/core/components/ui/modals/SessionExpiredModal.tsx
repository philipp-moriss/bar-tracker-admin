import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/core/stores/authStore'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button';

export const SessionExpiredModal = () => {
    const { t, i18n } = useTranslation()
    const { sessionExpired, setSessionExpired } = useAuthStore()
    const isRTL = i18n.language === 'ar' || i18n.language === 'he';

    const handleLoginRedirect = () => {
        setSessionExpired(false)
        window.open('/admin/login', '_blank')
    }

    return (
        <Dialog open={sessionExpired} onOpenChange={setSessionExpired}>
            <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                <DialogHeader>
                    <DialogTitle>{t('sessionExpired.title')}</DialogTitle>
                    <DialogDescription>
                        {t('sessionExpired.description')}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={handleLoginRedirect}>
                        {t('sessionExpired.login')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 