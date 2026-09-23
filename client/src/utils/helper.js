export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateUniqueId = () => {
  return 'id_' + Math.random().toString(36).substring(2, 9);
};