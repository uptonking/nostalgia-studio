import * as React from 'react';

import { Link, type LinkProps, NavLink } from 'react-router-dom';

import logo from '../assets/images/realworld-logo.png';
import { useAuth } from '../hooks/use-auth-provider';
import type { UserType } from '../types';
import { APP_NAME } from '../utils/constants';

export function Header() {
  const {
    state: { user },
  } = useAuth();

  return (
    <nav className='navbar navbar-light'>
      <div className='container logo-container'>
        <div>
          <img src={logo} className='logo-image' alt='realworld-logo' />
          <Link to='/' className='navbar-logo-text'>
            {APP_NAME}
          </Link>
        </div>
        {user ? <LoggedInView user={user} /> : <LoggedOutView />}
      </div>
    </nav>
  );
}

const LoggedInView = ({ user: { username, image } }: { user: UserType }) => (
  <ul className='nav navbar-nav pull-xs-right'>
    {/* <li className='nav-item'>
      <NaviLink to='/'>Home</NaviLink>
    </li> */}

    <li className='nav-item'>
      <NaviLink to='/editor'>
        <i className='ion-compose' />
        Write Article
      </NaviLink>
    </li>

    <li className='nav-item'>
      <NaviLink to='/settings'>
        <i className='ion-gear-a' />
        Settings
      </NaviLink>
    </li>

    <li className='nav-item'>
      <NaviLink to={`/${username}`}>
        {image && <img src={image} className='user-pic' alt={username} />}
        {username}
      </NaviLink>
    </li>
  </ul>
);

const LoggedOutView = () => (
  <ul className='nav navbar-nav pull-xs-right'>
    <li className='nav-item text-info'>
      <NaviLink to='/login'>Sign in</NaviLink>
    </li>

    <li className='nav-item'>
      <NaviLink to='/register'>Sign up</NaviLink>
    </li>
  </ul>
);

const NaviLink = (props: LinkProps) => (
  <NavLink
    {...props}
    className={({ isActive }) =>
      isActive ? 'nav-link brand-primary' : 'nav-link'
    }
  />
);
