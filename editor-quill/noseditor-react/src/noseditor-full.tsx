import React, { forwardRef, useEffect, useRef } from 'react';

import type Quill from 'quill';

import {
  createNoseditor,
  type CreateNoseditorOptions,
} from '@datalking/noseditor';

type NoseditorFullProps = Omit<CreateNoseditorOptions, 'container'> & {
  container?: string | HTMLElement;
};

export const NoseditorFull = forwardRef<Quill, NoseditorFullProps>(
  (props, ref) => {
    const editorRoot = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const root = editorRoot.current;
      if (root) {
        const noseditor = createNoseditor({
          ...props,
          container: root,
        });

        if (!ref) {
          ref = { current: noseditor };
        } else {
          ref['current'] = noseditor;
        }

        return () => {
          // @ts-expect-error fix-types
          noseditor.theme.modules.toolbar?.container?.remove?.();
          // @ts-expect-error fix-types
          noseditor.theme.modules.clipboard?.container?.remove();
          // @ts-expect-error fix-types
          noseditor.theme?.tooltip?.root?.remove();
          root.remove();
          root.innerHTML = '';
          // console.log(';; cleaned ');
        };
      }
    }, [props]);

    // console.log(';; nos-react ', props, ref);
    return (
      <div className='ql-editor-container noseditor-container'>
        <div className='noseditor-root' ref={editorRoot} />
      </div>
    );
  },
);
