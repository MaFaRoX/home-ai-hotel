import { useApp } from '../contexts/AppContext';
import { getFeatures } from '../utils/businessModelFeatures';
import { BusinessModelFeatures } from '../utils/businessModelFeatures';

export function useBusinessModel() {
  const { businessModel, hotel } = useApp();
  
  // Get from hotel if businessModel is not set yet
  const model = businessModel || hotel?.businessModel || 'hotel';
  const features = getFeatures(model);

  return {
    businessModel: model,
    features,
    isHotel: model === 'hotel',
    isGuestHouse: model === 'guesthouse',
    isBoardingHouse: model === 'boarding-house',
  };
}
