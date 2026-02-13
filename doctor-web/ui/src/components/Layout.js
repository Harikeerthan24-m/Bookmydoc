// src/components/Layout.js

import React, { Suspense } from 'react';
import SideBar from './sidebar/SideBar';
import TopBar from './topbar/TopBar';
import { Outlet } from 'react-router-dom';
import Loading from './common/Loading';
import './layout.css';

const Layout = () => {
  return (
    <div className="app-layout">
      <SideBar />
      <main className="main-content">
        <TopBar />
        <div className="content-wrapper">
          <Suspense fallback={<Loading type="overlay" text="Loading..." />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default Layout;
