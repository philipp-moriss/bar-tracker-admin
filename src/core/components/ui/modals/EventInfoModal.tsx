import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { BaseModal } from './BaseModal';

interface EventInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}

export const EventInfoModal: React.FC<EventInfoModalProps> = ({
  open,
  onOpenChange,
  message
}) => {
  const isSuccess = message.includes('Successfully completed');
  const Icon = isSuccess ? CheckCircle : Info;
  const iconColor = isSuccess ? 'text-green-600' : 'text-blue-600';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-blue-50';
  const borderColor = isSuccess ? 'border-green-200' : 'border-blue-200';

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={isSuccess ? "Events Updated" : "Information"}
      size="md"
      showConfirmButton
      confirmText="OK"
      confirmClassName="bg-barTrekker-orange hover:bg-barTrekker-orange/90"
      onConfirm={() => onOpenChange(false)}
    >
      <div className="space-y-4">
        <div className={`flex items-start space-x-3 p-4 rounded-lg ${bgColor} ${borderColor} border`}>
          <Icon className={`h-6 w-6 ${iconColor} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        
        {isSuccess && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              The events list has been refreshed to show the updated statuses.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
