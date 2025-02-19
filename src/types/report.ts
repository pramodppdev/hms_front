export interface Report {
  id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  priority: 'Urgent' | 'Not Urgent';
  status: 'Draft' | 'Published';
  created_at: string;
  created_by: {
    username: string;
  };
}

export interface ReportFormData {
  title: string;
  content: string;
  priority: 'Urgent' | 'Not Urgent';
  status: 'Draft' | 'Published';
}