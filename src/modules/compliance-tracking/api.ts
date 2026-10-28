import apiClient from '../risk-assessment/api';

// Reuse existing checklist APIs
export { 
  getProjectChecklist,
  saveProjectChecklist 
} from '../risk-assessment/api';

/**
 * Check if a project is eligible for compliance tracking
 * (i.e., has completed template generation)
 */
export const checkComplianceEligibility = async (projectId: string) => {
  const response = await apiClient.get(`/projects/${projectId}/compliance-eligibility`);
  return response.data;
};

/**
 * Upload an attachment for a checklist item
 */
export const uploadAttachment = async (
  projectId: string,
  data: {
    checklistItemId: string;
    fileName: string;
    fileData: string;
    fileSize: number;
    fileType: string;
  }
) => {
  const response = await apiClient.post(
    `/projects/${projectId}/compliance/attachments`,
    data
  );
  return response.data;
};

/**
 * Get attachments for a specific checklist item
 */
export const getAttachments = async (projectId: string, itemId: string) => {
  const response = await apiClient.get(
    `/projects/${projectId}/compliance/attachments`,
    {
      params: { itemId }
    }
  );
  return response.data;
};

/**
 * Delete an attachment
 */
export const deleteAttachment = async (projectId: string, attachmentId: string) => {
  await apiClient.delete(
    `/projects/${projectId}/compliance/attachments/${attachmentId}`
  );
};
