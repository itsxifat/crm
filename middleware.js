// crm/middleware.js
import { withAuth } from "next-auth/middleware";

// We CANNOT import the full `authOptions` object here because
// it contains Node.js-specific code (like Mongoose/MongoDB)
// which is not supported in the Edge runtime.

export default withAuth({
  // 1. This must match the `pages.signIn` value in your authOptions.js
  pages: {
    signIn: "/login",
  },
  
  callbacks: {
    /**
     * This 'authorized' callback is the new security gate.
     * `withAuth` automatically decodes the JWT (using your NEXTAUTH_SECRET)
     * and provides the `token` object.
     *
     * We just check its contents.
     */
    authorized: ({ token }) => {
      // 1. Check if the token exists (user is logged in)
      // 2. Check if the user has the 'admin' role
      return !!token && token.role === "admin";
    },
  },
});

// 2. This 'matcher' config remains unchanged.
// It applies the "admin-only" rule from above to your entire site.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth's own API routes)
     * - login (the login page)
     * - signup (the signup page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public images (logo.png, paid-stamp.png, 3.png, etc.)
     */
    "/((?!api/auth|login|signup|_next/static|_next/image|favicon.ico|logo.png|paid-stamp.png|3.png).*)",
  ],
};