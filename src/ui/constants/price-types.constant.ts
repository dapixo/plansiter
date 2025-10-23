import { PriceType } from '@domain/entities';

// Labels de traduction pour chaque type de prix
export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  'per-visit': 'services.form.pricePerVisit',
  'per-day': 'services.form.pricePerDay',
  'per-night': 'services.form.pricePerNight'
};

// Options pour les radio buttons
export const PRICE_TYPE_OPTIONS: { labelKey: string; value: PriceType; icon: string }[] = [
  { labelKey: PRICE_TYPE_LABELS['per-visit'], value: 'per-visit', icon: 'pi-clock' },
  { labelKey: PRICE_TYPE_LABELS['per-day'], value: 'per-day', icon: 'pi-sun' },
  { labelKey: PRICE_TYPE_LABELS['per-night'], value: 'per-night', icon: 'pi-moon' },
];
