"use client";

import { useEffect } from 'react';
import { saveAuthToken } from '@/lib/auth-storage';

export function SaveOnboardingToken({ token }: { token?: string }) {
  useEffect(() => {
    if (token) {
      saveAuthToken(token);
    }
  }, [token]);

  return null;
}
