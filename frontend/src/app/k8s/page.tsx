"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function K8sRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/infra/k8s");
  }, [router]);
  return null;
}
