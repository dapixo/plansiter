// Type utilisé dans le dialog de création rapide
export type PriceTypeDialog = 'perHour' | 'perDay' | 'perNight';

// Type utilisé dans la page de formulaire complète
export type PriceTypeForm = 'hour' | 'day' | 'night';

export const PRICE_TYPE_LABELS: Record<PriceTypeDialog, string> = {
  'perHour': 'services.form.pricePerHour',
  'perDay': 'services.form.pricePerDay',
  'perNight': 'services.form.pricePerNight'
};

export const PRICE_TYPE_LABELS_FORM: Record<PriceTypeForm, string> = {
  'hour': 'services.form.pricePerHour',
  'day': 'services.form.pricePerDay',
  'night': 'services.form.pricePerNight'
};

// Pour le dialog de création rapide
export const PRICE_TYPE_OPTIONS_DIALOG: { labelKey: string; value: PriceTypeDialog }[] = [
  { labelKey: PRICE_TYPE_LABELS['perHour'], value: 'perHour' },
  { labelKey: PRICE_TYPE_LABELS['perDay'], value: 'perDay' },
  { labelKey: PRICE_TYPE_LABELS['perNight'], value: 'perNight' },
];

// Pour la page de formulaire complète
export const PRICE_TYPE_OPTIONS_FORM: { labelKey: string; value: PriceTypeForm }[] = [
  { labelKey: PRICE_TYPE_LABELS_FORM['hour'], value: 'hour' },
  { labelKey: PRICE_TYPE_LABELS_FORM['day'], value: 'day' },
  { labelKey: PRICE_TYPE_LABELS_FORM['night'], value: 'night' },
];
