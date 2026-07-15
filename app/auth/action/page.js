"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "../../../components/auth/AuthCard";
import AlertBanner from "../../../components/auth/AlertBanner";

const ACTION_ROUTES = {
  verifyEmail: "/verify-email",
  resetPassword: "/reset-password",
};

function AuthActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const destination = ACTION_ROUTES[mode];

    if (!destination || !oobCode) {
      setError("This account-action link is invalid or incomplete. Request a new email and try again.");
      return;
    }

    const destinationParams = new URLSearchParams({ mode, oobCode });
    router.replace(`${destination}?${destinationParams.toString()}`);
  }, [router, searchParams]);

  return (
    <AuthCard title="UAAMS account action">
      {error ? (
        <AlertBanner variant="error">{error}</AlertBanner>
      ) : (
        <AlertBanner variant="info">Preparing your secure account action...</AlertBanner>
      )}
    </AuthCard>
  );
}

function AuthActionFallback() {
  return (
    <AuthCard title="UAAMS account action">
      <AlertBanner variant="info">Loading...</AlertBanner>
    </AuthCard>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={<AuthActionFallback />}>
      <AuthActionContent />
    </Suspense>
  );
}
