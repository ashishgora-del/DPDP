import { useState, useEffect } from 'react';
import {
  AssessmentDetail,
  AssessmentResponse,
  PaginatedAssessmentsResponse,
  ProjectWithProgress,
  getAssessment,
  getUserAssessments,
  submitAssessment,
  deleteAssessment,
  getProjects,
  createProject,
  deleteProject,
  SubmitAssessmentRequest,
} from '../api';

// =============================================================================
// useAssessment - Fetch single assessment
// =============================================================================

interface UseAssessmentResult {
  assessment: AssessmentDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAssessment = (id: string | null): UseAssessmentResult => {
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getAssessment(id);
      setAssessment(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assessment');
      console.error('Error fetching assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  return {
    assessment,
    loading,
    error,
    refetch: fetchAssessment,
  };
};

// =============================================================================
// useAssessments - Fetch user's assessments with pagination
// =============================================================================

interface UseAssessmentsResult {
  assessments: AssessmentResponse[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchPage: (page: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAssessments = (
  initialPage: number = 1,
  limit: number = 20
): UseAssessmentsResult => {
  const [data, setData] = useState<PaginatedAssessmentsResponse>({
    total: 0,
    page: initialPage,
    limit,
    totalPages: 0,
    assessments: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = async (page: number = initialPage) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getUserAssessments(page, limit);
      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assessments');
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments(initialPage);
  }, []);

  return {
    assessments: data.assessments,
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
    loading,
    error,
    fetchPage: fetchAssessments,
    refetch: () => fetchAssessments(data.page),
  };
};

// =============================================================================
// useSubmitAssessment - Submit new assessment
// =============================================================================

interface UseSubmitAssessmentResult {
  submit: (data: SubmitAssessmentRequest) => Promise<AssessmentResponse>;
  submitting: boolean;
  error: string | null;
  result: AssessmentResponse | null;
}

export const useSubmitAssessment = (): UseSubmitAssessmentResult => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResponse | null>(null);

  const submit = async (
    data: SubmitAssessmentRequest
  ): Promise<AssessmentResponse> => {
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await submitAssessment(data);
      setResult(response);
      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to submit assessment';
      setError(errorMessage);
      // Preserve the original error object so we can check status codes
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submit,
    submitting,
    error,
    result,
  };
};

// =============================================================================
// useDeleteAssessment - Delete assessment
// =============================================================================

interface UseDeleteAssessmentResult {
  deleteById: (id: string) => Promise<void>;
  deleting: boolean;
  error: string | null;
}

export const useDeleteAssessment = (): UseDeleteAssessmentResult => {
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteById = async (id: string): Promise<void> => {
    setDeleting(true);
    setError(null);

    try {
      await deleteAssessment(id);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to delete assessment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleteById,
    deleting,
    error,
  };
};

// =============================================================================
// useProjects - Fetch all projects with progress for current user
// =============================================================================

interface UseProjectsResult {
  projects: ProjectWithProgress[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (name: string) => Promise<ProjectWithProgress>;
  remove: (id: string) => Promise<void>;
}

export const useProjects = (): UseProjectsResult => {
  const [projects, setProjects] = useState<ProjectWithProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    // Clear existing projects first to ensure fresh data
    setProjects([]);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
      setProjects([]); // Clear on error too
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const create = async (name: string): Promise<ProjectWithProgress> => {
    const p = await createProject(name);
    // createProject returns ProjectResponse; add progress defaults
    const withProgress: ProjectWithProgress = {
      ...p,
      latestAssessmentId: null,
      riskTier: null,
      templatesGenerated: 0,
      lastActivity: p.updatedAt,
    };
    setProjects(prev => [withProgress, ...prev]);
    return withProgress;
  };

  const remove = async (id: string): Promise<void> => {
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return { projects, loading, error, refetch: fetchProjects, create, remove };
};
