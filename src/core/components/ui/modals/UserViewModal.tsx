import React from "react";
import { Modal } from "./Modal";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { User, UserRole, UserStatus } from "@/core/types/user";
import { UserCheck, UserX, Crown, User as UserIcon, Mail, Phone, Calendar, DollarSign, MapPin, Clock } from "lucide-react";

interface UserViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export const UserViewModal: React.FC<UserViewModalProps> = ({
  open,
  onOpenChange,
  user
}) => {
  if (!user) return null;

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.USER]: { label: 'User', variant: 'default' as const, icon: UserIcon },
      [UserRole.BARTENDER]: { label: 'Bartender', variant: 'secondary' as const, icon: UserCheck },
      [UserRole.ADMIN]: { label: 'Admin', variant: 'destructive' as const, icon: Crown },
    };

    const config = roleConfig[role] || { 
      label: `Unknown (${role})`, 
      variant: 'outline' as const, 
      icon: UserIcon 
    };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status: UserStatus, isBlocked: boolean) => {
    if (isBlocked) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <UserX className="h-3 w-3" />
          <span>Blocked</span>
        </Badge>
      );
    }

    const statusConfig = {
      [UserStatus.ACTIVE]: { label: 'Active', variant: 'default' as const, icon: UserCheck },
      [UserStatus.INACTIVE]: { label: 'Inactive', variant: 'secondary' as const, icon: UserIcon },
      [UserStatus.PENDING]: { label: 'Pending', variant: 'outline' as const, icon: UserIcon },
      [UserStatus.BLOCKED]: { label: 'Blocked', variant: 'destructive' as const, icon: UserX },
    };

    const config = statusConfig[status] || { 
      label: `Unknown (${status})`, 
      variant: 'outline' as const, 
      icon: UserIcon 
    };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="User Details"
      description={`Information about ${user.name}`}
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Name:</span>
              </div>
              <p className="text-sm text-gray-900">{user.name}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Email:</span>
              </div>
              <p className="text-sm text-gray-900">{user.email}</p>
            </div>
            
            {user.phoneNumber && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Phone:</span>
                </div>
                <p className="text-sm text-gray-900">{user.phoneNumber}</p>
              </div>
            )}
            
            {user.location && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Location:</span>
                </div>
                <p className="text-sm text-gray-900">{user.location}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status & Role */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Status & Role</h3>
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <div>{getRoleBadge(user.role)}</div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div>{getStatusBadge(user.status, user.isBlocked || false)}</div>
            </div>
          </div>
        </div>

        {/* Activity Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Created:</span>
              </div>
              <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
            
            {user.lastLoginAt && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Last Login:</span>
                </div>
                <p className="text-sm text-gray-900">{formatDate(user.lastLoginAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Total Spent:</span>
              </div>
              <p className="text-sm text-gray-900">{formatPrice(user.totalSpent || 0)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Events:</span>
              </div>
              <p className="text-sm text-gray-900">{user.totalEvents || 0}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Tickets:</span>
              </div>
              <p className="text-sm text-gray-900">{user.totalTickets || 0}</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Bio</h3>
            <p className="text-sm text-gray-900">{user.bio}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserViewModal;
