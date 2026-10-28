import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LearningPath, Domain, Course } from '../types';
import { adminPathsApi, adminDomainsApi } from '../lib/api';
import AdminLayout from '../components/layout/AdminLayout';

export default function AdminPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domainId: 0,
    courseIds: [] as number[],
    prerequisites: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pathsResponse, domainsResponse] = await Promise.all([
        adminPathsApi.getAllPaths(),
        adminDomainsApi.getAllDomains()
      ]);
      setPaths(Array.isArray(pathsResponse.data) ? pathsResponse.data : (pathsResponse.data as any).data || []);
      setDomains(Array.isArray(domainsResponse.data) ? domainsResponse.data : (domainsResponse.data as any).data || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPath) {
        await adminPathsApi.updatePath(editingPath.id, formData);
      } else {
        await adminPathsApi.createPath(formData);
      }
      await loadData();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save learning path');
    }
  };

  const handleEdit = (path: LearningPath) => {
    setEditingPath(path);
    setFormData({
      name: path.name,
      description: path.description || '',
      domainId: path.domainId,
      courseIds: path.courses?.map((c: Course) => parseInt(c.id)) || [],
      prerequisites: path.prerequisites || ''
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this learning path?')) {
      return;
    }
    try {
      await adminPathsApi.deletePath(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete learning path');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', domainId: 0, courseIds: [], prerequisites: '' });
    setIsCreating(false);
    setEditingPath(null);
  };

  const filteredPaths = paths.filter(path => {
    const matchesSearch = path.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      path.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = domainFilter === 'all' || path.domainId === parseInt(domainFilter);
    return matchesSearch && matchesDomain;
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Loading learning paths...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Paths</h1>
        <p className="text-gray-600">Manage structured learning paths and course sequences</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search paths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Domains</option>
          {domains.map(domain => (
            <option key={domain.id} value={domain.id}>{domain.name}</option>
          ))}
        </select>
        <button
          onClick={() => setIsCreating(true)}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition whitespace-nowrap"
        >
          + Create Path
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {editingPath ? 'Edit Learning Path' : 'Create New Learning Path'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Path Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain *
                </label>
                <select
                  required
                  value={formData.domainId}
                  onChange={(e) => setFormData({ ...formData, domainId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Select a domain</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>{domain.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prerequisites
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Basic networking knowledge, familiarity with command line"
                value={formData.prerequisites}
                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingPath ? 'Update Path' : 'Create Path'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPaths.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchTerm || domainFilter !== 'all' ? 'No paths match your filters' : 'No learning paths created yet'}
          </div>
        ) : (
          filteredPaths.map((path) => (
            <div key={path.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{path.name}</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {path.description || 'No description provided'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">Domain:</span>
                    <span className="text-gray-900 font-medium">
                      {domains.find(d => d.id === path.domainId)?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">Courses:</span>
                    <span className="text-gray-900 font-medium">
                      {path._count?.courses || 0} courses
                    </span>
                  </div>
                  {path.prerequisites && (
                    <div className="text-sm">
                      <span className="text-gray-500">Prerequisites:</span>
                      <p className="text-gray-700 mt-1 text-xs line-clamp-2">{path.prerequisites}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(path)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(path.id)}
                    className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 text-sm text-gray-600">
        Showing {filteredPaths.length} of {paths.length} learning paths
      </div>
      </div>
    </AdminLayout>
  );
}
