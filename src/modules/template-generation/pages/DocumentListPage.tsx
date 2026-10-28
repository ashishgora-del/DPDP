import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Breadcrumbs } from '../../../shared/components';
import { 
  FileText, 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Clock,
  CheckCircle,
  Archive,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useDocuments, useDeleteDocument } from '../hooks/useTemplates';
import { LoadingState } from '../../../shared/components/LoadingState';
import type { GeneratedDocument } from '../api';

const STATUS_ICONS: Record<string, any> = {
  DRAFT: Edit,
  FINAL: CheckCircle,
  ARCHIVED: Archive,
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  FINAL: 'text-green-600 bg-green-50 border-green-200',
  ARCHIVED: 'text-gray-600 bg-gray-50 border-gray-200',
};

export default function DocumentListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, loading, error, refetch } = useDocuments(page, 20);
  const { deleteById, deleting } = useDeleteDocument();

  const handleDelete = async (id: string) => {
    try {
      await deleteById(id);
      setConfirmDelete(null);
      refetch();
      alert('Document deleted successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to delete document');
    }
  };

  if (loading) {
    return <LoadingState fullScreen message="Loading documents..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 border border-red-200 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Documents</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Breadcrumbs className="mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Documents</h1>
                <p className="text-sm text-gray-600">
                  {data?.total || 0} document{data?.total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/template-generation')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Documents List */}
        {!data || data.documents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">Generate your first DPDPA compliance document</p>
            <button
              onClick={() => navigate('/template-generation')}
              className="inline-flex items-center px-6 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Document
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.documents.map((doc: GeneratedDocument, index: number) => {
              const StatusIcon = STATUS_ICONS[doc.status] || Edit;
              const statusColor = STATUS_COLORS[doc.status] || 'text-gray-600 bg-gray-50 border-gray-200';

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <h3 
                          className="text-lg font-semibold text-gray-900 mb-2 truncate cursor-pointer hover:text-purple-600 transition-colors"
                          onClick={() => navigate(`/template-generation/editor/${doc.id}`)}
                        >
                          {doc.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(doc.updated_at).toLocaleDateString()}
                          </div>
                          {doc.artifact_name && (
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {doc.artifact_name}
                            </div>
                          )}
                          {doc.artifact_category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {doc.artifact_category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full border ${statusColor}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">{doc.status}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {doc.content.length} characters
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/template-generation/editor/${doc.id}`)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit document"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(doc.id)}
                          disabled={deleting}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete document"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {doc.content.substring(0, 200)}...
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === data.totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Document</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this document? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
