'use client'

import { LogOut, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from '../contexts/AppContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

export function BackToModelSelectorButton() {
  const { setBusinessModel } = useApp();

  const handleBackToModelSelector = () => {
    // Clear business model to return to selector
    setBusinessModel(null as any);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 bg-white hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Đổi Module
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-orange-600" />
            Quay về Màn hình Chọn Module?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn quay về màn hình chọn module kinh doanh?
          </AlertDialogDescription>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm mt-3">
            <div className="font-semibold text-amber-900 mb-1">⚠️ Lưu ý:</div>
            <ul className="space-y-1 text-amber-800">
              <li>• Dữ liệu của bạn sẽ được tự động lưu</li>
              <li>• Bạn có thể quay lại module này bất cứ lúc nào</li>
              <li>• Hệ thống sẽ giữ nguyên trạng thái hiện tại</li>
            </ul>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Ở lại</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBackToModelSelector}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Quay về
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
