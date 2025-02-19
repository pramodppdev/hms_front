import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { PatientReportForm } from './PatientReportForm';
import { Report } from '../types/report';

interface PatientReportListProps {
  patientId: string;
  showDrafts?: boolean;
  canEdit?: boolean;
}

interface ReportResponse {
  id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  priority: 'Urgent' | 'Not Urgent';
  status: 'Draft' | 'Published';
  created_at: string;
  created_by: {
    username: string;
  } | null;
}

export const PatientReportList: React.FC<PatientReportListProps> = ({ 
  patientId, 
  showDrafts = true,
  canEdit = false
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  const loadReports = async () => {
    try {
      const query = supabase
        .from('patient_reports')
        .select(`
          id,
          title,
          content,
          file_url,
          priority,
          status,
          created_at,
          created_by:users!created_by(username)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (!showDrafts) {
        query.eq('status', 'Published');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading reports:', error);
        toast.error('Failed to load reports');
        return;
      }

      const transformedReports: Report[] = (data || []).map((report: ReportResponse) => ({
        id: report.id,
        title: report.title,
        content: report.content,
        file_url: report.file_url,
        priority: report.priority,
        status: report.status,
        created_at: report.created_at,
        created_by: {
          username: report.created_by?.username || 'Unknown'
        }
      }));

      setReports(transformedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();

    const subscription = supabase
      .channel('patient_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_reports',
          filter: `patient_id=eq.${patientId}`
        },
        () => {
          loadReports();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [patientId, showDrafts]);

  const handleDownload = async (fileUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('reports')
        .download(fileUrl);

      if (error) {
        console.error('Error downloading file:', error);
        toast.error('Failed to download file');
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileUrl.split('/').pop() || 'report';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-600">Loading reports...</div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-600">No reports found</div>
      </div>
    );
  }

  if (editingReport) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Report</h3>
          <PatientReportForm
            patientId={patientId}
            report={editingReport}
            onSuccess={() => {
              setEditingReport(null);
              loadReports();
            }}
            onCancel={() => setEditingReport(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          className="bg-white shadow overflow-hidden sm:rounded-lg"
        >
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {report.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Created by {report.created_by.username} on{' '}
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  report.priority === 'Urgent'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {report.priority}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  report.status === 'Draft'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {report.status}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="prose max-w-none text-gray-900">
              {report.content}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="space-x-4">
                {report.file_url && (
                  <button
                    onClick={() => handleDownload(report.file_url!)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Download Attachment
                  </button>
                )}
              </div>
              {canEdit && (
                <button
                  onClick={() => setEditingReport(report)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Report
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};