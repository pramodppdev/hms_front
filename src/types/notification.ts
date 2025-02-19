export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'urgent_report' | 'general';
  read: boolean;
  created_at: string;
  metadata?: {
    report_id?: string;
    patient_id?: string;
  };
}

export interface CreateNotificationDTO {
  user_id: string;
  title: string;
  message: string;
  type: 'urgent_report' | 'general';
  metadata?: {
    report_id?: string;
    patient_id?: string;
  };
}