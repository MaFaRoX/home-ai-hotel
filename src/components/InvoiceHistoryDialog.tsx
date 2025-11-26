'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  FileText, 
  Search, 
  Download, 
  Mail, 
  Eye,
  Calendar,
  DollarSign,
  User,
  Filter,
  X
} from 'lucide-react';
import { InvoicePDF } from './InvoicePDF';

interface InvoiceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Invoice {
  id: string;
  invoiceNumber?: string;
  customerName?: string;
  customerTaxCode?: string;
  customerEmail?: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  amountBeforeVAT: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  status: 'draft' | 'issued' | 'sent' | 'paid';
  companyInfo: {
    name: string;
    taxCode: string;
    address: string;
    phone: string;
    email: string;
  };
}

export function InvoiceHistoryDialog({ open, onOpenChange }: InvoiceHistoryDialogProps) {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadInvoices();
    }
  }, [open]);

  useEffect(() => {
    filterInvoices();
  }, [searchQuery, statusFilter, invoices]);

  const loadInvoices = () => {
    setLoading(true);
    try {
      // Load from localStorage
      const saved = localStorage.getItem('invoices');
      if (saved) {
        setInvoices(JSON.parse(saved));
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(query) ||
        inv.customerName?.toLowerCase().includes(query) ||
        inv.roomNumber?.toLowerCase().includes(query) ||
        inv.id.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { labelKey: string; variant: any }> = {
      draft: { labelKey: 'invoiceHistory.draft', variant: 'secondary' },
      issued: { labelKey: 'invoiceHistory.issued', variant: 'default' },
      sent: { labelKey: 'invoiceHistory.sent', variant: 'outline' },
      paid: { labelKey: 'payment.completePayment', variant: 'default' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{t(config.labelKey as any)}</Badge>;
  };

  const handleSendEmail = (invoice: Invoice) => {
    if (!invoice.customerEmail) {
      alert(t('invoiceHistory.noEmail'));
      return;
    }

    setSendingEmail(invoice.id);
    
    // Simulate sending email - in frontend-only mode
    setTimeout(() => {
      alert(t('invoiceHistory.emailSent').replace('{email}', invoice.customerEmail || ''));
      
      // Update status in localStorage
      const updated = invoices.map(inv => 
        inv.id === invoice.id ? { ...inv, status: 'sent' as const } : inv
      );
      setInvoices(updated);
      localStorage.setItem('invoices', JSON.stringify(updated));
      
      setSendingEmail(null);
    }, 1000);
  };

  if (selectedInvoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('invoiceHistory.detail')}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription>
              {t('invoiceHistory.viewDetail')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Invoice Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSendEmail(selectedInvoice)}
                disabled={!selectedInvoice.customerEmail || sendingEmail === selectedInvoice.id}
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendingEmail === selectedInvoice.id ? t('invoiceHistory.sending') : t('invoiceHistory.sendEmail')}
              </Button>
            </div>

            {/* PDF Preview */}
            <InvoicePDF invoice={selectedInvoice} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('invoiceHistory.title')}
          </DialogTitle>
          <DialogDescription>
            {t('invoiceHistory.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('invoiceHistory.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                {t('invoiceHistory.all')}
              </Button>
              <Button
                variant={statusFilter === 'issued' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('issued')}
              >
                {t('invoiceHistory.issued')}
              </Button>
              <Button
                variant={statusFilter === 'sent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('sent')}
              >
                {t('invoiceHistory.sent')}
              </Button>
            </div>
          </div>

          {/* Invoice List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              {t('invoiceHistory.loading')}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('invoiceHistory.noInvoices')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Invoice Info */}
                    <div className="col-span-8">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">
                          {invoice.invoiceNumber || invoice.id}
                        </span>
                        {getStatusBadge(invoice.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {invoice.customerName || t('invoiceHistory.retail')}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(invoice.totalAmount)}₫
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(invoice.createdAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          {t('invoiceHistory.room')} {invoice.roomNumber}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-4 flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmail(invoice)}
                        disabled={!invoice.customerEmail || sendingEmail === invoice.id}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          {filteredInvoices.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {t('invoiceHistory.totalInvoices')} <span className="font-semibold">{filteredInvoices.length}</span>
                </span>
                <span className="text-sm text-gray-600">
                  {t('invoiceHistory.totalValue')}{' '}
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(
                      filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
                    )}₫
                  </span>
                </span>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}