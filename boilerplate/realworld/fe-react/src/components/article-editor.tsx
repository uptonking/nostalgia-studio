import React, { useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { createArticle, getArticle, updateArticle } from '../api/article-api';
import { useAuth } from '../context/auth';
import type { IErrors } from '../types';
import { ListErrors } from './common/list-error';

export function Editor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // console.log(';; slug, ', slug);

  const {
    state: { user },
  } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');
  const [errors, setErrors] = useState<IErrors | null>();

  useEffect(() => {
    let ignore = false;

    const fetchArticle = async () => {
      try {
        const payload = await getArticle(slug);
        const { title, description, body, tagList } = (payload as any).data
          .article;
        if (!ignore) {
          // dispatch({
          //   type: 'SET_FORM',
          //   form: { title, description, body, tag: '' },
          // });
          // dispatch({ type: 'SET_TAGS', tagList });

          setTitle(title);
          setDescription(description);
          setBody(body);
          setTag(tagList.toString());
        }
      } catch (error) {
        // @ts-expect-error fix-types
        setErrors(error);
        console.log(error);
      }
    };

    if (slug) {
      fetchArticle();
    }
    return () => {
      ignore = true;
    };
  }, [slug]);

  const handelKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // console.log(event.key, event.code);
    // if (event.keyCode === 13) {
    if (event.key === 'enter') {
      // dispatch({ type: 'ADD_TAG', tag: event.currentTarget.value });
      // dispatch({ type: 'UPDATE_FORM', field: { key: 'tag', value: '' } });
    }
  };

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    try {
      // const { title, description, body } = state.form;
      const article = {
        title,
        description,
        body,
        tagList: tag && tag.trim() !== '' ? [tag.trim()] : [],
        user,
      };
      let payload;

      if (slug) {
        payload = await updateArticle({ slug, ...article });
      } else {
        payload = await createArticle(article);
      }
      navigate(`/article/${payload.data.article.slug}`);
    } catch (error) {
      console.log(error);
      if (error['status'] === 422) {
        // setErrors(error)
        // @ts-expect-error fix-types
        setErrors(error.data.errors);
        // dispatch({ type: 'SET_ERRORS', errors: error.data.errors });
      }
    }
  };

  return (
    <div className='editor-page'>
      <div className='container page'>
        <div className='row'>
          <div className='col-md-10 offset-md-1 col-xs-12'>
            {/* <ListErrors errors={errors} /> */}

            <form onSubmit={handleSubmit}>
              <div className='form-group'>
                <input
                  name='title'
                  className='form-control form-control-lg'
                  type='text'
                  placeholder='Article Title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className='form-group'>
                <input
                  name='description'
                  className='form-control'
                  type='text'
                  placeholder="What's this article about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className='form-group'>
                <textarea
                  name='body'
                  className='form-control'
                  rows={8}
                  placeholder='Write your article (support markdown syntax)'
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              <div className='form-group'>
                <input
                  name='tag'
                  className='form-control'
                  type='text'
                  placeholder='Enter tags'
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onKeyUp={handelKeyUp}
                />

                {/* <div className="tag-list">
                  {state.tagList.map((tag) => {
                    return (
                      <span className="tag-default tag-pill" key={tag}>
                        <i
                          className="ion-close-round"
                          onClick={() => dispatch({ type: 'REMOVE_TAG', tag })}
                         />
                        {tag}
                      </span>
                    );
                  })}
                </div> */}
              </div>

              <button
                className='btn btn-lg pull-xs-right btn-primary btn-brand-primary'
                type='submit'
              >
                {slug ? 'Update' : 'Publish'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
