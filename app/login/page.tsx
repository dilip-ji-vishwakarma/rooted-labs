import { Suspense } from "react";
import { PageBase } from "./toolkit/page-base";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Rooted Labs Platform",
};

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageBase />
    </Suspense>
  );
}
