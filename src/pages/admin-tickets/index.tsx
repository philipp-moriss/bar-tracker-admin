import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, CheckCircle, XCircle, Clock, DollarSign, Calendar, MapPin, User, Download, BarChart3, History, Trash2, RotateCcw } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { ConfirmModal } from '@/core/components/ui/modals/ConfirmModal';
import { DeleteConfirmModal } from '@/core/components/ui/modals/DeleteConfirmModal';
import { toastManager } from '@/core/components/ui/toast/toast';

import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/inputs/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { ticketService } from '@/core/services/ticketService';
import { Ticket, TicketStatus, TicketFilters, TicketStats } from '@/core/types/ticket';
import { AnalyticsService } from '@/core/services/analyticsService';

export const AdminTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteCodeSearch, setInviteCodeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [validationCode, setValidationCode] = useState('');
  const [validationResult, setValidationResult] = useState<{ ticket: Ticket | null; error: string | null } | null>(null);
  const [recentActions, setRecentActions] = useState<Array<{ action: string; ticketId: string; inviteCode: string; timestamp: Date }>>([]);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
    loading?: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => { },
    variant: 'default',
    loading: false
  });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    ticketId: string;
    inviteCode: string;
    loading: boolean;
  }>({
    open: false,
    ticketId: '',
    inviteCode: '',
    loading: false
  });

  // Load tickets on component mount
  useEffect(() => {
    loadTickets();
    AnalyticsService.logPageView('Admin Tickets Page');
  }, []);



  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: TicketFilters = {
        search: searchTerm || undefined,
        inviteCode: inviteCodeSearch || undefined,
        status: statusFilter || undefined,
      };


      const [ticketsData, statsData] = await Promise.all([
        ticketService.getTickets(filters),
        ticketService.getTicketStats()
      ]);



      setTickets(ticketsData);
      setTicketStats(statsData);
    } catch (err) {
      setError('Failed to load tickets');
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload tickets when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTickets();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, inviteCodeSearch, statusFilter]);

  const handleViewTicket = (ticketId: string) => {
    navigate(`/admin/tickets/${ticketId}`);
  };

  const handleMarkAsUsed = async (ticketId: string, inviteCode: string) => {
    setConfirmModal({
      open: true,
      title: 'Mark as Scanned',
      description: `Are you sure you want to mark ticket ${inviteCode} as scanned?`,
      variant: 'default',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await ticketService.markTicketAsUsed(ticketId);
          logAction('Marked as Scanned', ticketId, inviteCode);
          await loadTickets();
          AnalyticsService.logCustomEvent('ticket_marked_scanned', { ticketId });
          toastManager.success(`Ticket ${inviteCode} marked as scanned`);
          setConfirmModal({ open: false, title: '', description: '', onConfirm: () => { } });
        } catch (err) {
          setError('Failed to mark ticket as scanned');
          console.error('Error marking ticket as scanned:', err);
          toastManager.error('Failed to mark ticket as scanned');
        } finally {
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleCancelTicket = async (ticketId: string, inviteCode: string) => {
    setConfirmModal({
      open: true,
      title: 'Cancel Ticket',
      description: `Are you sure you want to cancel ticket ${inviteCode}?`,
      variant: 'destructive',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await ticketService.cancelTicket(ticketId);
          logAction('Cancelled', ticketId, inviteCode);
          await loadTickets();
          AnalyticsService.logCustomEvent('ticket_cancelled', { ticketId });
          toastManager.success(`Ticket ${inviteCode} cancelled`);
          setConfirmModal({ open: false, title: '', description: '', onConfirm: () => { } });
        } catch (err) {
          setError('Failed to cancel ticket');
          console.error('Error cancelling ticket:', err);
          toastManager.error('Failed to cancel ticket');
        } finally {
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleDeleteTicket = async (ticketId: string, inviteCode: string) => {
    setDeleteModal({
      open: true,
      ticketId,
      inviteCode,
      loading: false
    });
  };

  const confirmDeleteTicket = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await ticketService.deleteTicket(deleteModal.ticketId);
      logAction('Deleted', deleteModal.ticketId, deleteModal.inviteCode);
      await loadTickets();
      AnalyticsService.logCustomEvent('ticket_deleted', { ticketId: deleteModal.ticketId });
      toastManager.success(`Ticket ${deleteModal.inviteCode} deleted permanently`);
      setDeleteModal({ open: false, ticketId: '', inviteCode: '', loading: false });
    } catch (err) {
      setError('Failed to delete ticket');
      console.error('Error deleting ticket:', err);
      toastManager.error('Failed to delete ticket');
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRestoreTicket = async (ticketId: string, inviteCode: string) => {
    setConfirmModal({
      open: true,
      title: 'Restore Ticket',
      description: `Are you sure you want to restore ticket ${inviteCode} to active status?`,
      variant: 'default',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await ticketService.restoreTicket(ticketId);
          logAction('Restored', ticketId, inviteCode);
          await loadTickets();
          AnalyticsService.logCustomEvent('ticket_restored', { ticketId });
          toastManager.success(`Ticket ${inviteCode} restored to active`);
          setConfirmModal({ open: false, title: '', description: '', onConfirm: () => { } });
        } catch (err) {
          setError('Failed to restore ticket');
          console.error('Error restoring ticket:', err);
          toastManager.error('Failed to restore ticket');
        } finally {
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleRestoreUsedTicket = async (ticketId: string, inviteCode: string) => {
    setConfirmModal({
      open: true,
      title: 'Restore Used Ticket',
      description: `Are you sure you want to restore used ticket ${inviteCode} back to active status?`,
      variant: 'default',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await ticketService.restoreUsedTicket(ticketId);
          logAction('Restored from Used', ticketId, inviteCode);
          await loadTickets();
          AnalyticsService.logCustomEvent('ticket_restored_from_used', { ticketId });
          toastManager.success(`Ticket ${inviteCode} restored from used to active`);
          setConfirmModal({ open: false, title: '', description: '', onConfirm: () => { } });
        } catch (err) {
          setError('Failed to restore used ticket');
          console.error('Error restoring used ticket:', err);
          toastManager.error('Failed to restore used ticket');
        } finally {
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // Bulk operations
  const handleBulkMarkAsUsed = async () => {
    if (selectedTickets.length === 0) return;

    if (window.confirm(`Mark ${selectedTickets.length} tickets as scanned?`)) {
      try {
        await Promise.all(selectedTickets.map(id => ticketService.markTicketAsUsed(id)));
        setSelectedTickets([]);
        await loadTickets();
        AnalyticsService.logCustomEvent('bulk_tickets_marked_scanned', { count: selectedTickets.length });
      } catch (err) {
        setError('Failed to mark tickets as scanned');
        console.error('Error marking tickets as scanned:', err);
      }
    }
  };

  const handleBulkCancel = async () => {
    if (selectedTickets.length === 0) return;

    if (window.confirm(`Cancel ${selectedTickets.length} tickets?`)) {
      try {
        await Promise.all(selectedTickets.map(id => ticketService.cancelTicket(id)));
        setSelectedTickets([]);
        await loadTickets();
        AnalyticsService.logCustomEvent('bulk_tickets_cancelled', { count: selectedTickets.length });
      } catch (err) {
        setError('Failed to cancel tickets');
        console.error('Error cancelling tickets:', err);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map(ticket => ticket.id!));
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  // Export functionality
  const handleExportTickets = () => {
    const csvContent = [
      ['Invite Code', 'Event Name', 'User ID', 'Status', 'Price', 'Currency', 'Payment ID', 'Main Ticket ID', 'Purchase Date', 'Used Date'].join(','),
      ...tickets.map(ticket => [
        ticket.inviteCode,
        ticket.eventName || 'Unknown',
        ticket.userId,
        ticket.status,
        ticket.price,
        ticket.currency,
        ticket.paymentId || 'N/A',
        ticket.mainTicketId || 'N/A',
        formatDate(ticket.purchaseDate),
        ticket.usedDate ? formatDate(ticket.usedDate) : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    AnalyticsService.logCustomEvent('tickets_exported', { count: tickets.length });
  };

  // Ticket validation
  const handleValidateTicket = async () => {
    if (!validationCode.trim()) return;

    try {
      const ticket = await ticketService.getTicketByInviteCode(validationCode.trim());
      if (ticket) {
        setValidationResult({ ticket, error: null });
        AnalyticsService.logCustomEvent('ticket_validated', { ticketId: ticket.id });
      } else {
        setValidationResult({ ticket: null, error: 'Ticket not found' });
      }
    } catch (err) {
      setValidationResult({ ticket: null, error: 'Failed to validate ticket' });
      console.error('Error validating ticket:', err);
    }
  };

  // Log action helper
  const logAction = (action: string, ticketId: string, inviteCode: string) => {
    const newAction = {
      action,
      ticketId,
      inviteCode,
      timestamp: new Date()
    };
    setRecentActions(prev => [newAction, ...prev.slice(0, 9)]); // Keep last 10 actions
  };

  const getStatusBadge = (status: TicketStatus | undefined) => {
    const statusConfig = {
      [TicketStatus.ACTIVE]: { label: 'Active', variant: 'default' as const, icon: Clock },
      [TicketStatus.USED]: { label: 'Used', variant: 'secondary' as const, icon: CheckCircle },
      [TicketStatus.SCANNED]: { label: 'Scanned', variant: 'secondary' as const, icon: CheckCircle },
      [TicketStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle },
      [TicketStatus.EXPIRED]: { label: 'Expired', variant: 'outline' as const, icon: XCircle },
    };

    if (!status || !statusConfig[status]) {
      const defaultConfig = { label: 'Unknown', variant: 'outline' as const, icon: Clock };
      const Icon = defaultConfig.icon;
      return (
        <Badge variant={defaultConfig.variant} className="flex items-center space-x-1">
          <Icon className="h-3 w-3" />
          <span>{defaultConfig.label}</span>
        </Badge>
      );
    }

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

  const formatPrice = (price: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price / 100); // Assuming price is in cents
  };

  return (
    <AdminLayout title="Tickets Management" subtitle="Manage all BarTrekker tickets, purchases and scanned tickets">
      <div className="max-w-7xl mx-auto">

        {/* Statistics Cards */}
        {ticketStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketStats.totalTickets}</div>
                <p className="text-xs text-muted-foreground">
                  All time tickets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{ticketStats.activeTickets}</div>
                <p className="text-xs text-muted-foreground">
                  Ready to use
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scanned Tickets</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{ticketStats.usedTickets}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully scanned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(ticketStats.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average: {formatPrice(ticketStats.averageTicketPrice)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ticket Validation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Ticket Validation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter invite code to validate..."
                  value={validationCode}
                  onChange={(e) => setValidationCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleValidateTicket()}
                />
              </div>
              <Button onClick={handleValidateTicket} disabled={!validationCode.trim()}>
                Validate
              </Button>
            </div>

            {validationResult && (
              <div className="mt-4">
                {validationResult.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{validationResult.error}</p>
                  </div>
                ) : validationResult.ticket ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-800 font-medium">Valid Ticket Found</p>
                        <p className="text-green-600 text-sm">
                          {validationResult.ticket.eventName} - {validationResult.ticket.inviteCode}
                        </p>
                        <p className="text-green-600 text-sm">
                          Status: {validationResult.ticket.status} |
                          Price: {formatPrice(validationResult.ticket.price, validationResult.ticket.currency)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {(validationResult.ticket.status === TicketStatus.ACTIVE || validationResult.ticket.status === TicketStatus.USED) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              handleMarkAsUsed(validationResult.ticket!.id!, validationResult.ticket!.inviteCode);
                              setValidationResult(null);
                              setValidationCode('');
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark as Scanned
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTicket(validationResult.ticket!.id!)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Actions Log */}
        {recentActions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Recent Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">{action.action}</p>
                        <p className="text-xs text-gray-500">Ticket: {action.inviteCode}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {action.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters & Actions</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTickets}
                  disabled={loading}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTickets}
                  disabled={tickets.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {selectedTickets.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkMarkAsUsed}
                      className="text-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Scanned ({selectedTickets.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkCancel}
                      className="text-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel ({selectedTickets.length})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-4 w-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-4 w-4" />
                  <Input
                    placeholder="Search by invite code..."
                    value={inviteCodeSearch}
                    onChange={(e) => setInviteCodeSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
                  className="w-full px-3 py-2 border border-barTrekker-lightGrey rounded-md focus:outline-none focus:ring-2 focus:ring-barTrekker-orange"
                >
                  <option value="">All Status</option>
                  <option value={TicketStatus.ACTIVE}>Active</option>
                  <option value={TicketStatus.USED}>Used</option>
                  <option value={TicketStatus.SCANNED}>Scanned</option>
                  <option value={TicketStatus.CANCELLED}>Cancelled</option>
                  <option value={TicketStatus.EXPIRED}>Expired</option>
                </select>
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

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Tickets ({tickets.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-barTrekker-orange"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-barTrekker-darkGrey/30 mx-auto mb-4" />
                <p className="text-barTrekker-darkGrey/70">No tickets found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={selectedTickets.length === tickets.length && tickets.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Invite Code</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Scanned Date</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket.id!)}
                            onChange={() => handleSelectTicket(ticket.id!)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {ticket.inviteCode}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.eventName || 'Unknown Event'}</div>
                            {ticket.eventLocation && (
                              <div className="flex items-center space-x-1 text-sm text-barTrekker-darkGrey/70">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-xs">{ticket.eventLocation}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-xs">{ticket.userId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(ticket.purchaseDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {ticket.usedDate ? formatDate(ticket.usedDate) : 'Not scanned'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{formatPrice(ticket.price, ticket.currency)}</span>
                          </div>
                          {ticket.paymentId && (
                            <div className="text-xs text-gray-500 mt-1">
                              Payment: {ticket.paymentId.substring(0, 8)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ticket.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTicket(ticket.id!)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(ticket.status === TicketStatus.ACTIVE || ticket.status === TicketStatus.USED || !ticket.status) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsUsed(ticket.id!, ticket.inviteCode)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Mark as scanned"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelTicket(ticket.id!, ticket.inviteCode)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Cancel ticket"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {ticket.status === TicketStatus.CANCELLED && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestoreTicket(ticket.id!, ticket.inviteCode)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Restore ticket to active"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {(ticket.status === TicketStatus.USED || ticket.status === TicketStatus.SCANNED) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestoreUsedTicket(ticket.id!, ticket.inviteCode)}
                                className="text-orange-600 hover:text-orange-700"
                                title="Restore scanned ticket to active"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTicket(ticket.id!, ticket.inviteCode)}
                              className="text-red-800 hover:text-red-900"
                              title="Permanently delete ticket"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal(prev => ({ ...prev, open }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
      />

      <DeleteConfirmModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal(prev => ({ ...prev, open }))}
        onConfirm={confirmDeleteTicket}
        loading={deleteModal.loading}
        textKey={`Permanently delete ticket ${deleteModal.inviteCode}? This action cannot be undone.`}
      />
    </AdminLayout>
  );
};
