export interface Client {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  state?: string;
  country: string;
  notes?: string;
  deletedAt?: Date; // null/undefined = active, Date = soft-deleted
  createdAt: Date;
  updatedAt: Date;
}
