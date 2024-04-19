import * as React from 'react';

export const CardContent = ({
  text = '',
  children,
}: {
  text?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div>
      <h4>content title</h4>
      <p>{text}</p>
      {children}
    </div>
  );
};
