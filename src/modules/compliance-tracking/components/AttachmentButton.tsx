import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface AttachmentButtonProps {
  checklistItemId: string;
  projectId: string;
  onUploadSuccess: () => void;
}

export const AttachmentButton = ({ checklistItemId, projectId, onUploadSuccess }: AttachmentButtonProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:mime;base64, prefix

        const { uploadAttachment } = await import('../api');
        await uploadAttachment(projectId, {
          checklistItemId,
          fileName: file.name,
          fileData: base64Data,
          fileSize: file.size,
          fileType: file.type,
        });

        onUploadSuccess();
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
      >
        <Upload className="w-4 h-4" />
        {uploading ? 'Uploading...' : 'Attach File'}
      </button>
    </>
  );
};
