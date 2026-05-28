"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeRedirectSkeleton } from "@/components/skeleton";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .me()
      .then((user) => {
        if (!user.onboarding_completed) {
          router.replace("/onboarding");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  return <HomeRedirectSkeleton />;
}
