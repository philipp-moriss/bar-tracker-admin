export const ErrorMessage = ({ message }: { message: string }) => (
    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-right" dir="rtl">
        {message}
    </div>
) 