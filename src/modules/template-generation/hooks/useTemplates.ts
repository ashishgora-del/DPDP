import { useState, useEffect } from 'react';
import * as api from '../api';
import type {
  Artifact,
  GeneratedDocument,
  GenerateFromTemplateRequest,
  GenerateCustomRequest,
  UpdateDocumentRequest,
  PaginatedDocumentsResponse,
} from '../api';

// =============================================================================
// useArtifacts - List available templates
// =============================================================================
export function useArtifacts(category?: string, riskTier?: string, enabled = true) {
  const [data, setData] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const artifacts = await api.listArtifacts(category, riskTier);
      setData(artifacts);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    fetchArtifacts();
  }, [category, riskTier, enabled]);

  return { data, loading, error, refetch: fetchArtifacts };
}

// =============================================================================
// useArtifact - Get single artifact
// =============================================================================
export function useArtifact(id: string) {
  const [data, setData] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifact = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const artifact = await api.getArtifact(id);
      setData(artifact);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch template');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifact();
  }, [id]);

  return { data, loading, error, refetch: fetchArtifact };
}

// =============================================================================
// useGenerateFromTemplate - Generate document from template
// =============================================================================
export function useGenerateFromTemplate() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDocument | null>(null);

  const generate = async (request: GenerateFromTemplateRequest) => {
    try {
      setGenerating(true);
      setError(null);
      const document = await api.generateFromTemplate(request);
      setResult(document);
      return document;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to generate document';
      setError(message);
      throw new Error(message);
    } finally {
      setGenerating(false);
    }
  };

  return { generate, generating, error, result };
}

// =============================================================================
// useGenerateCustom - Generate custom document with AI
// =============================================================================
export function useGenerateCustom() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDocument | null>(null);

  const generate = async (request: GenerateCustomRequest) => {
    try {
      setGenerating(true);
      setError(null);
      const document = await api.generateCustomDocument(request);
      setResult(document);
      return document;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to generate document';
      setError(message);
      throw new Error(message);
    } finally {
      setGenerating(false);
    }
  };

  return { generate, generating, error, result };
}

// =============================================================================
// useDocuments - Get paginated documents list
// =============================================================================
export function useDocuments(page: number = 1, limit: number = 20) {
  const [data, setData] = useState<PaginatedDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getUserDocuments(page, limit);
      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, limit]);

  return { data, loading, error, refetch: fetchDocuments };
}

// =============================================================================
// useDocument - Get single document
// =============================================================================
export function useDocument(id: string) {
  const [data, setData] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const document = await api.getDocument(id);
      setData(document);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  return { data, loading, error, refetch: fetchDocument };
}

// =============================================================================
// useUpdateDocument - Update document
// =============================================================================
export function useUpdateDocument() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, data: UpdateDocumentRequest) => {
    try {
      setUpdating(true);
      setError(null);
      const document = await api.updateDocument(id, data);
      return document;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update document';
      setError(message);
      throw new Error(message);
    } finally {
      setUpdating(false);
    }
  };

  return { update, updating, error };
}

// =============================================================================
// useDeleteDocument - Delete document
// =============================================================================
export function useDeleteDocument() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteById = async (id: string) => {
    try {
      setDeleting(true);
      setError(null);
      await api.deleteDocument(id);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to delete document';
      setError(message);
      throw new Error(message);
    } finally {
      setDeleting(false);
    }
  };

  return { deleteById, deleting, error };
}
