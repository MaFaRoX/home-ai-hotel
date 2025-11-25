'use client'

import { useBusinessModel } from '../hooks/useBusinessModel';
import { businessModelInfo } from '../utils/businessModelFeatures';
import { Badge } from './ui/badge';

export function BusinessModelBadge() {
  const { businessModel } = useBusinessModel();
  const info = businessModelInfo[businessModel];

  return (
    <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
      <span className="text-3xl">{info.icon}</span>
      <span className="text-2xl font-bold">{info.title}</span>
    </Badge>
  );
}
