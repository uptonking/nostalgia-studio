export const prefixFileUrlWithBackendUrl = (
  fileURL?: string,
): string | undefined => {
  return Boolean(fileURL) && fileURL?.startsWith('/')
    ? `${window.strapi['backendURL']}${fileURL}`
    : fileURL;
};
