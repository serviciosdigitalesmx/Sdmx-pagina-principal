"use client";

import { useEffect } from 'react';

export function SaveOnboardingToken({ token }: { token?: string }) {
  useEffect(() => {
    if (token) {
      window.localStorage.setItem('auth_token', token);
    }
  }, [token]);

  return null;
}
