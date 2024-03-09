import './styles-base.scss';
import './styles.scss';

import React from 'react';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { Login } from './components/account/login';
import { Profile } from './components/account/profile';
import { Register } from './components/account/register';
import { Settings } from './components/account/settings';
import { Editor } from './components/article-editor';
import { Article } from './components/article/article';
import { Header } from './components/header';
import { Home } from './components/home';
import { PrivateRoute } from './components/private-route';
import { AuthProvider } from './hooks/use-auth-provider';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='article/:slug' element={<Article />} />
          <Route path='login' element={<Login />} />
          <Route path='register' element={<Register />} />
          <Route path='/profile/:username' element={<Profile />} />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}
