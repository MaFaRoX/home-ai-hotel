'use client'

import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Building2, CreditCard, User, QrCode, CheckCircle2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface BankAccountManagementProps {
  open: boolean;
  onClose: () => void;
}

export function BankAccountManagement({ open, onClose }: BankAccountManagementProps) {
  const { hotel, updateBankAccount } = useApp();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(!hotel?.bankAccount);
  const [bankName, setBankName] = useState(hotel?.bankAccount?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(hotel?.bankAccount?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(hotel?.bankAccount?.accountHolder || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBankAccount(bankName, accountNumber, accountHolder);
    toast.success(t('bank.updateSuccess'));
    setIsEditing(false);
  };

  const handleEdit = () => {
    setBankName(hotel?.bankAccount?.bankName || '');
    setAccountNumber(hotel?.bankAccount?.accountNumber || '');
    setAccountHolder(hotel?.bankAccount?.accountHolder || '');
    setIsEditing(true);
  };

  // Generate QR code URL
  const generateQRCode = () => {
    if (!hotel?.bankAccount) return '';
    const qrData = `${t('bank.bankName')}: ${hotel.bankAccount.bankName}\n${t('bank.accountNumber')}: ${hotel.bankAccount.accountNumber}\n${t('bank.accountHolder')}: ${hotel.bankAccount.accountHolder}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t('bank.title')}
          </DialogTitle>
          <DialogDescription>
            {t('bank.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isEditing && hotel?.bankAccount ? (
            <>
              {/* Display Mode */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-gray-900">{t('bank.accountInfo')}</h3>
                      <p className="text-xs text-gray-600">{t('bank.active')}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t('bank.edit')}
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">{t('bank.bankName')}</span>
                    </div>
                    <p className="text-gray-900 pl-6">{hotel.bankAccount.bankName}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">{t('bank.accountNumber')}</span>
                    </div>
                    <p className="text-gray-900 pl-6 tracking-wider">
                      {hotel.bankAccount.accountNumber}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">{t('bank.accountHolder')}</span>
                    </div>
                    <p className="text-gray-900 pl-6">{hotel.bankAccount.accountHolder}</p>
                  </div>
                </div>
              </Card>

              {/* QR Code Preview */}
              <Card className="p-6 bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="w-5 h-5 text-gray-700" />
                  <h3 className="text-gray-900">{t('bank.qrCode')}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {t('bank.qrDescription')}
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <img
                    src={generateQRCode()}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </Card>

              {/* Info Message */}
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-900 mb-1">
                      {t('bank.configured')}
                    </p>
                    <p className="text-xs text-green-700">
                      {t('bank.configuredDescription')}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="bank-name">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <span>{t('bank.bankNameLabel')}</span>
                    </div>
                  </Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder={t('bank.bankNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="account-number">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-gray-600" />
                      <span>{t('bank.accountNumberLabel')}</span>
                    </div>
                  </Label>
                  <Input
                    id="account-number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={t('bank.accountNumberPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="account-holder">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span>{t('bank.accountHolderLabel')}</span>
                    </div>
                  </Label>
                  <Input
                    id="account-holder"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder={t('bank.accountHolderPlaceholder')}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('bank.accountHolderHint')}
                  </p>
                </div>

                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-900 mb-1">{t('bank.note')}</p>
                      <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                        <li>{t('bank.note1')}</li>
                        <li>{t('bank.note2')}</li>
                        <li>{t('bank.note3')}</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3 pt-2">
                  {hotel?.bankAccount && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      {t('bank.cancel')}
                    </Button>
                  )}
                  <Button type="submit" className="flex-1">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {t('bank.save')}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
