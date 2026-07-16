export interface Address {
  id: number;
  label: string;
  cityOrProvince: string;
  districtOrSoum: string;
  khorooOrBag: string | null;
  addressLine: string;
  additionalDetails: string | null;
  recipientName: string;
  recipientPhone: string;
  defaultAddress: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddressInput = Omit<Address, 'id' | 'createdAt' | 'updatedAt'>;

export interface ProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  currentPassword?: string;
}

export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
}
