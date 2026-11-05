/* Sala de partida: muestra estado y permite jugar. */

import { useEffect, useState, type FormEvent } from "react";
import {
  createIndividualGame,
  createMultiplayerGame,
  deleteWaitingGame,
  getMyGames,
  joinMultiplayerGame,
  type GameHistoryItem,
} from "../api/games";
import { apiRequest, ApiError } from "../api/http";

type GameLobbyProps = {
  token: string;
  userId: number;
  displayName: string;
  onDisplayNameUpdated: (newDisplayName: string) => void;
  onLogout: () => void;
  onOpenGame: (gameId: number) => void;
  onAuthenticationError: () => void;
};

// "ALL" no filtra; Los otros estados son los mismos que devuelve el backend.
type GameStatusFilter = "ALL" | GameHistoryItem["status"];

const statusFilters: { value: GameStatusFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "WAITING", label: "En espera" },
  { value: "ACTIVE", label: "En curso" },
  { value: "FINISHED", label: "Finalizadas" },
];

export function GameLobby({
  token,
  userId,
  displayName,
  onDisplayNameUpdated,
  onLogout,
  onOpenGame,
  onAuthenticationError,
}: GameLobbyProps) {
  const [games, setGames] = useState<GameHistoryItem[]>([]);
  // Filtro seleccionado por el usuario. Se conserva al actualizar o paginar.
  const [selectedStatus, setSelectedStatus] = useState<GameStatusFilter>("ALL");
  // El backend pagina el historial; así no se pierden las partidas antiguas.
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  //Evitar crear varias salas mientras la petición está pendiente
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingIndividual, setIsCreatingIndividual] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState("");
  const [profileName, setProfileName] = useState(displayName);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = profileName.trim();

    if (normalizedName.length < 2 || normalizedName.length > 30) {
      setError("El nombre debe tener entre 2 y 30 caracteres.");
      return;
    }

    setError("");
    setIsSavingProfile(true);
    try {
      const response = await apiRequest<{ user: { displayName: string } }>(
        "/api/me",
        {
          method: "PATCH",
          token,
          body: { displayName: normalizedName },
        },
      );
      onDisplayNameUpdated(response.user.displayName);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onAuthenticationError();
        return;
      }
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo actualizar el nombre.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  useEffect(() => {
    // Evita actualizar el componente si el usuario sale durante la petición.
    let isCancelled = false;

    async function loadGames() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getMyGames(token, page, pageSize);

        if (!isCancelled) {
          setGames(response.items);
          setTotal(response.total);
        }
      } catch (requestError) {
        if (!isCancelled) {
          if (requestError instanceof ApiError && requestError.status === 401) {
            onAuthenticationError();
            return;
          }
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "No se pudieron cargar tus partidas. Revisa la conexión.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadGames();

    return () => {
      isCancelled = true;
    };
  }, [onAuthenticationError, page, reloadKey, token]);

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
    } catch {
      setError(
        "No se pudo copiar el código. Selecciónalo y cópialo manualmente.",
      );
    }
  }
  async function handleCreateRoom() {
    setError("");
    setIsCreating(true);
    try {
      await createMultiplayerGame(token);

      //Actualizamos el historial para incluir la sala reciente creada.
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onAuthenticationError();
        return;
      }
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo crear la sala. Revisa la conexión e inténntalo de nuevo.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCreateIndividualGame() {
    setError("");
    setIsCreatingIndividual(true);

    try {
      const game = await createIndividualGame(token);
      // La partida individual nace activa, así que abrimos directamente su turno.
      onOpenGame(game.id);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onAuthenticationError();
        return;
      }
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo crear la partida individual.",
      );
    } finally {
      setIsCreatingIndividual(false);
    }
  }

  async function handleJoinRoom() {
    setError("");
    setIsJoining(true);

    try {
      const game = await joinMultiplayerGame(token, joinCode.trim());
      setJoinCode("");
      onOpenGame(game.id);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onAuthenticationError();
        return;
      }
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo entrar en la sala.",
      );
    } finally {
      setIsJoining(false);
    }
  }

  async function handleDeleteGame(gameId: number) {
    if (
      !window.confirm(
        "¿Quieres eliminar esta sala? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setError("");
    setDeletingGameId(gameId);
    try {
      await deleteWaitingGame(token, gameId);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onAuthenticationError();
        return;
      }
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo eliminar la sala. Revisa la conexión e inténtalo de nuevo.",
      );
    } finally {
      setDeletingGameId(null);
    }
  }

  function getStatusLabel(status: GameHistoryItem["status"]) {
    if (status === "WAITING") return "Esperando rival";
    if (status === "ACTIVE") return "En curso";
    return "Finalizada";
  }
  // El backend entrega fechas ISO, el navegador las presenta en la zona local
  function formatDate(value: string) {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }
  function getPlayerLabel(player: GameHistoryItem["players"][number]) {
    // Se identifica a uno mismo sin depender un email
    return player.userId === userId
      ? `Tú(${player.displayName})`
      : player.displayName;
  }

  function getFinalResult(game: GameHistoryItem) {
    if (game.status !== "FINISHED") return null;
    if (game.mode === "INDIVIDUAL")
      return `Resultado propio: ${game.score} puntos`;
    if (game.isDraw) return "Empate";
    return game.winnerUserId === userId ? "Ganaste" : "Perdiste";
  }
  // No modificamos los datos recibidos: solo decidimos qué tarjetas mostrar.
  const visibleGames =
    selectedStatus === "ALL"
      ? games
      : games.filter((game) => game.status === selectedStatus);

  return (
    <section className="ambient-card relative z-10 rounded-3xl border border-[#2B2B2B] bg-[#141414] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black">Tus partidas</h2>

        <button
          type="button"
          onClick={onLogout}
          className="text-sm font-semibold text-[#A3A3A3] hover:text-[#A3E635]"
        >
          Cerrar sesión
        </button>
      </div>
      <form
        onSubmit={handleProfileSubmit}
        className="mt-4 flex flex-wrap items-end gap-2"
      >
        <label className="text-sm text-[#A3A3A3]">
          Tu nombre público
          <input
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            minLength={2}
            maxLength={30}
            required
            className="mt-1 block rounded-lg border border-[#3D3D3D] bg-[#0D0D0D] px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="submit"
          disabled={isSavingProfile}
          className="rounded-lg border border-[#A3E635] px-4 py-2 text-sm font-semibold text-[#A3E635] disabled:opacity-60"
        >
          {isSavingProfile ? "Guardando…" : "Guardar nombre"}
        </button>
      </form>
      {/* Filtros visuales del historial. */}
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Filtrar partidas">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setSelectedStatus(filter.value)}
            aria-pressed={selectedStatus === filter.value}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
              selectedStatus === filter.value
                ? "border-[#A3E635] bg-[#A3E635]/10 text-[#A3E635]"
                : "border-[#3D3D3D] text-[#A3A3A3] hover:border-[#A3E635]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="mr-1 w-full text-xs font-bold tracking-[0.18em] text-[#A3A3A3] sm:w-auto">
            CREAR PARTIDA
          </p>
        <button
          type="button"
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="rounded-lg bg-[#A3E635] px-4 py-2 text-sm font-bold text-[#090909] disabled:cursor-wait disabled:opacity-60"
        >
          {isCreating ? "Creando sala…" : "Crear sala"}
        </button>

        <button
          type="button"
          onClick={handleCreateIndividualGame}
          disabled={isCreatingIndividual}
          className="rounded-lg border border-[#A3E635] px-4 py-2 text-sm font-bold text-[#A3E635] disabled:cursor-wait disabled:opacity-60"
        >
          {isCreatingIndividual ? "Creando partida…" : "Jugar en solitario"}
        </button>
        </div>

        <div className="rounded-xl border border-[#2B2B2B] bg-[#0D0D0D] p-4">
          <p className="text-xs font-bold tracking-[0.18em] text-[#A3A3A3]">
            UNIRSE A UNA SALA
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          placeholder="Código de sala"
          maxLength={32}
          className="min-w-0 flex-1 rounded-lg border border-[#3D3D3D] bg-[#141414] px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={handleJoinRoom}
          disabled={isJoining || joinCode.trim().length === 0}
          className="rounded-lg border border-[#A3E635] px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isJoining ? "Entrando…" : "Unirse"}
        </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={isLoading}
            className="rounded-lg border border-[#3D3D3D] px-4 py-2 text-sm font-semibold text-[#A3A3A3] hover:border-[#A3E635] hover:text-[#F8FAFC] disabled:opacity-60"
          >
            {isLoading ? "Cargando…" : "Actualizar partidas"}
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && visibleGames.length === 0 && (
        <p className="mt-6 text-sm text-[#A3A3A3]">
          {games.length === 0
            ? "Todavía no tienes partidas."
            : "No hay partidas de este estado en esta página."}
        </p>
      )}

      {visibleGames.length > 0 && (
        <ul className="mt-6 space-y-3">
          {visibleGames.map((game) => (
            <li
              key={game.id}
              className="ambient-card rounded-xl border border-[#2B2B2B] bg-[#0D0D0D] p-4"
            >
              <p className="font-semibold">Partida #{game.id}</p>

              <p className="mt-1 text-sm text-[#A3A3A3]">
                {getStatusLabel(game.status)} · Creada el{" "}
                {formatDate(game.createdAt)}
              </p>

              <p className="mt-1 text-sm text-[#A3A3A3]">
                Tus puntos: {game.score}
              </p>

              {game.mode === "MULTIPLAYER" && (
                <ul className="mt-3 space-y-1 text-sm text-[#D4D4D4]">
                  {game.players.map((player) => (
                    <li key={player.userId}>
                      {getPlayerLabel(player)} · {player.score} puntos
                      {game.status === "WAITING" &&
                        ` · ${player.isReady ? "Preparado" : "Pendiente de confirmar"}`}
                    </li>
                  ))}
                </ul>
              )}

              {game.status === "WAITING" && game.code && (
                <p className="mt-3 text-sm text-[#A3E635]">
                  Código de invitación: <strong>{game.code}</strong>
                  <button
                    type="button"
                    onClick={() => void handleCopyCode(game.code!)}
                    className="ml-3 underline"
                  >
                    {copiedCode === game.code ? "Copiado" : "Copiar"}
                  </button>
                </p>
              )}

              {getFinalResult(game) && (
                <p className="mt-3 font-bold text-[#A3E635]">
                  {getFinalResult(game)}
                </p>
              )}

              <button
                type="button"
                onClick={() => onOpenGame(game.id)}
                className="mt-3 rounded-lg border border-[#A3E635] px-4 py-2 text-sm font-semibold text-[#A3E635]"
              >
                {game.status === "FINISHED" ? "Ver resultado" : "Abrir sala"}
              </button>

              {/* Solo el creador ve la acción; el backend vuelve a comprobar el permiso. */}
              {game.status === "WAITING" &&
                game.players.some(
                  (player) => player.userId === userId && player.isCreator,
                ) && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteGame(game.id)}
                    disabled={deletingGameId !== null}
                    className="ml-3 rounded-lg border border-red-400/70 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-60"
                  >
                    {deletingGameId === game.id
                      ? "Eliminando…"
                      : "Eliminar sala"}
                  </button>
                )}
            </li>
          ))}
        </ul>
      )}

      {total > pageSize && (
        <nav
          className="mt-6 flex items-center justify-between"
          aria-label="Paginación de partidas"
        >
          <button
            type="button"
            onClick={() => setPage((current) => current - 1)}
            disabled={page === 1 || isLoading}
            className="rounded-lg border border-[#3D3D3D] px-4 py-2 text-sm disabled:opacity-60"
          >
            Anterior
          </button>
          <span className="text-sm text-[#A3A3A3]">
            Página {page} de {Math.ceil(total / pageSize)}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={page * pageSize >= total || isLoading}
            className="rounded-lg border border-[#3D3D3D] px-4 py-2 text-sm disabled:opacity-60"
          >
            Siguiente
          </button>
        </nav>
      )}
    </section>
  );
}
