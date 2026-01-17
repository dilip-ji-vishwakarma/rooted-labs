/* eslint-disable @typescript-eslint/no-explicit-any */
import { destroySession } from "@/lib/auth";
import { getCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const KC_BASE = process.env.NEXT_PUBLIC_KC_BASE || "";
const REALM = process.env.NEXT_PUBLIC_KC_REALM || "";
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || "";

export const useSession = () => {
  const navigate = useRouter();
  // -------------------------
  // Decode session from cookie
  // -------------------------
  const decodeToken = () => {
    const token = getCookie("session-local");
    if (!token) return null;

    try {
      return jwtDecode(token as string);
    } catch (error) {
      console.log("Invalid token:", error);
      return null;
    }
  };

  // -------------------------
  // LOGIN → Keycloak
  // -------------------------
  const login = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    try {
      const url = `${KC_BASE}/realms/${REALM}/protocol/openid-connect/token`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "password",
          scope: "openid",
          client_id: CLIENT_ID,
          username,
          password,
        }),
      });

      if (!res.ok) {
        console.log("Keycloak login error:", await res.text());
        throw new Error("Login failed");
      }

      const data = await res.json(); // { access_token, refresh_token, ... }

      const decode_data: any = jwtDecode(data.access_token);

      const user_data = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        name: decode_data.name,
        username: decode_data.preferred_username,
        email: decode_data.email,
        exp: decode_data.exp,
        iat: decode_data.iat,
        id: decode_data.sub,
      };

      return { data: user_data };
    } catch (err) {
      console.error("Login Exception:", err);
      return { error: err };
    }
  };

  // -------------------------
  // LOGOUT → Keycloak
  // -------------------------
  const logout = async (url?: string) => {
    await destroySession();
    toast.success("Logged out");
    navigate.push(url || "/login");
  };

  return {
    session: decodeToken() as any,
    login,
    logout,
  };
};
