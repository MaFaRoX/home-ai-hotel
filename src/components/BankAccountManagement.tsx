'use client'

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Building2, CreditCard, User, FileText, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { VIETNAMESE_BANKS, getBankByCode, getBankByShortName } from '../utils/vietnameseBanks';

interface BankAccountManagementProps {
  open: boolean;
  onClose: () => void;
}

export function BankAccountManagement({ open, onClose }: BankAccountManagementProps) {
  const { hotel, updateBankAccount } = useApp();
  const { t } = useLanguage();
  const [bankCode, setBankCode] = useState('');
  const [bankSearchText, setBankSearchText] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  useEffect(() => {
    if (hotel?.bankAccount) {
      // If bankCode exists, use it; otherwise try to find by bankName (backward compatibility)
      if (hotel.bankAccount.bankCode) {
        setBankCode(hotel.bankAccount.bankCode);
        const bank = getBankByCode(hotel.bankAccount.bankCode);
        setBankSearchText(bank?.shortName || '');
      } else if (hotel.bankAccount.bankName) {
        // Backward compatibility: try to find bank by short name
        const bank = getBankByShortName(hotel.bankAccount.bankName);
        setBankCode(bank?.code || '');
        setBankSearchText(bank?.shortName || hotel.bankAccount.bankName);
      } else {
        setBankCode('');
        setBankSearchText('');
      }
      setAccountNumber(hotel.bankAccount.accountNumber || '');
      setAccountHolder(hotel.bankAccount.accountHolder || '');
    } else {
      setBankCode('');
      setBankSearchText('');
      setAccountNumber('');
      setAccountHolder('');
    }
  }, [hotel, open]);

  // Filter banks based on search text
  const filteredBanks = useMemo(() => {
    if (!bankSearchText.trim()) {
      return VIETNAMESE_BANKS;
    }
    const searchLower = bankSearchText.toLowerCase();
    return VIETNAMESE_BANKS.filter(
      bank =>
        bank.shortName.toLowerCase().includes(searchLower) ||
        bank.fullName.toLowerCase().includes(searchLower) ||
        bank.code.toLowerCase().includes(searchLower)
    );
  }, [bankSearchText]);

  const handleBankSelect = (bank: typeof VIETNAMESE_BANKS[0]) => {
    setBankCode(bank.code);
    setBankSearchText(bank.shortName);
    setShowBankDropdown(false);
  };

  const handleBankInputChange = (value: string) => {
    setBankSearchText(value);
    setShowBankDropdown(true);
    // If user clears the input, also clear the bankCode
    if (!value.trim()) {
      setBankCode('');
    }
  };

  const handleBankInputFocus = () => {
    setShowBankDropdown(true);
  };

  const handleBankInputBlur = () => {
    // Delay hiding dropdown to allow click
    setTimeout(() => {
      setShowBankDropdown(false);
      // If bankCode is set but search text doesn't match, restore the bank name
      if (bankCode && !bankSearchText) {
        const bank = getBankByCode(bankCode);
        if (bank) {
          setBankSearchText(bank.shortName);
        }
      }
    }, 200);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBank = getBankByCode(bankCode);
    if (!selectedBank) {
      toast.error(t('bank.invalidBankSelection') || 'Please select a valid bank');
      return;
    }

    try {
      await updateBankAccount({
        bankName: selectedBank.shortName,
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
      });

      toast.success(t('bank.updateSuccess'));
      onClose();
    } catch (error) {
      // Error already handled in AppContext
    }
  };

  const selectedBank = getBankByCode(bankCode);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <DialogTitle className="text-xl font-bold">{t('bank.title')}</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Bank Selection */}
          <div className="space-y-2">
            <Label htmlFor="bank-select" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              {t('bank.bankNameLabel')}
            </Label>
            <div className="relative">
              <Input
                id="bank-select"
                value={bankSearchText}
                onChange={(e) => handleBankInputChange(e.target.value)}
                onFocus={handleBankInputFocus}
                onBlur={handleBankInputBlur}
                placeholder={t('bank.bankNamePlaceholder')}
                required
                className="pr-10"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              {showBankDropdown && filteredBanks.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[300px] overflow-y-auto">
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors first:rounded-t-md last:rounded-b-md"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleBankSelect(bank);
                      }}
                    >
                      <div className="font-medium">{bank.shortName}</div>
                      <div className="text-xs text-gray-500">{bank.fullName}</div>
                    </button>
                  ))}
                </div>
              )}
              {showBankDropdown && filteredBanks.length === 0 && bankSearchText.trim() && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-sm text-gray-500">
                  {t('bank.noBanksFound')}
                </div>
              )}
            </div>
            {selectedBank && (
              <p className="text-xs text-gray-500">
                {selectedBank.fullName}
              </p>
            )}
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="account-number" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              {t('bank.accountNumberLabel')}
            </Label>
            <Input
              id="account-number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={t('bank.accountNumberPlaceholder')}
              required
            />
          </div>

          {/* Account Holder */}
          <div className="space-y-2">
            <Label htmlFor="account-holder" className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              {t('bank.accountHolderLabel')}
            </Label>
            <Input
              id="account-holder"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
              placeholder={t('bank.accountHolderPlaceholder')}
              required
            />
            <p className="text-xs text-gray-500">{t('bank.accountHolderHint')}</p>
          </div>

          {/* Notes */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-blue-900">{t('bank.note')}</p>
                <ul className="space-y-1 text-blue-800 list-disc list-inside">
                  <li>{t('bank.note1')}</li>
                  <li>{t('bank.note2')}</li>
                  <li>{t('bank.note3')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t('bank.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-2" />
              {t('bank.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

