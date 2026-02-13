import React from 'react';
import './ConsultationList.css';

const ConsultationList = ({
  consultations,
  showTitle = true,
  maxItems = null,
}) => {
  const displayConsultations = maxItems
    ? consultations.slice(0, maxItems)
    : consultations;

  return (
    <div className="consultation-list-container">
      {showTitle && <h5>Consultation Services</h5>}
      <div className="consultations-wrapper">
        {displayConsultations && displayConsultations.length > 0 ? (
          displayConsultations.map((consultation) => (
            <div key={consultation.id} className="consultation-item">
              <div className="consultation-info">
                <h6 className="consultation-name">{consultation.name}</h6>
                <div className="consultation-details">
                  <span className="consultation-duration">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                        fill="currentColor"
                      />
                      <path
                        d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
                        fill="currentColor"
                      />
                    </svg>
                    {consultation.duration}
                  </span>
                  <span className="consultation-price">
                    ₹{consultation.price}
                  </span>
                </div>
                {consultation.description && (
                  <p className="consultation-description">
                    {consultation.description}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-consultations">
            <p>No consultation services created yet.</p>
            <small>
              Create your first consultation service to get started.
            </small>
          </div>
        )}
      </div>
      {consultations.length > maxItems && maxItems && (
        <div className="more-consultations">
          <small>+{consultations.length - maxItems} more services</small>
        </div>
      )}
    </div>
  );
};

export default ConsultationList;
