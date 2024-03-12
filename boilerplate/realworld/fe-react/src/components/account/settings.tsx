import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { logout, updateUser } from '../../api/auth-api';
import { userList } from '../../api/mock-data';
import { useAuth } from '../../hooks/use-auth-provider';
import type { ErrorsType } from '../../types';
import { ListErrors } from '../common/list-error';

export function Settings() {
  const navigate = useNavigate();
  const {
    state: { user },
    dispatch,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorsType | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [image, setImage] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    // console.log('==Settings-user, ', user);

    if (user) {
      const { username, email, image, bio } = user;
      // console.log(username, email, image, bio);
      setUsername(username);
      setEmail(email);
      setPassword(password);
      setImage(image || '');
      setBio(bio || '');
    }
  }, [password, user]);

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLoading(true);
    // if (!form.password) {
    //   delete form.password;
    // }
    try {
      // const payload = await updateUser(form);
      const payload = await updateUser({ username, email, image, bio });
      console.log('==updatedUser, ', payload);
      console.log('==updatedUserList, ', userList);

      dispatch({ type: 'LOAD_USER', user: (payload as any).data.user });
    } catch (error) {
      console.log(error);
      if (error['status'] === 422) {
        // @ts-expect-error fix-types
        setErrors(error.data.errors);
      }
    }
    setLoading(false);
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    logout();
    navigate('/');
  };

  return (
    <div className='settings-page'>
      <div className='container page'>
        <div className='row'>
          <div className='col-md-10 offset-md-2 col-xs-12'>
            <h1 className='text-xs-center'>Settings</h1>
            {errors && <ListErrors errors={errors} />}
            <form onSubmit={handleSubmit}>
              <fieldset>
                {/* <div className='form-group'>
                  <input
                    name='image'
                    className='form-control'
                    type='text'
                    placeholder='URL of profile picture'
                    value={image}
                    // onChange={e=>setImage(e.target.files[0])}
                  />
                </div> */}
                <div className='form-group'>
                  <input
                    name='username'
                    className='form-control form-control-lg'
                    type='text'
                    placeholder='Username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className='form-group'>
                  <textarea
                    name='bio'
                    className='form-control form-control-lg'
                    rows={8}
                    placeholder='Short bio about you'
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <div className='form-group'>
                  <input
                    name='email'
                    className='form-control form-control-lg'
                    type='email'
                    placeholder='Email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className='form-group'>
                  <input
                    name='password'
                    className='form-control form-control-lg'
                    type='password'
                    placeholder='New Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button
                  className='btn btn-lg btn-primary btn-brand-primary pull-xs-right'
                  type='submit'
                  disabled={loading}
                >
                  Update Settings
                </button>
              </fieldset>
            </form>
            <hr />
            <button
              className='btn btn-outline-danger btn-brand-primary-outline'
              onClick={handleLogout}
            >
              Click here to logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Settings;
