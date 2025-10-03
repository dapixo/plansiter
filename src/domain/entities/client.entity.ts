export interface Client {
  id: string;
  userId: string;
  companyName?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
