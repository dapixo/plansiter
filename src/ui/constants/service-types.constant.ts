import { ServiceType } from '@domain/entities';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  'pet-sitting': 'services.types.petSitting',
  'plant-sitting': 'services.types.plantSitting',
  'babysitting': 'services.types.babysitting',
  'house-sitting': 'services.types.houseSitting',
  'other': 'services.types.other'
};

export const SERVICE_TYPE_OPTIONS: { labelKey: string; value: ServiceType }[] = [
  { labelKey: SERVICE_TYPE_LABELS['pet-sitting'], value: 'pet-sitting' },
  { labelKey: SERVICE_TYPE_LABELS['plant-sitting'], value: 'plant-sitting' },
  { labelKey: SERVICE_TYPE_LABELS['babysitting'], value: 'babysitting' },
  { labelKey: SERVICE_TYPE_LABELS['house-sitting'], value: 'house-sitting' },
  { labelKey: SERVICE_TYPE_LABELS['other'], value: 'other' },
];
