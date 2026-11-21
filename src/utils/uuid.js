// UUID validation utility
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
};

export default isValidUUID;
