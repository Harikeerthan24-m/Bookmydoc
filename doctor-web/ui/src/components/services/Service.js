import React, { useState } from 'react';
import { useConsultations } from '../../contexts/ConsultationContext';
import { toast } from 'react-toastify';
import Loading from '../common/Loading';
import './Service.css';

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 9h6M9 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const timingOptions = [
  { value: '10 minutes', label: '10 minutes' },
  { value: '15 minutes', label: '15 minutes' },
  { value: '20 minutes', label: '20 minutes' },
  { value: '30 minutes', label: '30 minutes' },
  { value: '45 minutes', label: '45 minutes' },
  { value: '1 hour', label: '1 hour' },
];

const emptyForm = { name: '', duration: '', price: '', description: '' };

const ConsultationForm = ({ values, onChange }) => (
  <div className="svc-form">
    <div className="svc-form-group">
      <label>Service Name <span className="svc-required">*</span></label>
      <input
        type="text"
        placeholder="e.g., Quick Consultation"
        value={values.name}
        onChange={(e) => onChange('name', e.target.value)}
      />
    </div>
    <div className="svc-form-row">
      <div className="svc-form-group">
        <label>Duration <span className="svc-required">*</span></label>
        <select
          value={values.duration}
          onChange={(e) => onChange('duration', e.target.value)}
        >
          <option value="">Select duration</option>
          {timingOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="svc-form-group">
        <label>Price (₹) <span className="svc-required">*</span></label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="e.g., 500"
          value={values.price}
          onChange={(e) => onChange('price', e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>
    </div>
    <div className="svc-form-group">
      <label>Description <span className="svc-optional">(optional)</span></label>
      <textarea
        placeholder="Brief description of this consultation type"
        value={values.description}
        onChange={(e) => onChange('description', e.target.value)}
        rows="3"
      />
    </div>
  </div>
);

const Service = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { consultations, addConsultation, removeConsultation, updateConsultation } =
    useConsultations();

  const handleInputChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formValues.name && formValues.duration && formValues.price;

  const handleSave = async () => {
    if (!isFormValid) return toast.error('Please fill in all required fields');
    try {
      setIsLoading(true);
      await addConsultation({
        name: formValues.name,
        duration: formValues.duration,
        price: parseInt(formValues.price),
        description: formValues.description || 'Custom consultation type',
      });
      setFormValues(emptyForm);
      setShowCreateForm(false);
      toast.success('Consultation service created successfully!');
    } catch {
      toast.error('Failed to create consultation service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormValues({
      name: service.name,
      duration: service.duration,
      price: service.price.toString(),
      description: service.description,
    });
    setShowEditForm(true);
  };

  const handleUpdate = async () => {
    if (!isFormValid) return toast.error('Please fill in all required fields');
    try {
      setUpdatingId(editingService.id);
      await updateConsultation(editingService.id, {
        name: formValues.name,
        duration: formValues.duration,
        price: parseInt(formValues.price),
        description: formValues.description || 'Custom consultation type',
      });
      setFormValues(emptyForm);
      setEditingService(null);
      setShowEditForm(false);
      toast.success('Consultation service updated successfully!');
    } catch {
      toast.error('Failed to update consultation service. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingService(null);
    setFormValues(emptyForm);
  };

  const handleDelete = async (service) => {
    try {
      setDeletingId(service.id);
      await removeConsultation(service.id);
      toast.success('Service deleted successfully');
    } catch {
      toast.error('Failed to delete service');
    } finally {
      setDeletingId(null);
    }
  };

  const isBusy = (id) =>
    isLoading || deletingId === id || updatingId === id;

  return (
    <div className="svc-page">
      {isLoading && <Loading type="overlay" text="Saving..." />}

      {/* ── Header ── */}
      <div className="svc-header">
        <div>
          <p className="svc-eyebrow">Consultation Services</p>
          <h1 className="svc-title">Manage Services</h1>
          <p className="svc-subtitle">
            Define the consultation types patients can book with you
          </p>
        </div>
        <button
          className="svc-new-btn"
          onClick={() => { setFormValues(emptyForm); setShowCreateForm(true); }}
          disabled={isLoading}
        >
          <PlusIcon />
          New Service
        </button>
      </div>

      {/* ── Cards grid ── */}
      {(consultations || []).length === 0 ? (
        <div className="svc-empty">
          <div className="svc-empty-icon">
            <EmptyIcon />
          </div>
          <h3>No services yet</h3>
          <p>Create your first consultation type so patients can start booking.</p>
          <button
            className="svc-new-btn"
            onClick={() => { setFormValues(emptyForm); setShowCreateForm(true); }}
          >
            <PlusIcon />
            Create First Service
          </button>
        </div>
      ) : (
        <div className="svc-grid">
          {(consultations || []).map((service) => (
            <div key={service.id} className="svc-card">
              <div className="svc-card-top">
                <div className="svc-card-name-row">
                  <h3 className="svc-card-name">{service.name}</h3>
                  <span className="svc-duration-pill">
                    <ClockIcon />
                    {service.duration}
                  </span>
                </div>
                <div className="svc-price-row">
                  <span className="svc-currency">₹</span>
                  <span className="svc-amount">{service.price}</span>
                </div>
                {service.description && (
                  <p className="svc-desc">{service.description}</p>
                )}
              </div>

              <div className="svc-card-actions">
                <button
                  className="svc-action-btn svc-edit-btn"
                  onClick={() => handleEdit(service)}
                  disabled={isBusy(service.id)}
                >
                  <EditIcon />
                  Edit
                </button>
                <button
                  className="svc-action-btn svc-delete-btn"
                  onClick={() => handleDelete(service)}
                  disabled={isBusy(service.id)}
                >
                  {deletingId === service.id ? (
                    <Loading type="inline" size="small" text="Deleting…" />
                  ) : (
                    <><TrashIcon />Delete</>
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Add new — ghost card */}
          <button
            className="svc-card svc-card-ghost"
            onClick={() => { setFormValues(emptyForm); setShowCreateForm(true); }}
          >
            <div className="svc-ghost-inner">
              <span className="svc-ghost-plus"><PlusIcon /></span>
              <span>Add Service</span>
            </div>
          </button>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreateForm && (
        <div className="svc-modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="svc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="svc-modal-header">
              <div>
                <h3>New Consultation Service</h3>
                <p>Fill in the details for your new service</p>
              </div>
              <button className="svc-modal-close" onClick={() => setShowCreateForm(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="svc-modal-body">
              <ConsultationForm values={formValues} onChange={handleInputChange} />
            </div>
            <div className="svc-modal-footer">
              <button className="svc-cancel-btn" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button
                className="svc-confirm-btn"
                onClick={handleSave}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <Loading type="inline" size="small" text="Creating…" />
                ) : (
                  'Create Service'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditForm && (
        <div className="svc-modal-overlay" onClick={handleCancelEdit}>
          <div className="svc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="svc-modal-header">
              <div>
                <h3>Edit Service</h3>
                <p>Update the details for this consultation type</p>
              </div>
              <button className="svc-modal-close" onClick={handleCancelEdit}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="svc-modal-body">
              <ConsultationForm values={formValues} onChange={handleInputChange} />
            </div>
            <div className="svc-modal-footer">
              <button className="svc-cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button
                className="svc-confirm-btn"
                onClick={handleUpdate}
                disabled={!isFormValid || updatingId === editingService?.id}
              >
                {updatingId === editingService?.id ? (
                  <Loading type="inline" size="small" text="Updating…" />
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Service;
