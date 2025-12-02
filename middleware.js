import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    '/',
    '/admin',
    '/api/ite/:path*',
    '/api/extract-its',
    '/api/extract-quotes',
    '/api/user/:path*',
  ],
};
