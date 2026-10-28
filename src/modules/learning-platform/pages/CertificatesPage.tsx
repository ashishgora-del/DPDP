import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningApi } from '../lib/api';
import { Certificate } from '../types';
import { getErrorMessage, formatDate } from '../lib/helpers';
import Header from '../components/layout/Header';
import AuthGuard from '../components/common/AuthGuard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const CertificatesPage: React.FC = () => {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadCertificates = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await learningApi.getMyCertificates();
        setCertificates(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadCertificates();
  }, []);

  const handleDownload = async (certificateId: string) => {
    try {
      // This would trigger a download of the certificate PDF
      const response = await learningApi.downloadCertificate(certificateId);
      // Handle download logic here
      console.log('Downloading certificate:', certificateId);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleShare = (certificate: Certificate) => {
    // Share certificate URL or open share modal
    const shareUrl = `${window.location.origin}/trinetrai/learning-platform/certificates/${certificate.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Certificate: ${certificate.course?.title}`,
        text: `I earned a certificate in ${certificate.course?.title}!`,
        url: shareUrl
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Certificate link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/learning-platform/profile')}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Profile
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
          <p className="text-gray-600">View and download your earned certificates</p>
        </div>

        {/* Content */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => window.location.reload()}
            className="mb-6"
          />
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : certificates.length === 0 ? (
          <EmptyState
            title="No certificates yet"
            description="Complete courses to earn certificates and showcase your achievements!"
            icon={
              <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            }
            action={{
              label: 'Browse Courses',
              onClick: () => navigate('/learning-platform/catalog')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map(certificate => (
              <div
                key={certificate.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Certificate Preview */}
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 text-center border-4 border-primary-200">
                  <div className="mb-4">
                    <svg
                      className="w-16 h-16 mx-auto text-primary-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-primary-900 mb-2">
                    Certificate of Completion
                  </h3>
                  <p className="text-sm text-primary-700 font-medium">
                    {certificate.course?.title || 'Course Title'}
                  </p>
                </div>

                {/* Certificate Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Issued Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(certificate.issuedAt)}
                    </p>
                  </div>

                  {certificate.certificateUrl && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Certificate ID</p>
                      <p className="text-xs font-mono text-gray-700">{certificate.id}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(certificate.id)}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium text-sm flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download
                    </button>
                    <button
                      onClick={() => handleShare(certificate)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CertificatesPage;
