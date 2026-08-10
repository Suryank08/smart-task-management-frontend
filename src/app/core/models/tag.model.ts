export interface TagDto {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface TagRequest {
  name: string;
  color?: string | null;
}
