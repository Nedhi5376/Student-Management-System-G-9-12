export const homePathFor = (user) => (user?.role === 'admin' ? '/admin' : '/dashboard');
