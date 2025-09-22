// /lib/authOptions.js
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const client = await clientPromise;
        const db = client.db("en_crm");
        const users = db.collection("users");

        const user = await users.findOne({ email: credentials.email });
        if (!user) throw new Error("Invalid email or password");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid email or password");

        // set online + lastLogin on sign-in
        await users.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date(), isActive: true, lastSeen: new Date() } }
        );

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (token?.role) session.user.role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
