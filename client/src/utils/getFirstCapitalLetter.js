export const getFirstCapitalLetter = (str) => {
  if (typeof str !== 'string' || str.length === 0) return '';
  const firstChar = str.trim().charAt(0);
  return firstChar.toUpperCase();
}