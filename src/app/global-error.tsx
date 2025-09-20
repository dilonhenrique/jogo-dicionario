"use client";

import PageContainer from "@/lib/components/ui/Container/PageContainer";

export default function ErrorPage() {
  return (
    <PageContainer className="text-center items-center justify-center h-dvh">
      <h1>Ops!</h1>
      <p>Algo deu errado...</p>
    </PageContainer>
  )
}