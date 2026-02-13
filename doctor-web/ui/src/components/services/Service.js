import React, { useState } from 'react';
import { useConsultations } from '../../contexts/ConsultationContext';
import { toast } from 'react-toastify';
import Loading from '../common/Loading';
import './Service.css';

const Service = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newConsultation, setNewConsultation] = useState({
    name: '',
    duration: '',
    price: '',
    description: '',
  });

  // Predefined timing options
  const timingOptions = [
    { value: '10 minutes', label: '10 minutes' },
    { value: '15 minutes', label: '15 minutes' },
    { value: '20 minutes', label: '20 minutes' },
    { value: '30 minutes', label: '30 minutes' },
    { value: '45 minutes', label: '45 minutes' },
    { value: '1 hour', label: '1 hour' },
  ];

  const {
    consultations,
    addConsultation,
    removeConsultation,
    updateConsultation,
  } = useConsultations();

  const handleCreateConsultation = () => {
    setShowCreateForm(true);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const handleSaveConsultation = async () => {
    if (
      newConsultation.name &&
      newConsultation.duration &&
      newConsultation.price
    ) {
      try {
        setIsLoading(true);
        // Create new consultation
        const newConsultationItem = {
          name: newConsultation.name,
          duration: newConsultation.duration,
          price: parseInt(newConsultation.price),
          description:
            newConsultation.description || 'Custom consultation type',
        };

        // Add to consultations context (which now saves to Firebase)
        await addConsultation(newConsultationItem);

        // Reset form
        setNewConsultation({
          name: '',
          duration: '',
          price: '',
          description: '',
        });
        setShowCreateForm(false);
        toast.success('Consultation service created successfully!');
      } catch (error) {
        toast.error('Failed to create consultation service. Please try again.');
        console.error('Error creating consultation:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleInputChange = (field, value) => {
    setNewConsultation((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditConsultation = (service) => {
    setEditingService(service);
    setNewConsultation({
      name: service.name,
      duration: service.duration,
      price: service.price.toString(),
      description: service.description,
    });
    setShowEditForm(true);
  };

  const handleUpdateConsultation = async () => {
    if (
      newConsultation.name &&
      newConsultation.duration &&
      newConsultation.price
    ) {
      try {
        setUpdatingId(editingService.id);
        // Update consultation
        const updatedConsultationItem = {
          name: newConsultation.name,
          duration: newConsultation.duration,
          price: parseInt(newConsultation.price),
          description:
            newConsultation.description || 'Custom consultation type',
        };

        // Update consultation
        await updateConsultation(editingService.id, updatedConsultationItem);

        // Reset form and close modal
        setNewConsultation({
          name: '',
          duration: '',
          price: '',
          description: '',
        });
        setEditingService(null);
        setShowEditForm(false);
        toast.success('Consultation service updated successfully!');
      } catch (error) {
        toast.error('Failed to update consultation service. Please try again.');
        console.error('Error updating consultation:', error);
      } finally {
        setUpdatingId(null);
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingService(null);
    setNewConsultation({
      name: '',
      duration: '',
      price: '',
      description: '',
    });
  };

  return (
    <div className="services-container">
      <div className="services-header">
        <h1>Manage Consultation Types</h1>
        <p>Create and manage your consultation offerings for patients</p>
        <button
          className="create-consultation-btn"
          onClick={handleCreateConsultation}
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : '+ Create New Consultation Type'}
        </button>
      </div>

      {isLoading && (
        <Loading type="overlay" text="Loading consultation services..." />
      )}
      {!isLoading && (
        <div className="services-grid">
          {(consultations || []).map((service) => (
            <div key={service.id} className={`service-card`}>
              <div className="service-header">
                <h3>{service.name}</h3>
                <div className="service-type">
                  <span>{service.duration}</span>
                </div>
              </div>

              <div className="service-price">
                <span className="currency">₹</span>
                <span className="amount">{service.price}</span>
              </div>

              <div className="service-description">
                <p>{service.description}</p>
              </div>

              <div className="service-actions">
                <button
                  className="btn btn-primary edit-btn"
                  onClick={() => handleEditConsultation(service)}
                  disabled={
                    isLoading ||
                    deletingId === service.id ||
                    updatingId === service.id
                  }
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    try {
                      setDeletingId(service.id);
                      await removeConsultation(service.id);
                      toast.success('Service deleted successfully');
                    } catch (error) {
                      toast.error('Failed to delete service');
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  disabled={
                    isLoading ||
                    deletingId === service.id ||
                    updatingId === service.id
                  }
                >
                  {deletingId === service.id ? (
                    <Loading type="inline" size="small" text="Deleting..." />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Consultation Modal */}
      {showCreateForm && (
        <div className="booking-modal-overlay">
          <div className="booking-modal">
            <div className="modal-header">
              <h3>Create New Consultation Type</h3>
              <button
                className="close-modal"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="create-form">
                <div className="form-group">
                  <label htmlFor="consultation-name">Consultation Name</label>
                  <input
                    id="consultation-name"
                    type="text"
                    placeholder="e.g., Quick Consultation"
                    value={newConsultation.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="consultation-duration">Duration</label>
                    <select
                      id="consultation-duration"
                      value={newConsultation.duration}
                      onChange={(e) =>
                        handleInputChange('duration', e.target.value)
                      }
                    >
                      <option value="">Select duration</option>
                      {timingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="consultation-price">Price (₹)</label>
                    <input
                      id="consultation-price"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g., 500"
                      value={newConsultation.price}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange('price', value);
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="consultation-description">
                    Description (Optional)
                  </label>
                  <textarea
                    id="consultation-description"
                    placeholder="Brief description of this consultation type"
                    value={newConsultation.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-book-btn"
                  onClick={handleSaveConsultation}
                  disabled={
                    !newConsultation.name ||
                    !newConsultation.duration ||
                    !newConsultation.price ||
                    isLoading
                  }
                >
                  {isLoading ? (
                    <Loading type="inline" size="small" text="Creating..." />
                  ) : (
                    'Create Consultation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Consultation Modal */}
      {showEditForm && (
        <div className="booking-modal-overlay">
          <div className="booking-modal">
            <div className="modal-header">
              <h3>Edit Consultation Type</h3>
              <button className="close-modal" onClick={handleCancelEdit}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="create-form">
                <div className="form-group">
                  <label htmlFor="edit-consultation-name">
                    Consultation Name
                  </label>
                  <input
                    id="edit-consultation-name"
                    type="text"
                    placeholder="e.g., Quick Consultation"
                    value={newConsultation.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-consultation-duration">Duration</label>
                    <select
                      id="edit-consultation-duration"
                      value={newConsultation.duration}
                      onChange={(e) =>
                        handleInputChange('duration', e.target.value)
                      }
                    >
                      <option value="">Select duration</option>
                      {timingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-consultation-price">Price (₹)</label>
                    <input
                      id="edit-consultation-price"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g., 500"
                      value={newConsultation.price}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange('price', value);
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-consultation-description">
                    Description (Optional)
                  </label>
                  <textarea
                    id="edit-consultation-description"
                    placeholder="Brief description of this consultation type"
                    value={newConsultation.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button
                  className="confirm-book-btn"
                  onClick={handleUpdateConsultation}
                  disabled={
                    !newConsultation.name ||
                    !newConsultation.duration ||
                    !newConsultation.price ||
                    updatingId === editingService?.id
                  }
                >
                  {updatingId === editingService?.id ? (
                    <Loading type="inline" size="small" text="Updating..." />
                  ) : (
                    'Update Consultation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Service;
