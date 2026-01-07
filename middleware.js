// crm/middleware.js
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  
  callbacks: {
    authorized: ({ token }) => {
      // Check if the user is logged in. 
      // We removed '&& token.role === "admin"' to allow 'in-house' and 'remote' users to access the app.
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/((?!api/auth|login|signup|_next/static|_next/image|favicon.ico|logo.png|paid-stamp.png|3.png).*)",
  ],
};