import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Shield, UserCheck, UserX, Crown, User, Users, Mail, Phone, Calendar, DollarSign, UserPlus } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';

import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/core/components/ui/card';
import { SearchInput } from '@/core/components/ui/inputs/SearchInput';
import { FilterSelect } from '@/core/components/ui/inputs/FilterSelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { userService } from '@/core/services/userService';
import { barService } from '@/core/services/barService';
import { User as UserType, UserRole, UserStatus, UserFilters } from '@/core/types/user';

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: UserRole.USER, label: 'User' },
  { value: UserRole.BARTENDER, label: 'Bartender' },
  { value: UserRole.ADMIN, label: 'Admin' }
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: UserStatus.ACTIVE, label: 'Active' },
  { value: UserStatus.INACTIVE, label: 'Inactive' },
  { value: UserStatus.PENDING, label: 'Pending' }
];
import { AnalyticsService } from '@/core/services/analyticsService';
import { toast } from 'sonner';
import { ConfirmModal } from '@/core/components/ui/modals/ConfirmModal';
import { UserViewModal } from '@/core/components/ui/modals/UserViewModal';
import { BaseModal } from '@/core/components/ui/modals/BaseModal';
import { BarMultiSelector } from '@/components/common/BarMultiSelector/BarMultiSelector';

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [assignBarModalOpen, setAssignBarModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; role?: UserRole; barNames?: string[] } | null>(null);
  const [viewUser, setViewUser] = useState<UserType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBarNames, setSelectedBarNames] = useState<string[]>([]);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
    AnalyticsService.logPageView('Admin Users Page');
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: UserFilters = {
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };

      const usersData = await userService.getUsers(filters);
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload users when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleViewUser = (user: UserType) => {
    setViewUser(user);
    setViewModalOpen(true);
  };

  const handleAssignBar = async (user: UserType) => {
    try {
      // Load current bars for this bartender (support both formats)
      const currentBars = user.barNames && user.barNames.length > 0
        ? user.barNames
        : (user.barName ? [user.barName] : []);

      setSelectedUser({ id: user.id, name: user.name, barNames: currentBars });
      setSelectedBarNames(currentBars);
      setAssignBarModalOpen(true);
    } catch (error) {
      console.error('Error opening bar assignment:', error);
      toast.error('Failed to open bar assignment');
    }
  };

  const handleBlockUser = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setBlockModalOpen(true);
  };

  const confirmBlockUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await userService.blockUser(selectedUser.id, 'Blocked by administrator');
      await loadUsers();
      toast.success(`User "${selectedUser.name}" has been blocked`);
      AnalyticsService.logCustomEvent('user_blocked', { userId: selectedUser.id });
    } catch (err) {
      toast.error('Failed to block user');
      setError('Failed to block user');
      console.error('Error blocking user:', err);
    } finally {
      setActionLoading(false);
      setBlockModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleUnblockUser = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setUnblockModalOpen(true);
  };

  const confirmUnblockUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await userService.unblockUser(selectedUser.id);
      await loadUsers();
      toast.success(`User "${selectedUser.name}" has been unblocked`);
      AnalyticsService.logCustomEvent('user_unblocked', { userId: selectedUser.id });
    } catch (err) {
      toast.error('Failed to unblock user');
      setError('Failed to unblock user');
      console.error('Error unblocking user:', err);
    } finally {
      setActionLoading(false);
      setUnblockModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleChangeRole = (userId: string, newRole: UserRole, userName: string) => {
    setSelectedUser({ id: userId, name: userName, role: newRole });
    setRoleModalOpen(true);
  };

  const confirmChangeRole = async () => {
    if (!selectedUser || !selectedUser.role) return;

    try {
      setActionLoading(true);
      await userService.changeUserRole(selectedUser.id, selectedUser.role);
      await loadUsers();
      toast.success(`User "${selectedUser.name}" role changed to ${selectedUser.role}`);
      AnalyticsService.logCustomEvent('user_role_changed', { userId: selectedUser.id, newRole: selectedUser.role });
    } catch (err) {
      toast.error('Failed to change user role');
      setError('Failed to change user role');
      console.error('Error changing user role:', err);
    } finally {
      setActionLoading(false);
      setRoleModalOpen(false);
      setSelectedUser(null);
    }
  };

  const confirmAssignBar = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);

      // Update to new format (barNames array)
      // Use null to explicitly clear fields when empty
      const updateData: any = {
        barNames: selectedBarNames.length > 0 ? selectedBarNames : null,
        // Keep legacy barName field for backward compatibility
        barName: selectedBarNames.length > 0 ? selectedBarNames[0] : null
      };

      await userService.updateUser(selectedUser.id, updateData);

      const message = selectedBarNames.length === 0
        ? 'Bars cleared successfully'
        : `Assigned to ${selectedBarNames.length} bar(s): ${selectedBarNames.join(', ')}`;

      toast.success(message);
      setAssignBarModalOpen(false);
      setSelectedUser(null);
      setSelectedBarNames([]);
      loadUsers();
    } catch (error) {
      console.error('Error assigning bars:', error);
      toast.error('Failed to assign bars');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.USER]: { label: 'User', variant: 'default' as const, icon: User },
      [UserRole.BARTENDER]: { label: 'Bartender', variant: 'secondary' as const, icon: UserCheck },
      [UserRole.ADMIN]: { label: 'Admin', variant: 'destructive' as const, icon: Crown },
    };

    const config = roleConfig[role] || {
      label: `Unknown (${role})`,
      variant: 'outline' as const,
      icon: User
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
      [UserStatus.INACTIVE]: { label: 'Inactive', variant: 'secondary' as const, icon: User },
      [UserStatus.PENDING]: { label: 'Pending', variant: 'outline' as const, icon: User },
      [UserStatus.BLOCKED]: { label: 'Blocked', variant: 'destructive' as const, icon: UserX },
    };

    const config = statusConfig[status] || {
      label: `Unknown (${status})`,
      variant: 'outline' as const,
      icon: User
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
    return d.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount / 100);
  };

  return (
    <AdminLayout title="Users Management" subtitle="Manage all BarTrekker users and their roles">
      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <Card className="mb-8 shadow-sm border-0 bg-gradient-to-r from-gray-50 to-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Search className="h-5 w-5 mr-2 text-barTrekker-orange" />
              Search & Filter Users
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <SearchInput
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>
              <div>
                <FilterSelect
                  placeholder="All Roles"
                  value={roleFilter}
                  onValueChange={setRoleFilter}
                  options={roleOptions}
                />
              </div>
              <div>
                <FilterSelect
                  placeholder="All Status"
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={statusOptions}
                />
              </div>
              <div>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('');
                    setStatusFilter('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Users ({users.length})</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate('/admin/users/create')}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Create User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-barTrekker-orange"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-barTrekker-darkGrey/30 mx-auto mb-4" />
                <p className="text-barTrekker-darkGrey/70">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Bar</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-barTrekker-orange rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-barTrekker-darkGrey/70">
                                ID: {user.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-xs">{user.email}</span>
                            </div>
                            {user.phoneNumber && (
                              <div className="flex items-center space-x-1 text-sm text-barTrekker-darkGrey/70">
                                <Phone className="h-3 w-3" />
                                <span>{user.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {user.role === 'bartender' ? (
                            (() => {
                              const bars = user.barNames && user.barNames.length > 0
                                ? user.barNames
                                : (user.barName ? [user.barName] : []);

                              if (bars.length === 0) {
                                return (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    No bar
                                  </Badge>
                                );
                              }

                              if (bars.length === 1) {
                                return (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {bars[0]}
                                  </Badge>
                                );
                              }

                              return (
                                <div className="flex items-center gap-1" title={bars.join(', ')}>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 max-w-[120px] truncate">
                                    {bars[0]}
                                  </Badge>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                    +{bars.length - 1}
                                  </Badge>
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-barTrekker-darkGrey/50">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              title="View User Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Role Change Buttons */}
                            {user.role === UserRole.USER && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleChangeRole(user.id, UserRole.BARTENDER, user.name)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Make Bartender"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                            {user.role === UserRole.BARTENDER && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAssignBar(user)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Assign Bar"
                                >
                                  <Crown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleChangeRole(user.id, UserRole.USER, user.name)}
                                  className="text-gray-700 hover:text-gray-800"
                                  title="Make User"
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {/* Block/Unblock Buttons */}
                            {user.isBlocked ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnblockUser(user.id, user.name)}
                                className="text-green-600 hover:text-green-700"
                                title="Unblock User"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBlockUser(user.id, user.name)}
                                className="text-red-600 hover:text-red-700"
                                title="Block User"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ConfirmModal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        onConfirm={confirmBlockUser}
        loading={actionLoading}
        title="Block User"
        description={`Are you sure you want to block "${selectedUser?.name}"?`}
        confirmText="Block"
        variant="destructive"
      />

      <ConfirmModal
        open={unblockModalOpen}
        onOpenChange={setUnblockModalOpen}
        onConfirm={confirmUnblockUser}
        loading={actionLoading}
        title="Unblock User"
        description={`Are you sure you want to unblock "${selectedUser?.name}"?`}
        confirmText="Unblock"
        variant="default"
      />

      <ConfirmModal
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        onConfirm={confirmChangeRole}
        loading={actionLoading}
        title="Change User Role"
        description={`Are you sure you want to change "${selectedUser?.name}" role to ${selectedUser?.role}?`}
        confirmText="Change Role"
        variant="default"
      />

      <UserViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        user={viewUser}
      />

      {/* Bar Selection Modal */}
      <BaseModal
        open={assignBarModalOpen}
        onOpenChange={setAssignBarModalOpen}
        title="Assign Bars to Bartender"
        showConfirmButton
        confirmText="Save Bars"
        onConfirm={confirmAssignBar}
        loading={actionLoading}
        size="2xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Assign bars to "{selectedUser?.name}". Bartender can work at multiple bars.
          </p>
          <BarMultiSelector
            selectedBarNames={selectedBarNames}
            onSelectionChange={setSelectedBarNames}
            disabled={actionLoading}
          />
        </div>
      </BaseModal>
    </AdminLayout>
  );
};
