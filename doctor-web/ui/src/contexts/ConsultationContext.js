import React, { createContext, useContext } from 'react';
import {
  useGetAllServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} from '../store/slices';

const ConsultationContext = createContext();

export const useConsultations = () => {
  const context = useContext(ConsultationContext);
  if (!context) {
    throw new Error(
      'useConsultations must be used within a ConsultationProvider',
    );
  }
  return context;
};

export const ConsultationProvider = ({ children }) => {
  const { data: consultations = [], refetch } = useGetAllServicesQuery({});
  const [createService] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();

  const addConsultation = async (consultation) => {
    try {
      await createService({
        name: consultation.name,
        duration: consultation.duration,
        price: consultation.price,
        description: consultation.description,
      });
      refetch();
    } catch (error) {
      console.error('Error creating consultation:', error);
      throw error;
    }
  };

  const removeConsultation = async (consultationId) => {
    try {
      await deleteService(consultationId);
      refetch();
    } catch (error) {
      console.error('Error deleting consultation:', error);
      throw error;
    }
  };

  const updateConsultation = async (consultationId, updatedData) => {
    try {
      await updateService({
        id: consultationId,
        data: updatedData,
      });
      refetch();
    } catch (error) {
      console.error('Error updating consultation:', error);
      throw error;
    }
  };

  const value = {
    consultations,
    addConsultation,
    removeConsultation,
    updateConsultation,
    refetch,
  };

  return (
    <ConsultationContext.Provider value={value}>
      {children}
    </ConsultationContext.Provider>
  );
};
