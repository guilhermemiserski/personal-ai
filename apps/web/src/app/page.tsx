"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeRedirectSkeleton } from "@/components/skeleton";
import { api } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
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
