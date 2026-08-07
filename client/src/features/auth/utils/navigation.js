export const homePathFor = (user) => {
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'teacher') return '/teacher';
  if (user?.role === 'student') return '/student';
  return '/dashboard';
};
