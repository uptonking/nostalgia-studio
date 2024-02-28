import React, { useEffect, useState } from 'react';

import { Link, Navigate, useNavigate } from 'react-router-dom';

import { register } from '../../api/auth-api';
import { useAuth } from '../../context/auth';
import type { IErrors } from '../../types';
import { ListErrors } from '../common/list-error';

export function Register() {
  const navigate = useNavigate();

  const {
    state: { user },
    dispatch,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<IErrors | null>(null);

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLoading(true);
    // const { username, email, password } = form;
    try {
      const user = await register({ username, email, password });
      dispatch({ type: 'LOAD_USER', user });
      navigate('/');
    } catch (error) {
      console.log(error);
      setLoading(false);
      if (error['status'] === 422) {
        // @ts-expect-error fix-types
        setErrors(error.data.errors);
      }
    }
  };

  if (user) {
    return <Navigate to='/' replace={true} />;
  }

  return (
    <div className='auth-page'>
      <div className='container page'>
        <div className='row'>
          <div className='col-md-6 offset-md-3 col-xs-12'>
            <h1 className='text-xs-center'>Sign up</h1>
            <p className='text-xs-center'>
              <Link to='/login' className='login-hint-text'>
                Already have an account? click to login
              </Link>
            </p>
            {errors && <ListErrors errors={errors} />}
            <form onSubmit={handleSubmit}>
              <fieldset className='form-group'>
                <input
                  name='username'
                  className='form-control form-control-lg'
                  type='text'
                  value={username}
                  placeholder='Username'
                  onChange={(e) => setUsername(e.target.value)}
                />
              </fieldset>
              <fieldset className='form-group'>
                <input
                  name='email'
                  className='form-control form-control-lg'
                  type='email'
                  value={email}
                  placeholder='Email'
                  onChange={(e) => setEmail(e.target.value)}
                />
              </fieldset>
              <fieldset className='form-group'>
                <input
                  name='password'
                  className='form-control form-control-lg'
                  type='password'
                  value={password}
                  placeholder='Password'
                  onChange={(e) => setPassword(e.target.value)}
                />
              </fieldset>
              <button
                className='btn btn-lg btn-primary btn-brand-primary pull-xs-right'
                disabled={loading}
              >
                Sign Up
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
