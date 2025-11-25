'use client'

import { BusinessModel } from '../types';
import { businessModelInfo } from '../utils/businessModelFeatures';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Check } from 'lucide-react';

interface BusinessModelSelectorProps {
  onSelect: (model: BusinessModel) => void;
}

export function BusinessModelSelector({ onSelect }: BusinessModelSelectorProps) {
  const models: BusinessModel[] = ['hotel', 'guesthouse', 'boarding-house'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-3">
            🏨 Chào mừng đến với Hotel Management
          </h1>
          <p className="text-gray-600">
            Chọn mô hình kinh doanh phù hợp với bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {models.map((model) => {
            const info = businessModelInfo[model];
            return (
              <Card
                key={model}
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-blue-500 flex flex-col h-full"
                onClick={() => onSelect(model)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="text-6xl mb-4">{info.icon}</div>
                  <CardTitle className="text-2xl">{info.title}</CardTitle>
                  <CardDescription className="text-base">
                    {info.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="space-y-4 flex-1">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {info.description}
                    </p>
                    
                    <div className="space-y-2 pt-2">
                      {info.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    size="lg"
                  >
                    Chọn mô hình này
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>💡 Bạn có thể thay đổi mô hình sau khi thiết lập</p>
        </div>
      </div>
    </div>
  );
}
