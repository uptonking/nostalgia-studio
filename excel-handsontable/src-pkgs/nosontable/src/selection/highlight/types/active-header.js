import { Selection } from '../../../walkontable';

/**
 * @return {Selection}
 */
function createHighlight({ activeHeaderClassName }) {
  const s = new Selection({
    highlightHeaderClassName: activeHeaderClassName,
  });

  return s;
}

export default createHighlight;
