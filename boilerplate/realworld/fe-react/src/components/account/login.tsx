import React, { useEffect, useState } from 'react';

import { Link, Navigate, useNavigate } from 'react-router-dom';

import { login } from '../../api/auth-api';
import { useAuth } from '../../hooks/use-auth-provider';
import type { ErrorsType } from '../../types';
import { ListErrors } from '../common/list-error';

export function Login() {
  const navigate = useNavigate();

  const {
    state: { user },
    dispatch,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorsType | null>();

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
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
            <h1 className='text-xs-center'>Sign in</h1>
            <p className='text-xs-center'>
              <Link to='/register' className='login-hint-text'>
                Need an account? click here to register
              </Link>
            </p>
            {errors && <ListErrors errors={errors} />}
            <form onSubmit={handleSubmit}>
              <fieldset className='form-group'>
                <input
                  name='email'
                  className='form-control form-control-lg'
                  type='email'
                  value={email}
                  placeholder='Email'
                  onChange={(event) => setEmail(event.target.value)}
                />
              </fieldset>
              <fieldset className='form-group'>
                <input
                  name='password'
                  className='form-control form-control-lg'
                  type='password'
                  value={password}
                  placeholder='Password'
                  onChange={(event) => setPassword(event.target.value)}
                />
              </fieldset>
              <button
                className='btn btn-lg btn-primary btn-brand-primary pull-xs-right'
                type='submit'
                disabled={loading}
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
