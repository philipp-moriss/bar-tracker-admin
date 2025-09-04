import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, DollarSign, Calendar, MapPin, User } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';

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
import { Ticket, TicketStatus, TicketFilters } from '@/core/types/ticket';
import { AnalyticsService } from '@/core/services/analyticsService';

export const AdminTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteCodeSearch, setInviteCodeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [error, setError] = useState<string | null>(null);

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

      const ticketsData = await ticketService.getTickets(filters);
      setTickets(ticketsData);
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
    if (window.confirm(`Mark ticket ${inviteCode} as used?`)) {
      try {
        await ticketService.markTicketAsUsed(ticketId);
        await loadTickets();
        AnalyticsService.logCustomEvent('ticket_marked_used', { ticketId });
      } catch (err) {
        setError('Failed to mark ticket as used');
        console.error('Error marking ticket as used:', err);
      }
    }
  };

  const handleCancelTicket = async (ticketId: string, inviteCode: string) => {
    if (window.confirm(`Cancel ticket ${inviteCode}?`)) {
      try {
        await ticketService.cancelTicket(ticketId);
        await loadTickets();
        AnalyticsService.logCustomEvent('ticket_cancelled', { ticketId });
      } catch (err) {
        setError('Failed to cancel ticket');
        console.error('Error cancelling ticket:', err);
      }
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    const statusConfig = {
      [TicketStatus.ACTIVE]: { label: 'Active', variant: 'default' as const, icon: Clock },
      [TicketStatus.USED]: { label: 'Used', variant: 'secondary' as const, icon: CheckCircle },
      [TicketStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle },
      [TicketStatus.EXPIRED]: { label: 'Expired', variant: 'outline' as const, icon: XCircle },
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

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price / 100); // Assuming price is in cents
  };

  return (
    <AdminLayout title="Tickets Management" subtitle="Manage all BarTrekker tickets and purchases">
      <div className="max-w-7xl mx-auto">

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
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
                      <TableHead>Invite Code</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
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
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{formatPrice(ticket.price, ticket.currency)}</span>
                          </div>
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
                            {ticket.status === TicketStatus.ACTIVE && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsUsed(ticket.id!, ticket.inviteCode)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelTicket(ticket.id!, ticket.inviteCode)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
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
    </AdminLayout>
  );
};
