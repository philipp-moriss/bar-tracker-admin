import { useTranslation } from 'react-i18next';
import { Button } from '../button';

interface RateLimitPageProps {
  onRetry: () => void;
}

export const RateLimitPage = ({ onRetry }: RateLimitPageProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-[24px] p-8 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] w-full max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('error.rateLimit.title')}
          </h1>
          <p className="text-gray-600">
            {t('error.rateLimit.description')}
          </p>
        </div>
        
        <Button 
          onClick={onRetry}
          className="w-full"
        >
          {t('error.rateLimit.retryButton')}
        </Button>
      </div>
    </div>
  );
}; 