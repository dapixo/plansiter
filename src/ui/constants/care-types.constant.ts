import { CareType } from '@domain/entities/user-preferences.entity';

/**
 * Mapping des types de soins vers leurs clés de traduction
 */
export const CARE_TYPE_LABELS: Record<CareType, string> = {
  'pet': 'common.careTypes.pet',
  'plant': 'common.careTypes.plant',
  'child': 'common.careTypes.child',
  'house': 'common.careTypes.house',
  'other': 'common.careTypes.other'
};

/**
 * Options de types de soins pour les dropdowns et formulaires
 */
export const CARE_TYPE_OPTIONS: { labelKey: string; value: CareType }[] = [
  { labelKey: CARE_TYPE_LABELS['pet'], value: 'pet' },
  { labelKey: CARE_TYPE_LABELS['plant'], value: 'plant' },
  { labelKey: CARE_TYPE_LABELS['child'], value: 'child' },
  { labelKey: CARE_TYPE_LABELS['house'], value: 'house' },
  { labelKey: CARE_TYPE_LABELS['other'], value: 'other' },
];
