"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfiguratorRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/analytics/configurator");
  }, [router]);
  return null;
}
