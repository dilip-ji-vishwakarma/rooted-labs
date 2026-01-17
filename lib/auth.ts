/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);
const SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function saveSession(prop: any) {
  // Create the session
  const expires = new Date(Date.now() + SESSION_AGE_MS);
  const session = await encrypt({ user: prop, expires });

  // Save the session in a cookie
  (
    await // Save the session in a cookie
    cookies()
  ).set("session", session, { expires, httpOnly: true });
  (
    await // Save the session in a cookie
    cookies()
  ).set("session-local", session, { expires, httpOnly: false });
}

export async function destroySession() {
  const cookieStore = await cookies();

  const expired = new Date(0);

  cookieStore.set("session", "", {
    expires: expired,
    httpOnly: true,
    path: "/",
  });

  cookieStore.set("session-local", "", {
    expires: expired,
    httpOnly: false,
    path: "/",
  });
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + SESSION_AGE_MS);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}
