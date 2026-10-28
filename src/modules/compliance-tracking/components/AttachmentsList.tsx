import { useState, useEffect } from 'react';
import { FileText, Trash2, Loader2 } from 'lucide-react';
import { getAttachments, deleteAttachment } from '../api';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

interface AttachmentsListProps {
  projectId: string;
  checklistItemId: string;
  refreshTrigger: number;
}

export const AttachmentsList = ({ projectId, checklistItemId, refreshTrigger }: AttachmentsListProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadAttachments();
  }, [projectId, checklistItemId, refreshTrigger]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await getAttachments(projectId, checklistItemId);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to load attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return;

    try {
      setDeleting(attachmentId);
      await deleteAttachment(projectId, attachmentId);
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading attachments...
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No attachments yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="flex items-center justify-between gap-3 p-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">
                {att.fileName}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(att.fileSize)} · {formatDate(att.uploadedAt)}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleDelete(att.id)}
            disabled={deleting === att.id}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Delete attachment"
          >
            {deleting === att.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
};
