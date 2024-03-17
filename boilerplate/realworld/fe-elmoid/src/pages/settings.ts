import { html } from '../shared/html.js';
import { ListErrors } from './common/forms.js';
import { errorsList } from './common/forms.js';
import { Http } from '@kwasniew/hyperapp-fx';
import { API_ROOT } from '../config.js';
import { UserSuccess, Logout } from './common/user.js';
import { formFields, ChangeFieldFromTarget } from './common/forms.js';
import { FormError, Submitting } from './common/forms.js';
import { authHeader } from '../shared/auth-header.js';
import { preventDefault } from '@hyperapp/events';

// Actions & Effects
const UpdateSettings = (user) => {
  const { password, token, ...userWithoutPassword } = user;
  const submitUser =
    password && password.length > 0
      ? { password, ...userWithoutPassword }
      : userWithoutPassword;
  return Http({
    url: API_ROOT + '/user',
    options: {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(token),
      },
      body: JSON.stringify({ user: submitUser }),
    },
    errorResponse: 'json',
    action: UserSuccess,
    error: FormError,
  });
};

const SubmitForm = (state) => [
  Submitting(state),
  [
    UpdateSettings({
      image: state.image,
      username: state.username,
      bio: state.bio,
      email: state.email,
      password: state.password,
      token: state.user.token,
    }),
  ],
];

export const LoadSettingsPage = (page) => (state) => {
  return {
    page,
    user: state.user,
    ...state.user,
    password: '',
    ...formFields,
  };
};

// Views
const SettingsForm = ({
  image,
  username,
  bio,
  email,
  password,
  inProgress,
}) => html`
  <form onsubmit=${preventDefault(SubmitForm)}>
    <fieldset>
      <fieldset class="form-group">
        <input
          class="form-control"
          type="text"
          data-test="image"
          placeholder="URL of profile picture"
          value=${image}
          oninput=${ChangeFieldFromTarget('image')}
        />
      </fieldset>

      <fieldset class="form-group">
        <input
          class="form-control form-control-lg"
          type="text"
          data-test="username"
          placeholder="Username"
          value=${username}
          oninput=${ChangeFieldFromTarget('username')}
        />
      </fieldset>

      <fieldset class="form-group">
        <textarea
          class="form-control form-control-lg"
          rows="8"
          data-test="bio"
          placeholder="Short bio about you"
          value=${bio}
          oninput=${ChangeFieldFromTarget('bio')}
        />
      </fieldset>

      <fieldset class="form-group">
        <input
          class="form-control form-control-lg"
          type="email"
          data-test="email"
          placeholder="Email"
          value=${email}
          oninput=${ChangeFieldFromTarget('email')}
        />
      </fieldset>

      <fieldset class="form-group">
        <input
          class="form-control form-control-lg"
          type="password"
          data-test="password"
          placeholder="New Password"
          value=${password}
          oninput=${ChangeFieldFromTarget('password')}
        />
      </fieldset>

      <button
        class="btn btn-lg btn-primary pull-xs-right"
        type="submit"
        disabled=${!!inProgress}
      >
        Update Settings
      </button>
    </fieldset>
  </form>
`;

export const SettingsPage = ({
  image,
  username,
  bio,
  email,
  password,
  inProgress,
  errors,
}) => html`
  <div class="settings-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 offset-md-3 col-xs-12">
          <h1 class="text-xs-center">Your Settings</h1>

          ${ListErrors({ errors: errorsList({ errors }) })}
          ${SettingsForm({ image, username, bio, email, password, inProgress })}

          <hr />

          <button class="btn btn-outline-danger" onclick=${Logout}>
            Or click here to logout.
          </button>
        </div>
      </div>
    </div>
  </div>
`;
