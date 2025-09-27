import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Calendar, MapPin, User, DollarSign, QrCode, Copy } from 'lucide-react';
import { AdminLayout } from '@/core/components/layout/AdminLayout';

import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { ticketService } from '@/core/services/ticketService';
import { Ticket, TicketStatus } from '@/core/types/ticket';
import { AnalyticsService } from '@/core/services/analyticsService';

export const TicketDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicket(id);
      AnalyticsService.logPageView('Ticket Details Page');
    }
  }, [id]);

  const loadTicket = async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const ticketData = await ticketService.getTicketById(ticketId);
      setTicket(ticketData);
    } catch (err) {
      setError('Failed to load ticket');
      console.error('Error loading ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!ticket) return;
    
    try {
      setActionLoading(true);
      await ticketService.markTicketAsUsed(ticket.id!);
      await loadTicket(ticket.id!);
      AnalyticsService.logCustomEvent('ticket_marked_used', { ticketId: ticket.id });
    } catch (err) {
      setError('Failed to mark ticket as used');
      console.error('Error marking ticket as used:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!ticket) return;
    
    try {
      setActionLoading(true);
      await ticketService.cancelTicket(ticket.id!);
      await loadTicket(ticket.id!);
      AnalyticsService.logCustomEvent('ticket_cancelled', { ticketId: ticket.id });
    } catch (err) {
      setError('Failed to cancel ticket');
      console.error('Error cancelling ticket:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/tickets');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getStatusBadge = (status: TicketStatus) => {
    const statusConfig = {
      [TicketStatus.ACTIVE]: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
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

  const formatPrice = (price: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price / 100);
  };

  if (loading) {
    return (
      <AdminLayout title="Loading..." subtitle="Loading ticket details">
        <div className="max-w-4xl mx-auto flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barTrekker-orange"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !ticket) {
    return (
      <AdminLayout title="Error" subtitle="Ticket not found">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'Ticket not found'}</p>
            <Button onClick={handleBack}>Back to Tickets</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Ticket Details" subtitle={`Invite Code: ${ticket.inviteCode}`}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Tickets</span>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticket Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ticket Information</span>
                  {getStatusBadge(ticket.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-barTrekker-darkGrey/70">Invite Code</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono text-lg">{ticket.inviteCode}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(ticket.inviteCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-barTrekker-darkGrey/70">Price</label>
                    <div className="flex items-center space-x-1 mt-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-lg font-semibold">{formatPrice(ticket.price, ticket.currency)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-barTrekker-darkGrey/70">Event</label>
                  <div className="mt-1">
                    <div className="font-medium">{ticket.eventName || 'Unknown Event'}</div>
                    {ticket.eventLocation && (
                      <div className="flex items-center space-x-1 text-sm text-barTrekker-darkGrey/70">
                        <MapPin className="h-3 w-3" />
                        <span>{ticket.eventLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-barTrekker-darkGrey/70">Purchase Date</label>
                    <div className="flex items-center space-x-1 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(ticket.purchaseDate)}</span>
                    </div>
                  </div>
                  {ticket.usedDate && (
                    <div>
                      <label className="text-sm font-medium text-barTrekker-darkGrey/70">Used Date</label>
                      <div className="flex items-center space-x-1 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(ticket.usedDate)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-barTrekker-darkGrey/70">User ID</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4" />
                    <span className="font-mono">{ticket.userId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(ticket.userId)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {ticket.groupName && (
                  <div>
                    <label className="text-sm font-medium text-barTrekker-darkGrey/70">Group Name</label>
                    <div className="mt-1">
                      <span className="font-medium">{ticket.groupName}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>QR Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="p-4 bg-white border-2 border-barTrekker-lightGrey rounded-lg">
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-barTrekker-darkGrey/30" />
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-barTrekker-darkGrey/70 mt-4">
                  QR Code for ticket validation
                </p>
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
                {ticket.status === TicketStatus.ACTIVE && (
                  <>
                    <Button
                      onClick={handleMarkAsUsed}
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
                          <CheckCircle className="h-4 w-4" />
                          <span>Mark as Used</span>
                        </div>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelTicket}
                      disabled={actionLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4" />
                        <span>Cancel Ticket</span>
                      </div>
                    </Button>
                  </>
                )}
                
                {ticket.status === TicketStatus.USED && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm text-center">
                      This ticket has been used
                    </p>
                  </div>
                )}

                {ticket.status === TicketStatus.CANCELLED && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm text-center">
                      This ticket has been cancelled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            {ticket.paymentIntentId && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="text-sm font-medium text-barTrekker-darkGrey/70">Payment Intent ID</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono text-sm">{ticket.paymentIntentId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(ticket.paymentIntentId!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
