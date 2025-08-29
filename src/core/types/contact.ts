export interface Contact {
  id: string;
  name: string;
  description: string;
  label: string;
  link: string;
  phone: string;
}

export interface ContactInfo {
  id: string;
  title: string;
  description: string;
  ending: string;
  userId: number;
  contactIds: number[];
}
export interface ContactInfoResponse {
  id: string;
  title: string;
  description: string;
  ending: string;
  userId: number;
  contacts: Contact[];
}

export interface CreateContactDto {
  name: string;
  description: string;
  label: string;
  link: string;
  phone: string;
}

export interface CreateContactInfoDto {
  title: string;
  description: string;
  ending: string;
  userId: number;
  contactIds: number[];
}

export type UpdateContactDto = Partial<CreateContactDto>;

export type UpdateContactInfoDto = Partial<CreateContactInfoDto>; 