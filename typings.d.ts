// declare module '*.css';
// declare module '*.scss';
// declare module '*.less';

declare module '*.svg' {
  const content: string;
  export default content;
}
