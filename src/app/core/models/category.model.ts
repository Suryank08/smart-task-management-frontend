export interface CategoryDto {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  color: string | null;
  createdAt: string;
}

export interface CategoryRequest {
  name: string;
  icon?: string | null;
  color?: string | null;
}
