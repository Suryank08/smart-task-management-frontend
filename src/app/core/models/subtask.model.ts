export interface SubtaskDto {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubtaskRequest {
  title: string;
  completed: boolean;
  position: number;
}
