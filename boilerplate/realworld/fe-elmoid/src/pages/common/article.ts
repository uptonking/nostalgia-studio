import { API_ROOT } from '../../config';
import { authHeader } from '../../shared/auth-header';
import { Http } from '../../utils/hyperapp-fx';
import { LogError } from '../../utils/mvu';

// Actions & Effects
const SetArticle = (state, { article }) => ({ ...state, ...article });

// Views
export const FetchArticle = ({ slug, token }) =>
  Http({
    url: API_ROOT + '/articles/' + slug,
    options: { headers: authHeader(token) },
    action: SetArticle,
    error: LogError,
  });
