import { Button, Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import {
  Gamepad2,
  FileText,
  Trophy,
  CheckCircle,
  Rocket,
  CircleDotDashed,
  Lightbulb
} from "lucide-react";
import RuleCard from "./RuleCard";

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function RulesModal(props: Props) {
  return (
    <Modal {...props} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2">
            Como jogar o Jogo do Dicionário
          </h2>
          <p className="text-base text-foreground-500 font-normal italic">
            Prepare-se para uma mistura de criatividade e blefe!
          </p>
        </ModalHeader>

        <ModalBody className="pb-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} />
                Objetivo do jogo
              </h4>
              <p className="text-foreground-700">
                Seu objetivo é <strong>descobrir a definição verdadeira</strong> entre várias opções e
                <strong> enganar os outros</strong> com suas definições falsas mais convincentes.
              </p>
            </div>

            <Divider />

            <div className="flex flex-col gap-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Gamepad2 size={20} />
                Como funciona
              </h4>

              <div className="flex flex-col gap-4">
                <RuleCard title="Escolha da palavra" number={1} color="primary">
                  O host escolhe uma palavra misteriosa entre opções do dicionário.
                  Ninguém sabe o que ela significa - a não ser o dicionário!
                </RuleCard>
                <RuleCard title="Crie sua definição falsa" number={2} color="secondary">
                  Agora é hora de ser criativo! Invente uma definição que pareça real e convincente.
                  Quanto mais acreditável, melhor.
                </RuleCard>
                <RuleCard title="Hora da votação" number={3} color="warning">
                  Todas as definições (falsas + a verdadeira) aparecem embaralhadas.
                  Vote na que você acha que é a definição real.
                </RuleCard>
                <RuleCard title="Revelação e pontuação" number={4} color="success">
                  Hora da verdade! Descubra quem acertou, quem foi enganado e quem foram os mestres do blefe.
                </RuleCard>
              </div>
            </div>

            <Divider />

            <div className="flex flex-col gap-3">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Trophy size={20} />
                Sistema de pontuação
              </h4>
              <div className="p-6 rounded-lg border border-primary-200">
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>Acertou a definição verdadeira?</strong> Você ganha um ponto!</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleDotDashed size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>Alguém votou na sua definição falsa?</strong> Você também ganha um ponto!</span>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            <div className="flex flex-col gap-3">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb size={20} />
                Dicas para se dar bem
              </h4>
              <ul className="grid gap-2 text-sm list-disc">
                <li className="ms-6">
                  Observe o <strong>estilo das definições reais</strong> - elas costumam ser mais técnicas
                </li>
                <li className="ms-6">
                  Nas suas falsas, <strong>misture verdade com ficção</strong> - fica mais convincente
                </li>
                <li className="ms-6">
                  Se a palavra parece familiar, <strong>desconfie da definição mais óbvia</strong>
                </li>
                <li className="ms-6">
                  Palavras muito estranhas geralmente têm <strong>definições simples</strong>
                </li>
              </ul>
            </div>

            {/* <div className="bg-warning-50 border border-warning-200 p-4 rounded-lg">
              <p className="text-sm text-warning-800 flex items-start gap-2">
                <AlertCircle size={16} className="text-warning-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Lembre-se:</strong> O jogo fica mais divertido quando todo mundo participa!
                  Não tenha medo de ser criativo e se divertir com as palavras malucas.
                </span>
              </p>
            </div> */}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="primary" onPress={props.onClose} startContent={<Rocket size={16} />}>
            Entendi, vamos jogar!
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}