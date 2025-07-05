export const getInitialAndLastName = (name) => {
  if (typeof name !== 'string' || !name.trim()) return '';
  const parts = name.trim().split(/\s+/);
  const firstInitial = parts[0][0].toUpperCase();
  const lastName = parts[parts.length - 1];
  return `${firstInitial}. ${lastName}`;
}
