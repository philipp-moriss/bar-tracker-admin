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
    const { sessionExpired, setSessionExpired } = useAuthStore()

    const handleLoginRedirect = () => {
        setSessionExpired(false)
        window.open('/admin/login', '_blank')
    }

    return (
        <Dialog open={sessionExpired} onOpenChange={setSessionExpired}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{'Session expired'}</DialogTitle>
                    <DialogDescription>
                        {'Your session has expired. Please log in again.'}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={handleLoginRedirect}>
                        {'Login'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 