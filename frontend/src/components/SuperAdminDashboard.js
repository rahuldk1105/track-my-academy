import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS, createAuthHeaders, handleApiError } from '../config/api';

// API Service for Super Admin
class SuperAdminApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAllAcademies() {
    const response = await this.api.get('/api/super-admin/academies');
    return response.data;
  }

  async createAcademy(academyData) {
    const response = await this.api.post('/api/super-admin/academies', academyData);
    return response.data;
  }

  async getAcademy(academyId) {
    const response = await this.api.get(`/api/super-admin/academies/${academyId}`);
    return response.data;
  }

  async updateAcademy(academyId, academyData) {
    const response = await this.api.put(`/api/super-admin/academies/${academyId}`, academyData);
    return response.data;
  }

  async deleteAcademy(academyId) {
    const response = await this.api.delete(`/api/super-admin/academies/${academyId}`);
    return response.data;
  }

  async uploadLogo(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post('/api/upload-academy-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

const superAdminApiService = new SuperAdminApiService();

// Academy Creation/Edit Modal
const AcademyModal = ({ isOpen, onClose, onSuccess, academy = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    academy_name: '',
    academy_location: '',
    owner_name: '',
    admin_contact: '',
    admin_email: '',
    student_limit: '',
    coach_limit: '',
    subscription_start_date: '',
    subscription_expiry_date: '',
    branches: [],
    academy_logo_url: ''
  });
  const [newBranch, setNewBranch] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (academy && isEditing) {
      setFormData({
        academy_name: academy.academy_name || '',
        academy_location: academy.academy_location || '',
        owner_name: academy.owner_name || '',
        admin_contact: academy.admin_contact || '',
        admin_email: academy.admin_email || '',
        student_limit: academy.student_limit?.toString() || '',
        coach_limit: academy.coach_limit?.toString() || '',
        subscription_start_date: academy.subscription_start_date ? 
          new Date(academy.subscription_start_date).toISOString().split('T')[0] : '',
        subscription_expiry_date: academy.subscription_expiry_date ? 
          new Date(academy.subscription_expiry_date).toISOString().split('T')[0] : '',
        branches: academy.branches || [],
        academy_logo_url: academy.academy_logo_url || ''
      });
      setLogoPreview(academy.academy_logo_url || '');
    }
  }, [academy, isEditing]);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      
      // Upload logo immediately
      setUploadingLogo(true);
      try {
        const response = await superAdminApiService.uploadLogo(file);
        setFormData({ ...formData, academy_logo_url: API_CONFIG.BASE_URL + response.file_url });
      } catch (error) {
        console.error('Logo upload failed:', error);
        alert('Logo upload failed. Please try again.');
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const handleAddBranch = () => {
    if (newBranch.trim() && !formData.branches.includes(newBranch.trim())) {
      setFormData({
        ...formData,
        branches: [...formData.branches, newBranch.trim()]
      });
      setNewBranch('');
    }
  };

  const handleRemoveBranch = (branchToRemove) => {
    setFormData({
      ...formData,
      branches: formData.branches.filter(branch => branch !== branchToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const academyData = {
        ...formData,
        student_limit: parseInt(formData.student_limit),
        coach_limit: parseInt(formData.coach_limit),
        subscription_start_date: new Date(formData.subscription_start_date).toISOString(),
        subscription_expiry_date: new Date(formData.subscription_expiry_date).toISOString(),
      };

      if (isEditing) {
        await superAdminApiService.updateAcademy(academy.academy_id, academyData);
      } else {
        await superAdminApiService.createAcademy(academyData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving academy:', error);
      alert('Failed to save academy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Academy' : 'Create New Academy'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Academy Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academy Logo
                </label>
                <div className="flex items-center space-x-4">
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoChange}
                    className="input-field"
                    disabled={uploadingLogo}
                  />
                  {uploadingLogo && <span className="text-sm text-blue-600">Uploading...</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.academy_name}
                  onChange={(e) => setFormData({...formData, academy_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.academy_location}
                  onChange={(e) => setFormData({...formData, academy_location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  className="input-field"
                  value={formData.admin_contact}
                  onChange={(e) => setFormData({...formData, admin_contact: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={formData.admin_email}
                  onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Limit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    value={formData.student_limit}
                    onChange={(e) => setFormData({...formData, student_limit: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coach Limit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    value={formData.coach_limit}
                    onChange={(e) => setFormData({...formData, coach_limit: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.subscription_start_date}
                  onChange={(e) => setFormData({...formData, subscription_start_date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.subscription_expiry_date}
                  onChange={(e) => setFormData({...formData, subscription_expiry_date: e.target.value})}
                />
              </div>

              {/* Branches */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branches
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter branch name"
                    className="input-field flex-1"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBranch())}
                  />
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.branches.map((branch, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {branch}
                      <button
                        type="button"
                        onClick={() => handleRemoveBranch(branch)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingLogo}
              className="btn-primary"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Academy' : 'Create Academy')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Academy Table Component
const AcademyTable = ({ academies, onEdit, onDelete, onSearch, searchTerm }) => {
  const [sortField, setSortField] = useState('academy_name');
  const [sortDirection, setSortDirection] = useState('asc');

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      expiring_soon: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800'
    };

    const labels = {
      active: '✅ Active',
      expiring_soon: '⚠️ Expiring Soon',
      expired: '❌ Expired'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || badges.active}`}>
        {labels[status] || labels.active}
      </span>
    );
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAcademies = [...academies].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (sortDirection === 'asc') {
      return aValue.toString().localeCompare(bValue.toString());
    } else {
      return bValue.toString().localeCompare(aValue.toString());
    }
  });

  const filteredAcademies = sortedAcademies.filter(academy =>
    academy.academy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    academy.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    academy.admin_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left hover:text-blue-600 transition-colors"
    >
      <span>{children}</span>
      {sortField === field && (
        <svg
          className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="card">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search academies by name, owner, or email..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Logo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="academy_name">Academy Name</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="owner_name">Owner Name</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Limits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="subscription_expiry_date">Expiry Date</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAcademies.map((academy) => (
              <tr key={academy.academy_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {academy.academy_logo_url ? (
                    <img
                      src={academy.academy_logo_url}
                      alt={academy.academy_name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-sm text-gray-500">N/A</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{academy.academy_name}</div>
                    <div className="text-sm text-gray-500">{academy.academy_location}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {academy.owner_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {academy.admin_contact}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {academy.admin_email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>S: {academy.student_limit}</div>
                  <div>C: {academy.coach_limit}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(academy.subscription_expiry_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(academy.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(academy)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit Academy"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(academy)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete Academy"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAcademies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No academies found</p>
            <p className="text-gray-400">Create your first academy to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Super Admin Dashboard Component
const SuperAdminDashboard = ({ user }) => {
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAcademies();
  }, []);

  const loadAcademies = async () => {
    try {
      const academiesData = await superAdminApiService.getAllAcademies();
      setAcademies(academiesData);
    } catch (error) {
      console.error('Error loading academies:', error);
      alert('Failed to load academies. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    loadAcademies();
    setShowCreateModal(false);
  };

  const handleEditSuccess = () => {
    loadAcademies();
    setEditingAcademy(null);
  };

  const handleEdit = (academy) => {
    setEditingAcademy(academy);
  };

  const handleDelete = async (academy) => {
    if (window.confirm(`Are you sure you want to delete "${academy.academy_name}"? This will also delete all related data.`)) {
      try {
        await superAdminApiService.deleteAcademy(academy.academy_id);
        loadAcademies();
      } catch (error) {
        console.error('Error deleting academy:', error);
        alert('Failed to delete academy. Please try again.');
      }
    }
  };

  const getStatusCounts = () => {
    const counts = {
      total: academies.length,
      active: academies.filter(a => a.status === 'active').length,
      expiring: academies.filter(a => a.status === 'expiring_soon').length,
      expired: academies.filter(a => a.status === 'expired').length
    };
    return counts;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600">Manage all academies across the platform</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Academy</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{statusCounts.total}</h3>
              <p className="text-sm text-gray-600">Total Academies</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{statusCounts.active}</h3>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{statusCounts.expiring}</h3>
              <p className="text-sm text-gray-600">Expiring Soon</p>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{statusCounts.expired}</h3>
              <p className="text-sm text-gray-600">Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Academy Table */}
      <AcademyTable
        academies={academies}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
      />

      {/* Create Academy Modal */}
      <AcademyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Academy Modal */}
      <AcademyModal
        isOpen={!!editingAcademy}
        onClose={() => setEditingAcademy(null)}
        onSuccess={handleEditSuccess}
        academy={editingAcademy}
        isEditing={true}
      />
    </div>
  );
};

export default SuperAdminDashboard;