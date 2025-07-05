export const getInitials = (user) => {
    const name = user.name || user.email.split('@')[0];
    const nameParts = name.trim().split(' ');
    return nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
      : nameParts[0].slice(0, 2);
  };