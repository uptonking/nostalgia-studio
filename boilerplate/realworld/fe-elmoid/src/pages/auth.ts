import { API_ROOT } from '../config';
import { html } from '../shared/html';
import { Http } from '../utils/hyperapp-fx';
import {
  errorsList,
  FormError,
  formFields,
  ListErrors,
  Submitting,
} from './common/forms';
import { UserSuccess } from './common/user';
import { LOGIN, REGISTER } from './links';

// Actions & Effects
const ChangeUsername = (state, username) => ({ ...state, username });
const ChangeEmail = (state, email) => ({ ...state, email });
const ChangePassword = (state, password) => ({ ...state, password });

const Login = ({ email, password }) =>
  Http({
    url: API_ROOT + '/users/login',
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: { email, password } }),
    },
    errorResponse: 'json',
    action: UserSuccess,
    error: FormError,
  });
const SubmitLogin = (state) => [
  Submitting(state),
  [Login({ email: state.email, password: state.password })],
];

const Register = ({ email, password, username }) =>
  Http({
    url: API_ROOT + '/users',
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: { email, password, username } }),
    },
    errorResponse: 'json',
    action: UserSuccess,
    error: FormError,
  });
const SubmitRegister = (state) => [
  { ...state, inProgress: true },
  [
    Register({
      email: state.email,
      password: state.password,
      username: state.username,
    }),
  ],
];

const defaultAuthFields = {
  email: '',
  password: '',
  ...formFields,
};

export const LoadLoginPage = (page) => (state) => {
  return {
    page,
    user: state.user,
    ...defaultAuthFields,
  };
};

export const LoadRegisterPage = (page) => (state) => {
  return {
    page,
    ...defaultAuthFields,
    user: state.user,
    username: '',
  };
};

// <form onsubmit=${preventDefault(SubmitLogin)}>
// oninput=${[ChangeEmail, targetValue]}
// oninput=${[ChangePassword, targetValue]}

// Views
export const LoginPage = ({ email, password, inProgress, errors }) => html`
  <div class="auth-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">Sign In</h1>
          <p class="text-xs-center">
            <a href=${REGISTER}>Need an account?</a>
          </p>

          ${ListErrors({ errors: errorsList({ errors }) })}

          <form onsubmit=${() => {}}>
            <fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  data-test="email"
                  type="email"
                  placeholder="Email"
                  value=${email}
                />
              </fieldset>

              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="password"
                  data-test="password"
                  placeholder="Password"
                  value=${password}
                />
              </fieldset>

              <button
                class="btn btn-lg btn-primary pull-xs-right"
                type="submit"
                disabled=${inProgress}
              >
                Sign in
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
`;

// <form onsubmit=${preventDefault(SubmitRegister)}>
// oninput=${[ChangeUsername, targetValue]}
// oninput=${[ChangeEmail, targetValue]}
// oninput=${[ChangePassword, targetValue]}

export const RegisterPage = ({
  username,
  password,
  email,
  inProgress,
  errors,
}) => html`
  <div class="auth-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">Sign Up</h1>
          <p class="text-xs-center">
            <a href=${LOGIN}>Have an account?</a>
          </p>

          ${ListErrors({ errors: errorsList({ errors }) })}

          <form onsubmit=${() => {}}>
            <fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="text"
                  data-test="username"
                  placeholder="Username"
                  value=${username}
                />
              </fieldset>

              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="email"
                  data-test="email"
                  placeholder="Email"
                  value=${email}
                />
              </fieldset>

              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="password"
                  data-test="password"
                  placeholder="Password"
                  value=${password}
                />
              </fieldset>

              <button
                class="btn btn-lg btn-primary pull-xs-right"
                type="submit"
                disabled=${inProgress}
              >
                Sign up
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
`;
