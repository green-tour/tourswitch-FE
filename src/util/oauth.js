const RETURN_TO_KEY = 'returnTo';

export const preserveReturnTo = (returnTo) => {
  sessionStorage.setItem(RETURN_TO_KEY, returnTo);
};

export const consumeReturnTo = (fallback = '/') => {
  const storedPath = sessionStorage.getItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_TO_KEY);
  return storedPath?.startsWith('/') && !storedPath.startsWith('//') ? storedPath : fallback;
};
