import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { FaEdit } from 'react-icons/fa'; // Import Font Awesome edit icon
import './Profile.css';
import {
  fetchUserProfile,
  updateUserProfile,
} from '../../store/slices/auth.slice';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import Loading from '../common/Loading';
import { useGetAllServicesQuery } from './../../store/slices';
import { useConsultations } from '../../contexts/ConsultationContext';
import ConsultationList from '../common/ConsultationList';

const Profile = () => {
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState(null); // State to store profile data
  const [isEditing, setIsEditing] = useState(false);

  const [formFields, setFormFields] = useState({
    user_name: '',
    title: '',
    hospital_name: '',
    expertiseList: [],
    experience: '',
    bio: '',
    photoUrl: '',
    phone: '',
    gender: '',
    doctor_registration_number: '',
    services: [],
    servicesIds: [],
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
    },
  });
  const [photoPreviewUrl, setPreviewUrl] = useState('');
  const { user, error, loading } = useSelector((state) => state?.auth);
  const { data: servicesData, isLoading } = useGetAllServicesQuery({});
  const { consultations } = useConsultations();

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && error) {
      toast(error.message);
    }

    if (user && !error && !loading) {
      // Initialize empty expertiseList
      let expertiseList = [];

      // Handle different formats of expertiseList
      if (user.expertiseList) {
        if (Array.isArray(user.expertiseList)) {
          expertiseList = user.expertiseList;
        } else if (typeof user.expertiseList === 'string') {
          try {
            // Try parsing as JSON
            const parsed = JSON.parse(user.expertiseList);
            if (Array.isArray(parsed)) {
              expertiseList = parsed;
            } else if (parsed && typeof parsed === 'string') {
              expertiseList = [parsed];
            }
          } catch {
            // If not valid JSON, split by comma if it contains one
            if (user.expertiseList.includes(',')) {
              expertiseList = user.expertiseList.split(',');
            } else {
              // Single value
              expertiseList = [user.expertiseList];
            }
          }
        }
      }

      setProfileData({
        ...user,
        expertiseList: expertiseList,
      });

      setFormFields({
        user_name: user.user_name || '',
        title: user.title || '',
        hospital_name: user.hospital_name || '',
        expertiseList: expertiseList,
        experience: user.experience || 0,
        bio: user.bio || '',
        photoUrl: '',
        phone: user.phone || '',
        gender: user.gender || '',
        doctor_registration_number: user.doctor_registration_number || '',
        services: user.services || [],
        location: {
          address: user.location?.address || '',
          city: user.location?.city || '',
          state: user.location?.state || '',
          country: user.location?.country || '',
        },
      });
      // Set preview URL, but use default avatar if photoUrl is empty, null, or the old placeholder
      const photoUrl = user?.photoUrl;
      const shouldUseDefaultAvatar =
        !photoUrl || photoUrl === '' || photoUrl === '/placeholder.png';
      const finalPhotoUrl = shouldUseDefaultAvatar
        ? '/avatar-default.svg'
        : photoUrl;
      console.log('Profile photoUrl debug:', {
        photoUrl,
        shouldUseDefaultAvatar,
        finalPhotoUrl,
      });
      setPreviewUrl(finalPhotoUrl);
    }

    if (servicesData) {
      setFormFields((state) => ({ ...state, services: servicesData }));
    }
  }, [user, error, loading, servicesData]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'expertiseList') {
      setFormFields({
        ...formFields,
        expertiseList: [...formFields.expertiseList, value],
      });
    } else if (['address', 'state', 'city', 'country'].includes(name)) {
      setFormFields({
        ...formFields,
        location: {
          ...formFields.location,
          [name]: value,
        },
      });
    } else if (name === 'services') {
      setFormFields({
        ...formFields,
        servicesIds: [...value],
      });
    } else {
      setFormFields({
        ...formFields,
        [name]: value,
      });
    }
  };

  // TO HANDLE FILES ON CHANGE..
  const handleFileChange = (e) => {
    setFormFields((prevData) => ({
      ...prevData,
      photoUrl: e.target.files[0],
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    console.log('Form submission data:', {
      formFields,
      expertiseList: formFields.expertiseList,
    });

    formData.append('user_name', String(formFields.user_name));
    formData.append('title', String(formFields.title));
    formData.append('hospital_name', String(formFields.hospital_name));
    formData.append('phone', String(formFields.phone));
    formData.append('gender', String(formFields.gender));
    formData.append('bio', String(formFields.bio));
    formData.append('experience', Number(formFields.experience));
    formData.append(
      'doctor_registration_number',
      String(formFields.doctor_registration_number),
    );
    // formData.append('hospital_name', String(formFields.hospital_name));

    if (formFields.location) {
      formData.append('location', JSON.stringify(formFields.location));
    }

    formFields?.servicesIds?.forEach((item) =>
      formData.append('services[]', item),
    );

    // Clean and prepare expertise list
    let expertiseList = [];
    if (formFields?.expertiseList) {
      if (Array.isArray(formFields.expertiseList)) {
        expertiseList = formFields.expertiseList
          .map((item) => String(item).trim())
          .filter((item) => item && item !== '[]' && item.length > 0);
      } else if (typeof formFields.expertiseList === 'string') {
        expertiseList = [formFields.expertiseList.trim()];
      }
    }

    // Send as a single array
    formData.append('expertiseList', JSON.stringify(expertiseList));

    if (formFields.photoUrl) {
      formData.append('file', formFields.photoUrl);
    }

    try {
      const response = await dispatch(updateUserProfile(formData)).unwrap();
      console.log('Profile update response:', response);

      if (response?.statusCode === 200) {
        // Refresh profile data
        await dispatch(fetchUserProfile());
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Updating profile failed:', error);
      if (error?.statusCode === 400) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred while updating your profile.');
      }
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex text-center justify-center">
        <Loading type="overlay" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div id="profile">
      <div className="container">
        <ToastContainer />
        <div className="row justify-content-center mt-4 center">
          <div className="col-md-10">
            <div className="card shadow-sm">
              <div className="card-body">
                {isEditing ? (
                  <form
                    onSubmit={handleFormSubmit}
                    encType="multipart/form-data"
                    className="profile-form"
                  >
                    <div className="profile-image-edit-section">
                      <div className="current-profile-image">
                        <img
                          src={
                            photoPreviewUrl &&
                            photoPreviewUrl !== '/placeholder.png'
                              ? photoPreviewUrl
                              : '/avatar-default.svg'
                          }
                          alt="Current profile"
                          className="edit-profile-image"
                        />
                        <div className="image-edit-overlay">
                          <label htmlFor="file" className="image-edit-btn">
                            <FaEdit /> Change Photo
                          </label>
                          <input
                            type="file"
                            className="hidden-file-input"
                            id="file"
                            name="file"
                            onChange={handleFileChange}
                            accept="image/*"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="user_name">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="user_name"
                          name="user_name"
                          value={formFields?.user_name || ''}
                          onChange={handleChange}
                          placeholder="Enter name"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="title">Designation/Title</label>
                        <input
                          type="text"
                          className="form-control"
                          id="title"
                          name="title"
                          value={formFields?.title || ''}
                          onChange={handleChange}
                          placeholder="Enter title"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="hospital_name">Hospital Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="hospital_name"
                          name="hospital_name"
                          value={formFields?.hospital_name || ''}
                          onChange={handleChange}
                          placeholder="Enter hospital name"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={formFields?.phone || ''}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="gender">Gender</label>
                        <select
                          className="form-control"
                          id="gender"
                          name="gender"
                          value={formFields?.gender || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="bio">Bio</label>
                      <textarea
                        className="form-control"
                        id="bio"
                        name="bio"
                        value={formFields?.bio || ''}
                        onChange={handleChange}
                        placeholder="Tell us about yourself"
                      ></textarea>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="experience">Experience (Years)</label>
                        <input
                          type="text"
                          className="form-control"
                          id="experience"
                          name="experience"
                          value={formFields?.experience || ''}
                          onChange={handleChange}
                          placeholder="Enter experience"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="doctor_registration_number">
                          Doctor Registration Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="doctor_registration_number"
                          name="doctor_registration_number"
                          value={formFields?.doctor_registration_number || ''}
                          onChange={handleChange}
                          placeholder="Enter doctor registration number"
                        />
                      </div>

                      {/* <div className="form-group">
                          <label htmlFor="hospital_name">
                            Hospital/Clinic Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="hospital_name"
                            name="hospital_name"
                            value={formFields?.hospital_name || ''}
                            onChange={handleChange}
                            placeholder="Enter hospital or clinic name"
                          />
                        </div> */}
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="expertiseList">Specialty/Expertise</label>
                      <input
                        type="text"
                        className="form-control"
                        id="expertiseList"
                        name="expertiseList"
                        value={formFields?.expertiseList?.join(', ') || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Split by comma and clean up each tag
                          const tags = value
                            .split(',')
                            .map((tag) => tag.trim())
                            .filter((tag) => tag.length > 0);
                          setFormFields((prev) => ({
                            ...prev,
                            expertiseList: tags,
                          }));
                        }}
                        placeholder="Enter specialties separated by commas (e.g., Cardiologist, Pediatrician)"
                      />
                      <small className="form-text text-muted">
                        Enter multiple specialties separated by commas
                      </small>
                    </div>

                    {/* <div className="form-group full-width">
                      <MultipleSelect
                        data={servicesData || []}
                        formFields={formFields}
                        handleChange={handleChange}
                      />
                    </div> */}

                    <div className="form-section">
                      <h5 className="section-title">Address Information</h5>

                      <div className="form-group full-width">
                        <label htmlFor="location_address">Street Address</label>
                        <input
                          type="text"
                          className="form-control"
                          id="location_address"
                          name="address"
                          value={formFields?.location?.address || ''}
                          onChange={handleChange}
                          placeholder="Enter Address"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="location_city">City</label>
                          <input
                            type="text"
                            className="form-control"
                            id="location_city"
                            name="city"
                            value={formFields?.location?.city || ''}
                            onChange={handleChange}
                            placeholder="Enter city"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="location_state">State</label>
                          <input
                            type="text"
                            className="form-control"
                            id="location_state"
                            name="state"
                            value={formFields?.location?.state || ''}
                            onChange={handleChange}
                            placeholder="Enter state"
                          />
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="country">Country</label>
                        <input
                          type="text"
                          className="form-control"
                          id="country"
                          name="country"
                          value={formFields?.location?.country || ''}
                          onChange={handleChange}
                          placeholder="Enter country"
                        />
                      </div>
                    </div>

                    <div className="form-group divided">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="btn btn-secondary cancel"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary save">
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-horizontal-layout">
                    <div className="profile-image-section">
                      <img
                        src={
                          photoPreviewUrl &&
                          photoPreviewUrl !== '/placeholder.png'
                            ? photoPreviewUrl
                            : '/avatar-default.svg'
                        }
                        alt="Doctor's profile"
                        className="profile-image"
                        onError={(e) => {
                          console.log('Image failed to load:', e.target.src);
                          e.target.src = '/avatar-default.svg';
                        }}
                        onLoad={() =>
                          console.log(
                            'Image loaded successfully:',
                            photoPreviewUrl,
                          )
                        }
                      />
                    </div>
                    <div className="profile-info-section">
                      <div className="profile-header">
                        <h2 className="profile-name">
                          {profileData?.user_name}
                        </h2>
                        {profileData?.doctor_registration_number && (
                          <small className="profile-registration-subtitle">
                            Registration:{' '}
                            {profileData?.doctor_registration_number}
                          </small>
                        )}
                        <h4 className="profile-title">{profileData?.title}</h4>
                        {profileData?.hospital_name && (
                          <h5 className="profile-hospital">
                            {profileData?.hospital_name}
                          </h5>
                        )}
                        <div className="profile-experience">
                          <span className="experience-badge">
                            {profileData?.experience}+ years experience
                          </span>
                        </div>
                      </div>

                      <div className="profile-bio">
                        <p>{profileData?.bio}</p>
                      </div>

                      <div className="profile-expertise">
                        <h5>Specialties</h5>
                        <div className="expertise-tags">
                          {profileData?.expertiseList &&
                          profileData.expertiseList?.length ? (
                            profileData.expertiseList?.map(
                              (speciality, index) => (
                                <span className="expertise-tag" key={index}>
                                  {speciality}
                                </span>
                              ),
                            )
                          ) : (
                            <span className="no-data">
                              No specialties listed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="profile-consultations">
                        <ConsultationList
                          consultations={consultations}
                          showTitle={true}
                        />
                      </div>

                      <div className="profile-actions">
                        <button
                          onClick={handleEditClick}
                          className="btn btn-primary edit-btn"
                        >
                          <FaEdit /> Edit Profile
                        </button>
                      </div>
                    </div>
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

export default Profile;
