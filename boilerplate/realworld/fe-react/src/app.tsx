import './styles-base.scss';
import './styles.scss';

import React, { useEffect, useState } from 'react';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { getCurrentUser } from './api/auth-api';
import { Login } from './components/account/login';
import { Profile } from './components/account/profile';
import { Register } from './components/account/register';
import { Settings } from './components/account/settings';
import { Editor } from './components/article-editor';
import { Article } from './components/article/article';
import { Header } from './components/header';
import { Home } from './components/home';
import { PrivateRoute } from './components/private-route';
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
        console.log('error at getCurrentUser ', error);
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

  // if (!user && isAuthenticated) {
  //   return null;
  // }

  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='article/:slug' element={<Article />} />
          <Route path='login' element={<Login />} />
          <Route path='register' element={<Register />} />
          <Route path=':username' element={<Profile />} />
          <Route
            path='settings'
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path='editor'
            element={
              <PrivateRoute>
                <Editor />
              </PrivateRoute>
            }
          />
          <Route
            path='editor/:slug'
            element={
              <PrivateRoute>
                <Editor />
              </PrivateRoute>
            }
          />
          {/* <PrivateRoute as={Editor} path='/editor' />
          <PrivateRoute as={Editor} path='/editor/:slug' /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
