import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ApiError } from "../api/http";
import { env } from "../config/env";
import {
  getGame,
  startMultiplayerGame,
  submitAnswer,
  type GameDetails,
} from "../api/games";
type GameRoomProps = {
  gameId: number;
  onBack: () => void;
  token: string;
  userId: number;
  onAuthenticationError: () => void;
};

export function GameRoom({
  gameId,
  token,
  userId,
  onBack,
  onAuthenticationError,
}: GameRoomProps) {
  const [game, setGame] = useState<GameDetails | null>(null);
  // Impide que una respuesta HTTP más antigua reemplace un estado más reciente.
  const latestTurnVersion = useRef(-1);
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [isAnswerSending, setIsAnswerSending] = useState(false);
  const [socketNotice, setSocketNotice] = useState("");
  // Evita pulsar varias veces mientras recuperamos el estado de la partida.
  const [isRefreshingGame, setIsRefreshingGame] = useState(false);

  const loadGame = useCallback(async () => {
    try {
      const response = await getGame(token, gameId);
      if (response.turnVersion >= latestTurnVersion.current) {
        latestTurnVersion.current = response.turnVersion;
        setGame(response);
      }
      setError("");
      setSocketNotice("");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onAuthenticationError();
        return;
      }

      if (requestError instanceof ApiError && requestError.status === 404) {
        setError(
          "Esta sala fue eliminada por su creador. Volviendo a tus partidas…",
        );
        window.setTimeout(onBack, 1200);
        return;
      }

      if (!navigator.onLine) {
        setSocketNotice(
          "Sin conexión. Conservamos el estado actual y lo actualizaremos al reconectar.",
        );
        return;
      }

      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo cargar la partida.",
      );
    }
  }, [gameId, onAuthenticationError, onBack, token]);
  /* Recupera el snapshop persistido del backend tras un error
  LoadGame y atrata 401, 404, conexión y mensajes de API */

  async function handleRefreshGame() {
    setIsRefreshingGame(true);

    try {
      await loadGame();
    } finally {
      setIsRefreshingGame(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadGame);
  }, [loadGame]);

  useEffect(() => {
    function handleOnline() {
      setSocketNotice("Conexión recuperada. Actualizando la partida…");
      void loadGame();
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [loadGame]);

  useEffect(() => {
    const socket = io(env.socketUrl, {
      auth: { token },
    });

    function isAuthenticationSocketError(socketError: {
      message?: string;
      data?: unknown;
    }) {
      const data =
        typeof socketError.data === "object" && socketError.data !== null
          ? socketError.data
          : {};

      const status =
        "status" in data && typeof data.status === "number"
          ? data.status
          : undefined;

      const code =
        "code" in data && typeof data.code === "string" ? data.code : undefined;

      const message = socketError.message?.toLowerCase() ?? "";

      return (
        status === 401 ||
        code === "UNAUTHORIZED" ||
        code === "INVALID_TOKEN" ||
        code === "TOKEN_EXPIRED" ||
        message.includes("unauthorized") ||
        message.includes("jwt") ||
        message.includes("token")
      );
    }

    socket.on("connect", () => {
      setSocketNotice("Conexión recuperada. Actualizando la partida…");
      socket.emit("join:game", gameId);
    });

    socket.on("connect_error", (socketError) => {
      if (isAuthenticationSocketError(socketError)) {
        onAuthenticationError();
        return;
      }

      setSocketNotice("Se ha perdido la conexión. Reintentando conectar…");
    });

    socket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") {
        setSocketNotice("Se ha perdido la conexión. Reintentando conectar…");
      }
    });

    socket.on("joined:game", () => {
      setSelectedChoiceId(null);
      void loadGame();
    });

    socket.on("game:updated", (event: { turnVersion: number }) => {
      // Una unión puede conservar turnVersion. Recuperamos el snapshot
      // persistido también en ese caso; loadGame evita retroceder.
      if (event.turnVersion >= latestTurnVersion.current) {
        setSelectedChoiceId(null);
        void loadGame();
      }
    });

    socket.on("error:game", ({ message }: { message: string }) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [gameId, loadGame, onAuthenticationError, token]);

  /* Añadimos la acción de iniciar la sala, el bcak decide si el usuario puede hacerlo
si o es creador o falta un jugador, muestra error*/

  async function handleStart() {
    setError("");
    setIsStarting(true);

    try {
      await startMultiplayerGame(token, gameId);
      await loadGame();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onAuthenticationError();
        return;
      }
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo iniciar la partida",
      );
    } finally {
      setIsStarting(false);
    }
  }

  const currentQuestion = game?.questions.find(
    (question) => question.id === game.currentTurn?.gameQuestionId,
  );
  const totalQuestions = game?.questions.length ?? 0;
  const currentQuestionNumber = currentQuestion
    ? currentQuestion.position + 1
    : totalQuestions;

  const isYourTurn = game?.currentTurn?.userId === userId;
  const currentPlayer = game?.players.find(
    (player) => player.userId === userId,
  );
  const opponent = game?.players.find((player) => player.userId !== userId);
  const you = currentPlayer;
  const opponentName = opponent?.displayName ?? "tu rival";

  const finalMessage = game?.isDraw
    ? "Empate"
    : game?.winnerUserId === userId
      ? "Ganaste"
      : "Perdiste";

  async function handleAnswer(choiceId: number) {
    if (!currentQuestion || isAnswerSending) return;

    setError("");
    setSelectedChoiceId(choiceId);
    setIsAnswerSending(true);
    try {
      await submitAnswer(token, gameId, currentQuestion.id, choiceId);
      await loadGame();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onAuthenticationError();
        return;
      }
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo enviar la respuesta.",
      );
    } finally {
      setIsAnswerSending(false);
    }
  }

  return (
    <section className="ambient-card rounded-3xl border border-[#2B2B2B] bg-[#141414] p-4 shadow-2xl shadow-black/30 sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-[#A3A3A3] transition hover:text-[#A3E635]"
      >
        ← Volver
      </button>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black sm:text-2xl">Sala #{gameId}</h2>
        {game && (
          <span className="rounded-full border border-[#3D3D3D] bg-[#0D0D0D] px-3 py-1 text-xs font-bold text-[#A3E635]">
            {game.status}
          </span>
        )}
      </div>

      {error && (
        <div
          className="mt-5 rounded-lg bg-red-950/60 p-3 text-sm text-red-200"
          role="alert"
        >
          <p>{error}</p>

          {/* Recupera el estado antes de que el usuario vuelva a intentar una acción. */}
          <button
            type="button"
            onClick={() => void handleRefreshGame()}
            disabled={isRefreshingGame || isStarting || isAnswerSending}
            className="mt-3 rounded border border-red-200/60 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-900/50 disabled:cursor-wait disabled:opacity-60"
          >
            {isRefreshingGame ? "Actualizando…" : "Actualizar estado"}
          </button>
        </div>
      )}
      {socketNotice && (
        <p
          className="mt-5 rounded-lg border border-amber-400/40 bg-amber-950/30 p-3 text-sm text-amber-100"
          role="status"
        >
          {socketNotice}
        </p>
      )}

      {!error && !game && <p>Cargando sala…</p>}

      {game?.status === "WAITING" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-[#2B2B2B] bg-[#0D0D0D] p-4 text-sm">
            <p>
              Tú ({you?.displayName ?? "Cargando…"}):{" "}
              {you?.isReady ? "Preparado" : "Sin confirmar"}
            </p>
            <p className="mt-1 text-[#A3A3A3]">
              {opponent
                ? `${opponent.displayName}: ${opponent.isReady ? "Preparado" : "Sin confirmar"}`
                : "Falta que entre tu rival."}
            </p>
          </div>
          {currentPlayer?.isReady ? (
            <p className="text-sm text-[#A3A3A3]" role="status">
              Esperando a tu rival.
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                className="rounded-lg bg-[#A3E635] px-4 py-2 text-sm font-bold text-[#090909] transition hover:bg-[#BEF264] disabled:cursor-wait disabled:opacity-60"
              >
                {isStarting ? "Confirmando..." : "Prepararme"}
              </button>
            </>
          )}
        </div>
      )}

      {game?.status === "ACTIVE" && (
        <section className="mt-6 rounded-xl border border-[#2B2B2B] bg-[#0D0D0D] p-4">
          <p className="text-xs font-bold tracking-wide text-[#A3A3A3]">
            MARCADOR
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p className="rounded-lg border border-[#A3E635]/40 bg-[#A3E635]/10 px-3 py-2 text-sm">
              Tú ({you?.displayName ?? "Cargando…"}):{" "}
              <strong>{you?.score ?? 0} puntos</strong>
            </p>
            <p className="rounded-lg border border-[#3D3D3D] px-3 py-2 text-sm text-[#D4D4D4]">
              {opponentName}: <strong>{opponent?.score ?? 0} puntos</strong>
            </p>
          </div>
          <p className="mt-3 text-xs text-[#A3A3A3]">
            Solo se muestran los puntos de rondas ya cerradas por ambos jugadores.
          </p>
        </section>
      )}

      {game?.status === "ACTIVE" && currentQuestion && isYourTurn && (
        <article className="ambient-card mx-auto mt-6 max-w-xl rounded-2xl border border-[#2B2B2B] bg-[#0D0D0D] p-4 sm:p-6">
          <h3 className="text-lg font-bold text-[#A3E635]">Tu pregunta</h3>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            Pregunta {currentQuestionNumber} de {totalQuestions} · Tu turno
          </p>
          <p className="mt-3 text-base text-[#F8FAFC] sm:text-lg">
            {currentQuestion.statement}
          </p>

          <div className="mt-5 grid gap-3">
            {currentQuestion.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                disabled={isAnswerSending}
                onClick={() => handleAnswer(choice.id)}
                className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold transition sm:px-4 sm:text-base ${
                  selectedChoiceId === choice.id
                    ? "border-[#A3E635] bg-[#A3E635]/10 text-[#F8FAFC]"
                    : "border-[#3D3D3D] bg-[#141414] text-[#D4D4D4] hover:border-[#A3E635]"
                }`}
              >
                {choice.text}
              </button>
            ))}
          </div>

          {selectedChoiceId !== null && (
            <p className="mt-4 text-sm font-semibold text-[#A3E635]">
              Respuesta seleccionada.
            </p>
          )}
        </article>
      )}

      {game?.status === "ACTIVE" && !isYourTurn && (
        <p className="mt-6 text-center text-sm font-semibold text-[#A3A3A3]">
          Turno de {opponentName}. Esperando su respuesta…
        </p>
      )}

      {game?.status === "FINISHED" && (
        <section
          className="mt-6 rounded-xl border border-[#A3E635]/40 bg-[#A3E635]/10 p-5"
          role="status"
        >
          <h3 className="text-xl font-black text-[#A3E635]">{finalMessage}</h3>
          <p className="mt-3">
            Tú ({you?.displayName}): <strong>{you?.score ?? 0} puntos</strong>
          </p>
          <p className="mt-1">
            {opponentName}: <strong>{opponent?.score ?? 0} puntos</strong>
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-5 rounded-lg border border-[#A3E635] px-4 py-2 text-sm font-semibold text-[#A3E635]"
          >
            Volver a mis partidas
          </button>
        </section>
      )}
    </section>
  );
}
