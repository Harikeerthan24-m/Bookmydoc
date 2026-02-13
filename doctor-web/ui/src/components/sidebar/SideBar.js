import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './SideBar.css';

const SideBar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    // Close on route change for small screens
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
  }, [isOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
        className="sidebar-toggle"
        onClick={toggleSidebar}
      >
        <span className={`hamburger ${isOpen ? 'open' : ''}`}></span>
      </button>

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo/Brand Section */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <img
              src="/logo192.png"
              alt="BookMyDoc Logo"
              width="32"
              height="32"
            />
          </div>
          <div className="brand-text">
            <h3>BookMyDoc</h3>
            <span>Doctor Portal</span>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="nav-section">
          <div className="nav-section-title">MAIN NAVIGATION</div>
          <nav className="nav-menu">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <div className="nav-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/availability"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <div className="nav-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7V10Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span>Availability</span>
            </NavLink>

            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <div className="nav-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7V10Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span>Appointments</span>
            </NavLink>

            <NavLink
              to="/services"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <div className="nav-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2ZM12 19C14.21 19 16 17.21 16 15S14.21 11 12 11S8 12.79 8 15S9.79 19 12 19ZM12 13C13.1 13 14 13.9 14 15S13.1 17 12 17S10 16.1 10 15S10.9 13 12 13Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span>Services</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <div className="nav-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span>Profile</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </>
  );
};

export default SideBar;
