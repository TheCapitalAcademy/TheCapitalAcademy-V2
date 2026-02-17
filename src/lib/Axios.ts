import axios from "axios";
import { getServerSession } from "next-auth/next";
import { getSession, signOut } from "next-auth/react";
import authOptions from "./auth";
import { redirect } from "next/navigation";

// Create a custom Axios instance
const Axios = axios.create({
   baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
   headers: {
      "Content-Type": "application/json",
   },
   withCredentials: true,
});

// Add a request interceptor to include the token
Axios.interceptors.request.use(
   async (config) => {
      const isServer = typeof window === "undefined";

      // Cache session to avoid repeated getServerSession/getSession calls
      const session = isServer
         ? await getServerSession(authOptions)
         : await getSession();

      if (session?.accessToken) {
         config.headers.Authorization = `Bearer ${session.accessToken}`;
      }

      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

Axios.interceptors.response.use(
   (response) => response,
   (error) => {
      if (typeof window !== "undefined") {
         if (error.response?.status === 401) {
            console.warn("Unauthorized access - redirecting to signout");
            console.log("signout");
            window.location.href = "/signout";
         }
      }
      return Promise.reject(error);
   }
);

export default Axios;
