"ts-nocheck";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import UserModel from "../../server/models/User.js";
import bcrypt from "bcryptjs";
import connectDB from "./connectDB";
import jwt from "jsonwebtoken";

const authOptions: NextAuthOptions = {
   providers: [
      GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
         authorization: {
            params: {
               prompt: "consent",
               access_type: "offline",
               response_type: "code",
            },
         },
      }),
      CredentialsProvider({
         name: "Credentials",
         credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
         },
         async authorize(credentials) {
            await connectDB();

            const user = await UserModel.findOne({ email: credentials?.email });

            if (!user) {
               throw new Error("No user found with this email");
            }

            const isValid = await bcrypt.compare(
               credentials?.password || "",
               user.password
            );
            if (!isValid) {
               throw new Error("Invalid password");
            }

            // Generate a custom access token for your separate backend
            const accessToken = jwt.sign(
               {
                  userId: user._id.toString(),
                  email: user.email,
                  role: user.role,
               },
               process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!,
               { expiresIn: "30d" } // Short expiration for access token
            );

            return {
               id: user._id.toString(),
               name: user.username,
               role: user.role,
               email: user.email,
               image: user.image,
               accessToken, // Include the access token in the user object
            };
         },
      }),
   ],

   callbacks: {
      async jwt({ token, user, account }) {
         await connectDB();

         // If this is the first login, user will be defined
         if (user && account?.provider === "google") {
            // Check if user exists in DB
            let existingUser = await UserModel.findOne({ email: user.email });

            if (!existingUser) {
               const existingUser = await UserModel.create({
                  username: user.name,
                  email: user.email,
                  image: user.image,
                  role: "user", // or any default role
                  provider: "google",
               });

               token.id = existingUser._id.toString();
               token.role = existingUser.role;
            } else {
               token.id = existingUser._id.toString();
               token.role = existingUser.role;
            }
            const accessToken = jwt.sign(
               {
                  userId: existingUser._id.toString(),
                  email: existingUser.email,
                  role: existingUser.role,
               },
               process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!,
               { expiresIn: "30d" } // Short expiration for access token
            );

            token.name = user.name;
            token.email = user.email;
            token.image = user.image;
            token.provider = "google";
            token.accessToken = accessToken;
         }

         // Credentials login
         if (user && account?.provider === "credentials") {
            token.id = user.id;
            token.name = user.name;
            token.email = user.email;
            token.image = user.image;
            token.role = user.role;
            token.accessToken = user.accessToken;
            token.provider = "credentials";
         }

         return token;
      },

      async session({ session, token }) {
         session.accessToken = token.accessToken;

         if (session.user) {
            session.user.id = token.id;
            session.user.email = token.email;
            session.user.name = token.name;
            session.user.image = token.image;
            session.user.role = token.role;
            session.user.provider = token.provider;
            session.user.accessToken = token.accessToken; // Add accessToken to user object
         }

         return session;
      },
   },

   pages: {
      signIn: "/signin",
      error: "/error",
      newUser: "/signup", // Redirect here if new user
   },

   session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 days for the session
   },

   secret: process.env.NEXTAUTH_SECRET!,
   debug: process.env.NODE_ENV === "development",
};

export default authOptions;
