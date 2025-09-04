import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, UserCheck, UserX, Crown, User, Mail, Phone, Calendar, DollarSign, Activity, Clock } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';

import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { userService } from '@/core/services/userService';
import { User as UserType, UserRole, UserStatus, UserActivity } from '@/core/types/user';
import { AnalyticsService } from '@/core/services/analyticsService';

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadUserData(id);
      AnalyticsService.logPageView('User Profile Page');
    }
  }, [id]);

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const [userData, userActivities] = await Promise.all([
        userService.getUserById(userId),
        userService.getUserActivities(userId, 20)
      ]);
      
      setUser(userData);
      setActivities(userActivities);
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!user) return;
    
    const reason = prompt('Reason for blocking (optional):');
    if (reason !== null) {
      try {
        setActionLoading(true);
        await userService.blockUser(user.id, reason || undefined);
        await loadUserData(user.id);
        AnalyticsService.logCustomEvent('user_blocked', { userId: user.id });
      } catch (err) {
        setError('Failed to block user');
        console.error('Error blocking user:', err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleUnblockUser = async () => {
    if (!user) return;
    
    try {
      setActionLoading(true);
      await userService.unblockUser(user.id);
      await loadUserData(user.id);
      AnalyticsService.logCustomEvent('user_unblocked', { userId: user.id });
    } catch (err) {
      setError('Failed to unblock user');
      console.error('Error unblocking user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (newRole: UserRole) => {
    if (!user) return;
    
    if (window.confirm(`Change role of "${user.name}" to ${newRole}?`)) {
      try {
        setActionLoading(true);
        await userService.changeUserRole(user.id, newRole);
        await loadUserData(user.id);
        AnalyticsService.logCustomEvent('user_role_changed', { userId: user.id, newRole });
      } catch (err) {
        setError('Failed to change user role');
        console.error('Error changing user role:', err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleBack = () => {
    navigate('/admin/users');
  };

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.USER]: { label: 'User', variant: 'default' as const, icon: User },
      [UserRole.BARTENDER]: { label: 'Bartender', variant: 'secondary' as const, icon: UserCheck },
      [UserRole.ADMIN]: { label: 'Admin', variant: 'destructive' as const, icon: Crown },
    };

    const config = roleConfig[role];
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
      [UserStatus.INACTIVE]: { label: 'Inactive', variant: 'secondary' as const, icon: User },
      [UserStatus.PENDING]: { label: 'Pending', variant: 'outline' as const, icon: User },
    };

    const config = statusConfig[status];
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <AdminLayout title="Loading..." subtitle="Loading user profile">
        <div className="max-w-6xl mx-auto flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barTrekker-orange"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout title="Error" subtitle="User not found">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'User not found'}</p>
            <Button onClick={handleBack}>Back to Users</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Profile" subtitle={user.name}>
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Users</span>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main User Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Information</span>
                  <div className="flex items-center space-x-2">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status, user.isBlocked || false)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-barTrekker-orange rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-barTrekker-darkGrey">{user.name}</h2>
                    <p className="text-barTrekker-darkGrey/70">User ID: {user.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-barTrekker-darkGrey/70">Email</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                  {user.phoneNumber && (
                    <div>
                      <label className="text-sm font-medium text-barTrekker-darkGrey/70">Phone</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="h-4 w-4" />
                        <span>{user.phoneNumber}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-barTrekker-darkGrey/70">Joined</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                  {user.lastLoginAt && (
                    <div>
                      <label className="text-sm font-medium text-barTrekker-darkGrey/70">Last Login</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(user.lastLoginAt)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {user.dateOfBirth && (
                  <div>
                    <label className="text-sm font-medium text-barTrekker-darkGrey/70">Date of Birth</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{user.dateOfBirth}</span>
                    </div>
                  </div>
                )}

                {user.isBlocked && user.blockedReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <label className="text-sm font-medium text-red-800">Block Reason</label>
                    <p className="text-red-700 mt-1">{user.blockedReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Activity Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Events</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{user.totalEvents || 0}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Total Spent</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(user.totalSpent || 0)}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">Tickets</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 mt-2">{user.totalTickets || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-barTrekker-darkGrey/70 text-center py-4">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 bg-barTrekker-lightGrey rounded-lg">
                        <div className="w-2 h-2 bg-barTrekker-orange rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-barTrekker-darkGrey/70">{formatDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Role Change Buttons */}
                {user.role !== UserRole.ADMIN && (
                  <>
                    <Button
                      onClick={() => handleChangeRole(UserRole.BARTENDER)}
                      disabled={actionLoading || user.role === UserRole.BARTENDER}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Make Bartender</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => handleChangeRole(UserRole.USER)}
                      disabled={actionLoading || user.role === UserRole.USER}
                      variant="outline"
                      className="w-full"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Make User</span>
                      </div>
                    </Button>
                  </>
                )}
                
                {/* Block/Unblock Buttons */}
                {user.isBlocked ? (
                  <Button
                    onClick={handleUnblockUser}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4" />
                        <span>Unblock User</span>
                      </div>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleBlockUser}
                    disabled={actionLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    {actionLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <UserX className="h-4 w-4" />
                        <span>Block User</span>
                      </div>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-barTrekker-darkGrey/70">Account Type</label>
                  <p className="text-sm">{user.isEmailPasswordProvider ? 'Email/Password' : 'Social Login'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-barTrekker-darkGrey/70">Status</label>
                  <p className="text-sm">{user.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-barTrekker-darkGrey/70">Last Updated</label>
                  <p className="text-sm">{formatDate(user.updatedAt || user.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
