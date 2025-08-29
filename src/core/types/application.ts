export interface Application {
  id: string;
  name: string;
  tag: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationDto {
  name: string;
  tag: string;
  description: string;
}

export interface UpdateApplicationDto {
  name: string;
  tag: string;
  description: string;
} 