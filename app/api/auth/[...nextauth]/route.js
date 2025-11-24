import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from '@/utils/dbConnect';
import { User } from "@/models/User";
import { Admin } from "@/models/Admin";
import bcrypt from "bcryptjs";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await dbConnect();
        if (!credentials?.email || !credentials?.password) return null;
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        // Return a plain object that will be persisted on JWT
        return { id: user._id.toString(), email: user.email, name: user.name || "" };
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    // Attach role (admin/user) into the token and session
    async jwt({ token, user, account }) {
      // first sign-in (credentials provider returned user) -> attach id/email
      if (user) {
        token.id = user.id || user.sub || token.id;
        token.email = user.email || token.email;
      }
      // For Google sign-ins, token contains email in token.email after profile
      // Ensure we have email set
      if (account?.provider === "google" && !token.email && user?.email) {
        token.email = user.email;
        token.id = user.id || user.sub;
      }

      // Determine role by checking Admin collection
      if (token.email) {
        try {
          await dbConnect();
          const admin = await Admin.findOne({ email: token.email }).lean();
          token.role = admin ? "admin" : "user";
        } catch (e) {
          token.role = token.role || "user";
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = session.user || {};
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.role = token.role || "user";
      return session;
    },

    // signIn callback: allow sign-in
    async signIn({ user, account, profile }) {
      // allow all signins — role resolution is in jwt callback
      return true;
    }
  },

  pages: {
    signIn: "/login", // your custom login page route
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
