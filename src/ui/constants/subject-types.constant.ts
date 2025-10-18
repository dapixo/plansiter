import { SubjectType } from '@domain/entities';

/**
 * Liste des types de sujets disponibles avec leurs clés de traduction
 */
export const SUBJECT_TYPES: { label: string; value: SubjectType }[] = [
  { label: 'subjects.types.pet', value: 'pet' },
  { label: 'subjects.types.plant', value: 'plant' },
  { label: 'subjects.types.child', value: 'child' },
  { label: 'subjects.types.house', value: 'house' },
  { label: 'subjects.types.other', value: 'other' },
];
