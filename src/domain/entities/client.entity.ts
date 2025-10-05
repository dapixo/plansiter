export interface Client {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  state?: string;
  country: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
