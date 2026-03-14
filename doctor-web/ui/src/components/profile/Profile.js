import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaEdit, FaCamera, FaHospital, FaMapMarkerAlt, FaIdCard } from 'react-icons/fa';
import './Profile.css';
import { fetchUserProfile, updateUserProfile } from '../../store/slices/auth.slice';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import Loading from '../common/Loading';
import { useGetAllServicesQuery } from './../../store/slices';
import { useConsultations } from '../../contexts/ConsultationContext';
import ConsultationList from '../common/ConsultationList';
import ServicesTagSelect from './MultipleSelect';

const Profile = () => {
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formFields, setFormFields] = useState({
    user_name: '', title: '', hospital_name: '', expertiseList: [],
    experience: '', bio: '', photoUrl: '', phone: '', gender: '',
    doctor_registration_number: '', services: [], servicesIds: [],
    location: { address: '', city: '', state: '', country: '' },
  });
  const [photoPreviewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user, error, loading } = useSelector((state) => state?.auth);
  const { data: servicesData, isLoading } = useGetAllServicesQuery({});
  const { consultations } = useConsultations();

  useEffect(() => { dispatch(fetchUserProfile()); }, [dispatch]);

  useEffect(() => {
    if (!loading && error) toast(error.message);
    if (user && !error && !loading) {
      let expertiseList = [];
      if (user.expertiseList) {
        if (Array.isArray(user.expertiseList)) {
          expertiseList = user.expertiseList;
        } else if (typeof user.expertiseList === 'string') {
          try {
            const parsed = JSON.parse(user.expertiseList);
            expertiseList = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            expertiseList = user.expertiseList.includes(',')
              ? user.expertiseList.split(',').map(s => s.trim())
              : [user.expertiseList];
          }
        }
      }
      setProfileData({ ...user, expertiseList });
      setFormFields({
        user_name: user.user_name || '', title: user.title || '',
        hospital_name: user.hospital_name || '', expertiseList,
        experience: user.experience || 0, bio: user.bio || '',
        photoUrl: '', phone: user.phone || '', gender: user.gender || '',
        doctor_registration_number: user.doctor_registration_number || '',
        services: user.services || [],
        location: {
          address: user.location?.address || '', city: user.location?.city || '',
          state: user.location?.state || '', country: user.location?.country || '',
        },
      });
      const src = user?.photoUrl;
      setPreviewUrl(!src || src === '' || src === '/placeholder.png' ? '/avatar-default.svg' : src);
    }
  }, [user, error, loading, servicesData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'expertiseList') {
      setFormFields({ ...formFields, expertiseList: [...formFields.expertiseList, value] });
    } else if (['address', 'state', 'city', 'country'].includes(name)) {
      setFormFields({ ...formFields, location: { ...formFields.location, [name]: value } });
    } else if (name === 'services') {
      setFormFields({ ...formFields, servicesIds: [...value] });
    } else {
      setFormFields({ ...formFields, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    setFormFields((prev) => ({ ...prev, photoUrl: e.target.files[0] }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('user_name', String(formFields.user_name));
    formData.append('title', String(formFields.title));
    formData.append('hospital_name', String(formFields.hospital_name));
    formData.append('phone', String(formFields.phone));
    formData.append('gender', String(formFields.gender));
    formData.append('bio', String(formFields.bio));
    formData.append('experience', Number(formFields.experience));
    formData.append('doctor_registration_number', String(formFields.doctor_registration_number));
    if (formFields.location) formData.append('location', JSON.stringify(formFields.location));
    formFields?.servicesIds?.forEach((item) => formData.append('services[]', item));
    let expertiseList = Array.isArray(formFields?.expertiseList)
      ? formFields.expertiseList.map(s => String(s).trim()).filter(s => s && s !== '[]')
      : [String(formFields.expertiseList).trim()];
    formData.append('expertiseList', JSON.stringify(expertiseList));
    if (formFields.photoUrl) formData.append('file', formFields.photoUrl);

    try {
      setIsSaving(true);
      const response = await dispatch(updateUserProfile(formData)).unwrap();
      if (response?.statusCode === 200) {
        await dispatch(fetchUserProfile());
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      toast.error(err?.statusCode === 400 ? err.message : 'An error occurred while updating your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return <div className="profile-loading"><Loading type="overlay" text="Loading profile..." /></div>;
  }

  const locationParts = [profileData?.location?.city, profileData?.location?.state, profileData?.location?.country].filter(Boolean);

  /* ─── VIEW MODE ─── */
  if (!isEditing) {
    return (
      <div id="profile">
        <ToastContainer />
        <div className="profile-page-container">
          <div className="profile-card">

            {/* Cover + Avatar */}
            <div className="profile-cover">
              <div className="profile-cover-bg" />
              <div className="profile-avatar-ring">
                <img
                  src={photoPreviewUrl && photoPreviewUrl !== '/placeholder.png' ? photoPreviewUrl : '/avatar-default.svg'}
                  alt="Profile"
                  className="profile-avatar"
                  onError={(e) => { e.target.src = '/avatar-default.svg'; }}
                />
              </div>
            </div>

            {/* Identity */}
            <div className="profile-identity">
              <div className="profile-identity-top">
                <div>
                  <h1 className="profile-name">{profileData?.user_name || 'Doctor'}</h1>
                  {profileData?.title && <p className="profile-headline">{profileData.title}</p>}
                  <div className="profile-meta">
                    {profileData?.hospital_name && (
                      <span className="meta-chip"><FaHospital className="meta-icon" />{profileData.hospital_name}</span>
                    )}
                    {locationParts.length > 0 && (
                      <span className="meta-chip"><FaMapMarkerAlt className="meta-icon" />{locationParts.join(', ')}</span>
                    )}
                    {profileData?.doctor_registration_number && (
                      <span className="meta-chip"><FaIdCard className="meta-icon" />{profileData.doctor_registration_number}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
                  <FaEdit /> Edit Profile
                </button>
              </div>
            </div>

            {/* Stats Strip */}
            {(profileData?.experience || profileData?.expertiseList?.length > 0) && (
              <div className="profile-stats-strip">
                {profileData?.experience && (
                  <div className="profile-stat">
                    <span className="stat-value">{profileData.experience}+</span>
                    <span className="stat-label">Years Experience</span>
                  </div>
                )}
                {profileData?.expertiseList?.length > 0 && (
                  <div className="profile-stat">
                    <span className="stat-value">{profileData.expertiseList.length}</span>
                    <span className="stat-label">Specialties</span>
                  </div>
                )}
                {consultations?.length > 0 && (
                  <div className="profile-stat">
                    <span className="stat-value">{consultations.length}</span>
                    <span className="stat-label">Services</span>
                  </div>
                )}
              </div>
            )}

            {/* Body */}
            <div className="profile-body">
              {profileData?.bio && (
                <div className="profile-section">
                  <h6 className="section-label">About</h6>
                  <p className="profile-bio-text">{profileData.bio}</p>
                </div>
              )}

              <div className="profile-grid">
                <div className="profile-section">
                  <h6 className="section-label">Specialties</h6>
                  <div className="expertise-tags">
                    {profileData?.expertiseList?.length ? (
                      profileData.expertiseList.map((s, i) => (
                        <span className="expertise-tag" key={i}>{s}</span>
                      ))
                    ) : (
                      <span className="no-data">No specialties listed</span>
                    )}
                  </div>
                </div>

                <div className="profile-section">
                  <ConsultationList consultations={consultations} showTitle={true} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /* ─── EDIT MODE ─── */
  return (
    <div id="profile">
      <ToastContainer />
      <div className="profile-page-container">
        <div className="profile-edit-card">
          <div className="profile-edit-header">
            <h2>Edit Profile</h2>
            <p>Update your professional information</p>
          </div>

          <form onSubmit={handleFormSubmit} encType="multipart/form-data" className="profile-form">
            {/* Photo */}
            <div className="photo-edit-row">
              <div className="photo-edit-wrap">
                <img
                  src={photoPreviewUrl && photoPreviewUrl !== '/placeholder.png' ? photoPreviewUrl : '/avatar-default.svg'}
                  alt="Profile"
                  className="photo-edit-img"
                />
                <label htmlFor="file" className="photo-edit-btn"><FaCamera /></label>
                <input type="file" id="file" name="file" className="hidden-file-input" onChange={handleFileChange} accept="image/*" />
              </div>
              <div>
                <p className="photo-edit-name">{formFields.user_name || 'Your Name'}</p>
                <p className="photo-edit-hint">Click the camera icon to change photo</p>
              </div>
            </div>

            {/* Personal */}
            <div className="form-section">
              <h5 className="section-title">Personal Information</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" name="user_name" value={formFields.user_name} onChange={handleChange} placeholder="Enter full name" />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-control" name="gender" value={formFields.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" className="form-control" name="phone" value={formFields.phone} onChange={handleChange} placeholder="Phone number" />
                </div>
                <div className="form-group">
                  <label>Registration Number</label>
                  <input type="text" className="form-control" name="doctor_registration_number" value={formFields.doctor_registration_number} onChange={handleChange} placeholder="e.g. MCI-12345" />
                </div>
              </div>
            </div>

            {/* Professional */}
            <div className="form-section">
              <h5 className="section-title">Professional Details</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Designation / Title</label>
                  <input type="text" className="form-control" name="title" value={formFields.title} onChange={handleChange} placeholder="e.g. Senior Cardiologist" />
                </div>
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input type="text" className="form-control" name="experience" value={formFields.experience} onChange={handleChange} placeholder="e.g. 10" />
                </div>
              </div>
              <div className="form-group">
                <label>Hospital / Clinic</label>
                <input type="text" className="form-control" name="hospital_name" value={formFields.hospital_name} onChange={handleChange} placeholder="Hospital or clinic name" />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea className="form-control" name="bio" value={formFields.bio} onChange={handleChange} placeholder="Brief professional summary" />
              </div>
              <div className="form-group">
                <label>Specialties</label>
                <input type="text" className="form-control" name="expertiseList"
                  value={formFields.expertiseList?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                    setFormFields(prev => ({ ...prev, expertiseList: tags }));
                  }}
                  placeholder="e.g. Cardiology, Pediatrics" />
                <small className="form-hint">Separate multiple specialties with commas</small>
              </div>
              <div className="form-group">
                <ServicesTagSelect data={servicesData || []} formFields={formFields} handleChange={handleChange} />
              </div>
            </div>

            {/* Location */}
            <div className="form-section">
              <h5 className="section-title">Location</h5>
              <div className="form-group">
                <label>Street Address</label>
                <input type="text" className="form-control" name="address" value={formFields.location.address} onChange={handleChange} placeholder="Street address" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input type="text" className="form-control" name="city" value={formFields.location.city} onChange={handleChange} placeholder="City" />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" className="form-control" name="state" value={formFields.location.state} onChange={handleChange} placeholder="State" />
                </div>
              </div>
              <div className="form-group">
                <label>Country</label>
                <input type="text" className="form-control" name="country" value={formFields.location.country} onChange={handleChange} placeholder="Country" />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setIsEditing(false)} className="btn-cancel">Cancel</button>
              <button type="submit" className="btn-save" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
