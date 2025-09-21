"use client";

import { Button, Divider } from "@heroui/react";
import { useState } from "react";
import CreateRoomForm from "@/lib/components/modules/Room/CreateRoomForm";
import GoToRoomForm from "@/lib/components/modules/Room/GoToRoomForm";
import RulesCarousel from "@/lib/components/modules/Rules/RulesCarousel";
import PageContainer from "@/lib/components/ui/Container/PageContainer";

export default function HomePage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <PageContainer>
      <h1 className="text-center">
        Jogo do dicionário
      </h1>

      <RulesCarousel className="mb-8 mt-4" />

      <div className="flex flex-col gap-2">
        <h4>Já tem o código?</h4>
        <GoToRoomForm />
      </div>

      <div className="flex gap-4 items-center w-full">
        <div className="grow">
          <Divider />
        </div>
        <p className="text-foreground-500 text-sm">OU</p>
        <div className="grow">
          <Divider />
        </div>
      </div>

      {!showCreateForm ? (
        <Button
          color="primary"
          onPress={() => setShowCreateForm(true)}
        >
          Criar sala
        </Button>
      ) : (
        <CreateRoomForm onCancel={() => setShowCreateForm(false)} />
      )}
    </PageContainer>
  )
}