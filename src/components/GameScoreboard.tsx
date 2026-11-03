import type { GamePlayer } from "../api/games";

type GameScoreboardProps = {
  currentPlayer?: GamePlayer;
  opponent?: GamePlayer;
  opponentName: string;
};

// Muestra únicamente las puntuaciones públicas calculadas por el backend.
export function GameScoreboard({
  currentPlayer,
  opponent,
  opponentName,
}: GameScoreboardProps) {
  return (
    <section className="mt-6 rounded-xl border border-[#2B2B2B] bg-[#0D0D0D] p-4">
      <p className="text-xs font-bold tracking-wide text-[#A3A3A3]">
        MARCADOR
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <p className="rounded-lg border border-[#A3E635]/40 bg-[#A3E635]/10 px-3 py-2 text-sm">
          Tú ({currentPlayer?.displayName ?? "Cargando…"}):{" "}
          <strong>{currentPlayer?.score ?? 0} puntos</strong>
        </p>
        <p className="rounded-lg border border-[#3D3D3D] px-3 py-2 text-sm text-[#D4D4D4]">
          {opponentName}: <strong>{opponent?.score ?? 0} puntos</strong>
        </p>
      </div>
      <p className="mt-3 text-xs text-[#A3A3A3]">
        Solo se muestran los puntos de rondas ya cerradas por ambos jugadores.
      </p>
    </section>
  );
}
