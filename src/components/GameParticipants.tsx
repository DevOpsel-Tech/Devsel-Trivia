import type { GamePlayer } from "../api/games";

type GameParticipantsProps = {
  currentPlayer?: GamePlayer;
  opponent?: GamePlayer;
};

// Presenta quién está en la sala y el estado de preparación de cada persona.
export function GameParticipants({
  currentPlayer,
  opponent,
}: GameParticipantsProps) {
  return (
    <div className="rounded-xl border border-[#2B2B2B] bg-[#0D0D0D] p-4 text-sm">
      <p>
        Tú ({currentPlayer?.displayName ?? "Cargando…"}):{" "}
        {currentPlayer?.isReady ? "Preparado" : "Sin confirmar"}
      </p>
      <p className="mt-1 text-[#A3A3A3]">
        {opponent
          ? `${opponent.displayName}: ${opponent.isReady ? "Preparado" : "Sin confirmar"}`
          : "Falta que entre tu rival."}
      </p>
    </div>
  );
}
