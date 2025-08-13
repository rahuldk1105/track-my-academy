import React, { useState, useEffect } from 'react';

const PlayerModal = ({ isOpen, onClose, onSubmit, player = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    age: '',
    gender: '',
    sport: '',
    position: '',
    registration_number: '',
    height: '',
    weight: '',
    training_days: [],
    training_batch: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [sportConfig, setSportConfig] = useState({
    sports: {},
    performance_categories: {},
    individual_sports: [],
    team_sports: []
  });

  // Gender options
  const genderOptions = ['Male', 'Female', 'Other'];

  // Sports options (will be loaded from API)
  const [sportsOptions, setSportsOptions] = useState([
    'Football', 'Cricket', 'Basketball', 'Tennis', 'Swimming', 
    'Badminton', 'Athletics', 'Hockey', 'Volleyball', 'Other'
  ]);

  // Load sport configuration on component mount
  useEffect(() => {
    const loadSportConfig = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/sports/config`);
        if (response.ok) {
          const config = await response.json();
          setSportConfig(config);
          setSportsOptions(Object.keys(config.sports));
        }
      } catch (error) {
        console.error('Error loading sport configuration:', error);
      }
    };

    if (isOpen) {
      loadSportConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && player) {
        // Populate form with existing player data
        setFormData({
          first_name: player.first_name || '',
          last_name: player.last_name || '',
          email: player.email || '',
          phone: player.phone || '',
          date_of_birth: player.date_of_birth || '',
          age: player.age || '',
          gender: player.gender || '',
          sport: player.sport || '',
          position: player.position || '',
          registration_number: player.registration_number || '',
          height: player.height || '',
          weight: player.weight || '',
          training_days: player.training_days || [],
          training_batch: player.training_batch || '',
          emergency_contact_name: player.emergency_contact_name || '',  
          emergency_contact_phone: player.emergency_contact_phone || '',
          medical_notes: player.medical_notes || '',
          status: player.status || 'active'
        });
      } else {
        // Reset form for new player
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          date_of_birth: '',
          age: '',
          gender: '',
          sport: '',
          position: '',
          registration_number: '',
          height: '',
          weight: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          medical_notes: '',
          status: 'active'
        });
      }
    }
  }, [isOpen, isEditing, player]);

  // Auto-calculate age when date of birth changes
  useEffect(() => {
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age >= 0 && age <= 100) {
        setFormData(prev => ({ ...prev, age: age }));
      }
    }
  }, [formData.date_of_birth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset position when sport changes
    if (name === 'sport') {
      setFormData(prev => ({
        ...prev,
        position: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert age to number if provided
      const submitData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
      };

      if (isEditing && player) {
        await onSubmit(player.id, submitData);
      } else {
        await onSubmit(submitData);
      }
    } catch (error) {
      console.error('Error submitting player form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get position options for selected sport
  const getPositionOptions = () => {
    if (!formData.sport || !sportConfig.sports[formData.sport]) {
      return [];
    }
    return sportConfig.sports[formData.sport];
  };

  // Check if selected sport is individual
  const isIndividualSport = () => {
    return sportConfig.individual_sports.includes(formData.sport);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              {isEditing ? 'Edit Player' : 'Add New Player'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-300 border-b border-gray-700 pb-2">
                Basic Information
              </h3>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Age {formData.date_of_birth && <span className="text-sm text-blue-400">(Auto-calculated)</span>}
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="5"
                  max="50"
                  readOnly={!!formData.date_of_birth}
                  className={`w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formData.date_of_birth ? 'bg-gray-700 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  {genderOptions.map(gender => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sports Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-300 border-b border-gray-700 pb-2">
                Sports Information
              </h3>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Sport *
                </label>
                <select
                  name="sport"
                  value={formData.sport}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Sport</option>
                  {sportsOptions.map(sport => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>

              {formData.sport && !isIndividualSport() && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Position
                  </label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Position</option>
                    {getPositionOptions().map(position => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.sport && isIndividualSport() && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-sm text-blue-300">
                    📌 <strong>{formData.sport}</strong> is an individual sport. Position selection is not required.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  placeholder="e.g., REG001, 2024-TN-001"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Height
                </label>
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g., 5'10, 175cm"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Weight
                </label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g., 70kg, 154lbs"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-300 border-b border-gray-700 pb-2">
                Emergency Contact
              </h3>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-300 border-b border-gray-700 pb-2">
                Medical Information
              </h3>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Medical Notes
                </label>
                <textarea
                  name="medical_notes"
                  value={formData.medical_notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Any medical conditions, allergies, or special notes..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Player' : 'Create Player')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerModal;