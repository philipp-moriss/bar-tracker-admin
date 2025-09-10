import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
  headerActions?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  children,
  icon: Icon,
  iconColor = 'text-barTrekker-orange',
  iconBgColor = 'bg-barTrekker-orange/10',
  className = '',
  headerActions,
}) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className={`p-2 ${iconBgColor} rounded-lg`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {headerActions && (
          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

interface InfoItemProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

export const InfoItem: React.FC<InfoItemProps> = ({
  icon: Icon,
  label,
  value,
  iconColor = 'text-barTrekker-orange',
  iconBgColor = 'bg-barTrekker-orange/10',
  className = '',
}) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`p-2 ${iconBgColor} rounded-lg`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <div className="text-sm text-gray-600">{value}</div>
      </div>
    </div>
  );
};
