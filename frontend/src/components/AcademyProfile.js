import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  User, MapPin, Globe, Phone, Mail, Calendar, 
  Upload, Camera, Edit, Save, Award, Star
} from 'lucide-react';

const AcademyProfile = () => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    website: '',
    theme_color: '#0ea5e9',
    social_media: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: ''
    },
    facility_address: '',
    facility_amenities: [],
    contact_phone: '',
    contact_email: '',
    established_year: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const amenityOptions = ['Gym', 'Pool', 'Field', 'Locker Rooms', 'Parking', 'Cafeteria', 'Medical Room', 'Equipment Storage'];
  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: '📘' },
    { key: 'twitter', label: 'Twitter', icon: '🐦' },
    { key: 'instagram', label: 'Instagram', icon: '📷' },
    { key: 'youtube', label: 'YouTube', icon: '📺' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        setFormData(prevData => ({
          ...prevData,
          description: data.description || '',
          website: data.website || '',
          theme_color: data.theme_color || '#0ea5e9',
          social_media: {
            facebook: data.social_media?.facebook || '',
            twitter: data.social_media?.twitter || '',
            instagram: data.social_media?.instagram || '',
            youtube: data.social_media?.youtube || ''
          },
          facility_address: data.facility_address || '',
          facility_amenities: data.facility_amenities || [],
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          established_year: data.established_year || ''
        }));

        if (data.logo_url) {
          setLogoPreview(`${API_BASE_URL}${data.logo_url}`);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prevData => ({
        ...prevData,
        [parent]: {
          ...prevData[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [field]: value
      }));
    }
  };

  const handleArrayToggle = (field, item) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: prevData[field].includes(item) 
        ? prevData[field].filter(i => i !== item)
        : [...prevData[field], item]
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;

    try {
      const formData = new FormData();
      formData.append('file', logoFile);

      const response = await fetch(`${API_BASE_URL}/api/academy/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
        setLogoPreview(`${API_BASE_URL}${result.logo_url}`);
        setLogoFile(null);
        return result.logo_url;
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to upload logo' });
        return null;
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Failed to upload logo' });
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      if (logoFile) {
        await uploadLogo();
      }

      const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to save profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
            isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'
          }`}></div>
          <p className={`${isLight ? 'text-gray-600' : 'text-cyan-400'}`}>Loading academy profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isLight ? 'bg-gray-50' : 'bg-black'} min-h-screen`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-3`}>
            <User className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            Academy Profile
          </h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
            Manage your academy's public profile and branding
          </p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                isLight 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
              }`}
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  isLight 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isLight 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50'
                } disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' 
            ? isLight ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-green-500/10 border border-green-500/30 text-green-400'
            : isLight ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <div className={`lg:col-span-1 ${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
        } rounded-2xl p-6 shadow-sm`}>
          <div className="text-center">
            <div className="relative inline-block mb-4">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Academy Logo" 
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-gray-200 shadow-lg"
                />
              ) : (
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${
                  isLight ? 'bg-gray-100' : 'bg-gray-800'
                } border-4 border-gray-200 shadow-lg`}>
                  <Award className={`w-10 h-10 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
              )}
              {isEditing && (
                <label className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  isLight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30'
                }`}>
                  <Camera className={`w-4 h-4 ${isLight ? 'text-white' : 'text-blue-400'}`} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <h3 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>
              {settings?.academy_name || 'Academy Name'}
            </h3>
            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-4`}>
              {formData.description || 'Add a description to tell people about your academy...'}
            </p>
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{
                backgroundColor: isLight ? `${formData.theme_color}20` : `${formData.theme_color}30`,
                color: formData.theme_color
              }}>
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Academy Theme</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className={`lg:col-span-2 ${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
        } rounded-2xl p-6 shadow-sm space-y-6`}>
          
          {/* Basic Information */}
          <div>
            <h4 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  Academy Description
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your academy's mission and values"
                    rows="3"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight 
                        ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500' 
                        : 'border-cyan-500/30 bg-gray-800 text-white focus:border-cyan-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <p className={`px-4 py-3 rounded-xl ${
                    isLight ? 'bg-gray-50 text-gray-900' : 'bg-gray-800 text-white'
                  }`}>
                    {formData.description || 'No description provided'}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  Website URL
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://youracademy.com"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight 
                        ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500' 
                        : 'border-cyan-500/30 bg-gray-800 text-white focus:border-cyan-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl ${
                    isLight ? 'bg-gray-50' : 'bg-gray-800'
                  }`}>
                    {formData.website ? (
                      <a 
                        href={formData.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'} transition-colors duration-200`}
                      >
                        <Globe className="w-4 h-4" />
                        {formData.website}
                      </a>
                    ) : (
                      <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>No website provided</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  Theme Color
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.theme_color}
                      onChange={(e) => handleInputChange('theme_color', e.target.value)}
                      className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.theme_color}
                      onChange={(e) => handleInputChange('theme_color', e.target.value)}
                      className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isLight 
                          ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500' 
                          : 'border-cyan-500/30 bg-gray-800 text-white focus:border-cyan-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl border border-gray-300"
                      style={{ backgroundColor: formData.theme_color }}
                    ></div>
                    <span className={`px-4 py-3 rounded-xl font-mono ${
                      isLight ? 'bg-gray-50 text-gray-900' : 'bg-gray-800 text-white'
                    }`}>
                      {formData.theme_color}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  Established Year
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.established_year}
                    onChange={(e) => handleInputChange('established_year', e.target.value)}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight 
                        ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500' 
                        : 'border-cyan-500/30 bg-gray-800 text-white focus:border-cyan-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl flex items-center gap-2 ${
                    isLight ? 'bg-gray-50' : 'bg-gray-800'
                  }`}>
                    <Calendar className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={isLight ? 'text-gray-900' : 'text-white'}>
                      {formData.established_year || 'Not specified'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
              Social Media
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPlatforms.map((platform) => (
                <div key={platform.key}>
                  <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    {platform.icon} {platform.label}
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.social_media[platform.key]}
                      onChange={(e) => handleInputChange(`social_media.${platform.key}`, e.target.value)}
                      placeholder={`https://${platform.key}.com/youracademy`}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isLight 
                          ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500' 
                          : 'border-cyan-500/30 bg-gray-800 text-white focus:border-cyan-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  ) : (
                    <div className={`px-4 py-3 rounded-xl ${
                      isLight ? 'bg-gray-50' : 'bg-gray-800'
                    }`}>
                      {formData.social_media[platform.key] ? (
                        <a 
                          href={formData.social_media[platform.key]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'} transition-colors duration-200`}
                        >
                          {formData.social_media[platform.key]}
                        </a>
                      ) : (
                        <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Not provided</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Facility Information */}
          <div>
            <h4 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
              Facility Information
            </h4>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Facility Address
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.facility_address}
                    onChange={(e) => handleInputChange('facility_address', e.target.value)}
                    placeholder="123 Sports Complex Drive, Athletic City, AC 12345"
                    rows="2"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight 
                        ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500' 
                        : 'border-cyan-500/30 bg-gray-800 text-white focus:border-cyan-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <p className={`px-4 py-3 rounded-xl ${
                    isLight ? 'bg-gray-50 text-gray-900' : 'bg-gray-800 text-white'
                  }`}>
                    {formData.facility_address || 'No address provided'}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  Available Amenities
                </label>
                {isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenityOptions.map((amenity) => (
                      <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.facility_amenities.includes(amenity)}
                          onChange={() => handleArrayToggle('facility_amenities', amenity)}
                          className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                            isLight
                              ? 'text-blue-600 focus:ring-blue-500 border-gray-300'
                              : 'text-blue-400 focus:ring-blue-400 bg-gray-800 border-cyan-500/30'
                          }`}
                        />
                        <span className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{amenity}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.facility_amenities.length > 0 ? formData.facility_amenities.map((amenity) => (
                      <span key={amenity} className={`px-3 py-1 rounded-full text-sm ${
                        isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {amenity}
                      </span>
                    )) : (
                      <span className={`px-4 py-3 rounded-xl ${
                        isLight ? 'bg-gray-50 text-gray-500' : 'bg-gray-800 text-gray-400'
                      }`}>
                        No amenities listed
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyProfile;