import * as React from 'react';

import cx from 'clsx';

import { useArticlesFeed } from '../../context/articles';
import { useAuth } from '../../context/auth';
import type { ITab } from '../../reducers/article-feed';

type TabsListProps = {
  data: ITab[];
};

export function TabList({ data }: TabsListProps) {
  const {
    state: { user },
  } = useAuth();

  const {
    state: { selectedTab },
    dispatch,
  } = useArticlesFeed();

  const tabs = data.map((tab) => (
    <Tab
      key={tab.type}
      isSelected={selectedTab.type === tab.type}
      onClick={() => dispatch({ type: 'SET_TAB', tab })}
    >
      {tab.label}
    </Tab>
  ));

  if (selectedTab.type === 'TAG') {
    tabs.push(
      <Tab key={selectedTab.type} isSelected={true} onClick={() => {}}>
        #{selectedTab.label}
      </Tab>,
    );
  }

  return <ul className='nav nav-pills outline-active'>{tabs}</ul>;
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
