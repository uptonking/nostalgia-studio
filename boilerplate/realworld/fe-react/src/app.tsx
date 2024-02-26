import './styles-base.scss';
import './styles.scss';

import React, { useEffect, useState } from 'react';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { getCurrentUser } from './api/auth-api';
import { Header } from './components/header';
import { Home } from './components/home';
// import { Article } from './components/article';
// import { Editor } from './components/article-editor';
// import { Login } from './components/account/login';
// import { PrivateRoute } from './components/private-route';
// import { Profile } from './components/account/profile';
// import { Register } from './components/account/register';
// import { Settings } from './components/account/settings';
import { AuthProvider, useAuth } from './context/auth';

export function App() {
  const {
    state: { user, isAuthenticated },
    dispatch,
  } = useAuth();

  useEffect(() => {
    let ignore = false;

    async function fetchUser() {
      try {
        const payload = await getCurrentUser();
        const { token, ...user } = payload.data.user;
        if (!ignore) {
          dispatch({ type: 'LOAD_USER', user });
        }
      } catch (error) {
        console.log('error in getCurrentUser ', error);
      }
    }

    // ❓
    if (!user && isAuthenticated) {
      fetchUser();
    }

    return () => {
      ignore = true;
    };
  }, [dispatch, isAuthenticated, user]);

  if (!user && isAuthenticated) {
    return null;
  }

  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path='/' element={<Home />} />
          {/* <Route path='article/:slug' element={<Article />} />
          <Route path='login' element={<Login />} />
          <Route path='register' element={<Register />} />
          <Route path=':username' element={<Profile />} />
          <PrivateRoute as={Settings} path='/settings' />
          <PrivateRoute as={Editor} path='/editor' />
          <PrivateRoute as={Editor} path='/editor/:slug' /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
