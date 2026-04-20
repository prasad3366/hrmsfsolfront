import React from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '../../components/ui/components';

interface MedicalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: string | null | undefined;
  fileName?: string;
  employeeName: string;
  leaveType: string;
  dates: string;
}

const MedicalCertificateModal: React.FC<MedicalCertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
  fileName,
  employeeName,
  leaveType,
  dates,
}) => {
  if (!isOpen || !certificate) return null;

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = certificate;
      link.download = fileName || 'medical-certificate';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download certificate:', error);
    }
  };

  const isPdf = certificate.startsWith('data:application/pdf');
  const isImage = certificate.startsWith('data:image/');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Medical Certificate</h2>
            <p className="text-sm text-slate-600 mt-1">
              {employeeName} • {leaveType} • {dates}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isImage ? (
            <div className="flex items-center justify-center">
              <img
                src={certificate}
                alt="Medical Certificate"
                className="max-w-full max-h-[500px] rounded-lg shadow-sm border border-slate-200"
              />
            </div>
          ) : isPdf ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-slate-100 rounded-lg mb-4">
                <svg
                  className="w-12 h-12 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-slate-600 font-medium mb-2">{fileName || 'PDF Document'}</p>
              <p className="text-sm text-slate-500 mb-4">
                Click download to view the PDF certificate
              </p>
              <Button onClick={handleDownload} className="gap-2">
                <Download size={16} /> Download PDF
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>Unable to display certificate format</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-slate-200 bg-slate-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download size={16} /> Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MedicalCertificateModal;
