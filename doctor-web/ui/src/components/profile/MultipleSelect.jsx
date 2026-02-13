import React, { useState, useEffect } from 'react';
import './multiple.css';

const ServicesTagSelect = ({ data, formFields, handleChange }) => {
  const [selectedServices, setSelectedServices] = useState(
    formFields?.services || [],
  );

  useEffect(() => {
    setSelectedServices(formFields?.services || []);
  }, [formFields?.services]);

  const handleSelectChange = (event) => {
    const selectedOption = event.target.value;
    if (!selectedServices.includes(selectedOption)) {
      const updatedServices = [...selectedServices, selectedOption];
      setSelectedServices(updatedServices);

      // Return the updated array of service IDs
      const selectedServiceIds = updatedServices.map(
        (serviceId) =>
          data.find((service) => service.service_id === serviceId)?.service_id,
      );
      handleChange({ target: { name: 'services', value: selectedServiceIds } });
    }
  };

  const handleRemoveService = (serviceId) => {
    const updatedServices = selectedServices.filter(
      (service) => service !== serviceId,
    );
    setSelectedServices(updatedServices);

    // Return the updated array of service IDs after removal
    const selectedServiceIds = updatedServices.map(
      (serviceId) =>
        data.find((service) => service.service_id === serviceId)?.service_id,
    );
    handleChange({ target: { name: 'services', value: selectedServiceIds } });
  };

  return (
    <div className="form-group">
      <label htmlFor="services">Services</label>

      {/* Tags Display */}
      <div className="tags-container">
        {selectedServices.map((serviceId) => {
          const service = data?.find((item) => item?.service_id === serviceId);
          if (!service) return null;
          return (
            <span key={service.service_id} className="tag">
              {service.name}
              <button
                type="button"
                className="remove-tag"
                onClick={() => handleRemoveService(serviceId)}
              >
                &times;
              </button>
            </span>
          );
        })}
      </div>

      {/* Dropdown for Selecting Services */}
      <select
        id="services"
        className="form-control"
        onChange={handleSelectChange}
        value=""
      >
        <option value="" disabled>
          Select a service
        </option>
        {data?.map((service) =>
          service?.service_id && service?.name ? (
            <option key={service.service_id} value={service.service_id}>
              {service.name}
            </option>
          ) : null,
        )}
      </select>
    </div>
  );
};

export default ServicesTagSelect;
