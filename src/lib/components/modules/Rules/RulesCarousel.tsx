"use client";

import { useState, useEffect } from "react";
import { Button, cn, Progress } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMotionValue, animate } from "framer-motion";

const rulesData = [
  {
    id: 1,
    title: "Escolha da palavra",
    description: "O host escolhe uma palavra misteriosa entre opções do dicionário. Ninguém sabe o que ela significa - a não ser o dicionário!",
    color: "bg-primary-100 text-primary-500",
    bgColor: "bg-gradient-to-br from-primary-50 to-primary-100"
  },
  {
    id: 2,
    title: "Crie sua definição falsa",
    description: "Agora é hora de ser criativo! Invente uma definição que pareça real e convincente. Quanto mais acreditável, melhor.",
    color: "bg-secondary-100 text-secondary",
    bgColor: "bg-gradient-to-br from-secondary-50 to-secondary-100"
  },
  {
    id: 3,
    title: "Hora da votação",
    description: "Todas as definições (falsas + a verdadeira) aparecem embaralhadas. Vote na que você acha que é a definição real.",
    color: "bg-warning-100 text-warning",
    bgColor: "bg-gradient-to-br from-warning-50 to-warning-100"
  },
  {
    id: 4,
    title: "Revelação e pontuação",
    description: "Hora da verdade! Descubra quem acertou, quem foi enganado e quem foram os mestres do blefe.",
    color: "bg-success-100 text-success",
    bgColor: "bg-gradient-to-br from-success-50 to-success-100"
  }
];

type Props = {
  autoplayInterval?: number;
  className?: string;
}

export default function RulesCarousel({ autoplayInterval = 8000, className }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);
  const [progress, setProgress] = useState(0);

  const progressValue = useMotionValue(0);

  useEffect(() => {
    if (!isAutoplayActive) {
      progressValue.set(0);
      setProgress(0);
      return;
    }

    const controls = animate(progressValue, 100, {
      duration: autoplayInterval / 1000,
      ease: "linear",
      onUpdate: (latest) => setProgress(latest),
      onComplete: () => {
        progressValue.set(0);
        setProgress(0);
        setCurrentSlide((prev) => (prev + 1) % rulesData.length);
      }
    });

    return () => controls.stop();
  }, [autoplayInterval, isAutoplayActive, currentSlide, progressValue]);

  const goToSlide = (index: number) => {
    progressValue.set(0);
    setProgress(0);
    setCurrentSlide(index);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 10000);
  };

  const goToPrevious = () => {
    progressValue.set(0);
    setProgress(0);
    setCurrentSlide((prev) => (prev - 1 + rulesData.length) % rulesData.length);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 10000);
  };

  const goToNext = () => {
    progressValue.set(0);
    setProgress(0);
    setCurrentSlide((prev) => (prev + 1) % rulesData.length);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 10000);
  };

  const currentRule = rulesData[currentSlide];

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <div className={cn("rounded-xl p-8 h-[280px] flex flex-col overflow-hidden justify-center relative transition-all duration-500 ease-in-out", currentRule.bgColor)}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <p className={cn("rounded-full p-2 transition-transform duration-300 hover:scale-105 w-10 h-10 flex items-center justify-center text-xl font-bold", currentRule.color)}>
                {currentRule.id}
              </p>
              <h4 className={cn(currentRule.color, "text-lg md:text-xl font-semibold bg-transparent")}>
                {currentRule.title}
              </h4>
            </div>

            <p className="text-sm md:text-base text-foreground-700 leading-relaxed">
              {currentRule.description}
            </p>
          </div>

          <Progress
            size="sm"
            classNames={{
              base: "absolute bottom-0 right-0 left-0",
              indicator: "bg-transparent backdrop-brightness-150",
              track: "bg-transparent",
            }}
            value={progress}
            maxValue={100}
            disableAnimation
            color="default"
            aria-label="Tempo restante para próximo slide"
          />
        </div>

        <Button
          isIconOnly
          variant="flat"
          radius="full"
          size="sm"
          className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all duration-200"
          onPress={goToPrevious}
        >
          <ChevronLeft size={16} />
        </Button>

        <Button
          isIconOnly
          variant="flat"
          radius="full"
          size="sm"
          className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all duration-200"
          onPress={goToNext}
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {rulesData.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn("w-3 h-3 rounded-full transition-all duration-300 cursor-pointer hover:scale-110",
              index === currentSlide
                ? "bg-primary scale-110 shadow-lg"
                : "bg-foreground-300 hover:bg-foreground-400"
            )}
            aria-label={`Ir para etapa ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}