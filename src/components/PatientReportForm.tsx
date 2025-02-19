import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Report } from '../types/report';
import { notificationService } from '../services/notification';

interface PatientReportFormProps {
  patientId: string;
  report?: Report;
  onSuccess: () => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  content: string;
  priority: 'Urgent' | 'Not Urgent';
  status: 'Draft' | 'Published';
}

export const PatientReportForm: React.FC<PatientReportFormProps> = ({ 
  patientId, 
  report, 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: report?.title || '',
    content: report?.content || '',
    priority: report?.priority || 'Not Urgent',
    status: report?.status || 'Draft'
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const notifyDoctor = async (reportId: string) => {
    try {
      // Get patient details
      const { data: patient } = await supabase
        .from('patients')
        .select('name, assigned_doctor')
        .eq('id', patientId)
        .single();

      if (patient?.assigned_doctor) {
        // Get doctor's user_id
        const { data: doctor } = await supabase
          .from('doctors')
          .select('user_id')
          .eq('id', patient.assigned_doctor)
          .single();

        if (doctor?.user_id) {
          await notificationService.createNotification({
            user_id: doctor.user_id,
            title: 'Urgent Report',
            message: `New urgent report for patient ${patient.name}: ${formData.title}`,
            type: 'urgent_report',
            metadata: {
              report_id: reportId,
              patient_id: patientId
            }
          });
        }
      }
    } catch (error) {
      console.error('Error notifying doctor:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }

      let fileUrl = report?.file_url || null;
      if (file) {
        // Delete old file if it exists
        if (report?.file_url) {
          await supabase.storage
            .from('reports')
            .remove([report.file_url]);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}${Date.now()}.${fileExt}`;
        const filePath = `patient-reports/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('reports')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        fileUrl = data.path;
      }

      let reportId: string;

      if (report) {
        // Update existing report
        const { error } = await supabase
          .from('patient_reports')
          .update({
            title: formData.title,
            content: formData.content,
            file_url: fileUrl,
            priority: formData.priority,
            status: formData.status,
          })
          .eq('id', report.id);

        if (error) throw error;
        reportId = report.id;
        toast.success('Report updated successfully');
      } else {
        // Create new report
        const { data: newReport, error } = await supabase
          .from('patient_reports')
          .insert([{
            patient_id: patientId,
            title: formData.title,
            content: formData.content,
            file_url: fileUrl,
            priority: formData.priority,
            status: formData.status,
            created_by: currentUser.user.id
          }])
          .select()
          .single();

        if (error) throw error;
        reportId = newReport.id;
        toast.success('Report saved successfully');
      }

      // If report is urgent and published, notify the assigned doctor
      if (formData.priority === 'Urgent' && formData.status === 'Published') {
        await notifyDoctor(reportId);
      }

      setFormData({
        title: '',
        content: '',
        priority: 'Not Urgent',
        status: 'Draft'
      });
      setFile(null);
      onSuccess();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Report Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Report Content
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">
          {report?.file_url ? 'Replace File' : 'Attach File'}
        </label>
        <input
          type="file"
          id="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full"
        />
        {report?.file_url && !file && (
          <p className="mt-1 text-sm text-gray-500">
            Current file: {report.file_url.split('/').pop()}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          id="priority"
          value={formData.priority}
          onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'Urgent' | 'Not Urgent' }))}
          className="mt-1"
        >
          <option value="Not Urgent">Not Urgent</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'Draft' | 'Published' }))}
          className="mt-1"
        >
          <option value="Draft">Save as Draft</option>
          <option value="Published">Publish</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (report ? 'Updating...' : 'Saving...') : (report ? 'Update Report' : 'Save Report')}
        </button>
      </div>
    </form>
  );
};