export const validateSecretKey = (key) => {
  const regex = /^[0-9a-fA-F]{32}$/;
  return regex.test(key);
};