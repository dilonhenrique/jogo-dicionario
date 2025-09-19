"use client";

import { ToastProvider as HeroToastProvider } from "@heroui/react";

export default function ToastProvider() {
  return (
    <HeroToastProvider placement="bottom-center" toastProps={{ shouldShowTimeoutProgress: true }} />
  )
}