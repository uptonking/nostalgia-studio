import * as React from 'react';

import cx from 'clsx';

import { useArticlesFeed } from '../../hooks/use-articles-provider';
import { useAuth } from '../../hooks/use-auth-provider';
import type { TabType } from '../../reducers/articles-materials';

type TabsListProps = {
  data: TabType[];
};

export function TabList({ data }: TabsListProps) {
  const {
    state: { user },
  } = useAuth();

  const tabsData = user ? data : [data[1]];

  const {
    state: { selectedTab },
    dispatch,
  } = useArticlesFeed();

  const tabsRElem = tabsData.map((tab) => (
    <Tab
      key={tab.type}
      isSelected={selectedTab.type === tab.type}
      onClick={() => dispatch({ type: 'SET_TAB', tab })}
    >
      {tab.label}
    </Tab>
  ));

  if (selectedTab.type === 'TAG') {
    tabsRElem.push(
      <Tab key={selectedTab.type} isSelected={true} onClick={() => {}}>
        #️⃣<span className='selected-tag'>{selectedTab.label} </span>
      </Tab>,
    );
  }

  return <ul className='nav nav-pills outline-active'>{tabsRElem}</ul>;
}

type TabProps = {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function Tab({ isSelected, onClick, children }: TabProps) {
  return (
    <li className='nav-item'>
      <button
        className={cx('navi-link nav-link', { active: isSelected })}
        onClick={onClick}
      >
        {children}
      </button>
    </li>
  );
}

export default TabList;
