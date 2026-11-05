import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { env } from "../config/env";

type AvailablePlayer = {
  userId: number;
  displayName: string;
  status: "AVAILABLE";
};

type PresenceChange = {
  userId: number;
  displayName: string;
  status: "AVAILABLE" | "IN_GAME" | "OFFLINE";
};

type IncomingInvite = {
  inviteId: string;
  from: { userId: number; displayName: string };
  expiresAt: string;
};

type OutgoingInvite = {
  inviteId: string;
  receiverName: string;
  expiresAt: string;
};

type InviteAck =
  | { ok: true; inviteId: string; expiresAt?: string; gameId?: number; status?: "WAITING" }
  | { ok: false; error: string };

type OnlinePlayersProps = {
  token: string;
  onOpenGame: (gameId: number) => void;
  onRefreshHistory: () => void;
};

const PRESENCE_LIMIT = 50;

const inviteErrorMessages: Record<string, string> = {
  SELF_INVITE: "No puedes invitarte a ti mismo.",
  USER_NOT_AVAILABLE: "Ese jugador ya no está disponible.",
  OUTGOING_INVITE_PENDING: "Ya tienes una invitación pendiente.",
  INVITE_ALREADY_PENDING: "Ya hay una invitación pendiente entre vosotros.",
  INVITE_RATE_LIMITED: "Has alcanzado el límite de invitaciones. Prueba más tarde.",
  TOO_MANY_PENDING_INVITES: "El jugador ya tiene demasiadas invitaciones pendientes.",
  INVITE_NOT_FOUND: "La invitación ya no está disponible.",
  NOT_INVITE_RECIPIENT: "No puedes responder a esa invitación.",
  NOT_INVITE_SENDER: "No puedes cancelar esa invitación.",
  INVITE_EXPIRED: "La invitación ha caducado.",
  INVITE_NOT_PENDING: "La invitación ya no está pendiente.",
  INVITE_UNAVAILABLE: "La invitación ya no está disponible.",
  VALIDATION_ERROR: "Los datos de la invitación no son válidos.",
  CONFLICT: "No se pudo completar la invitación por un cambio de estado.",
  INTERNAL_ERROR: "No se pudo completar la invitación. Inténtalo de nuevo.",
};

function inviteErrorMessage(code: string) {
  return inviteErrorMessages[code] ?? "No se pudo completar la invitación.";
}

function mergePlayer(players: AvailablePlayer[], player: AvailablePlayer) {
  const index = players.findIndex((current) => current.userId === player.userId);
  if (index < 0) return [...players, player].sort((a, b) => a.displayName.localeCompare(b.displayName));
  return players.map((current) => (current.userId === player.userId ? player : current));
}

function getRemainingTime(expiresAt: string, now: number) {
  const seconds = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function OnlinePlayers({ token, onOpenGame, onRefreshHistory }: OnlinePlayersProps) {
  const socketRef = useRef<Socket | null>(null);
  const acceptedGamesRef = useRef(new Set<number>());
  const lastRequestWasFirstPageRef = useRef(true);
  const requestPresenceRef = useRef<(cursor?: number) => void>(() => undefined);
  const [players, setPlayers] = useState<AvailablePlayer[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presenceError, setPresenceError] = useState("");
  const [notice, setNotice] = useState("");
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [outgoingInvite, setOutgoingInvite] = useState<OutgoingInvite | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (incomingInvites.length === 0 && !outgoingInvite) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [incomingInvites.length, outgoingInvite]);

  useEffect(() => {
    const socket = io(env.socketUrl, { auth: { token } });
    socketRef.current = socket;

    const requestPresence = (cursor?: number) => {
      setIsLoading(true);
      lastRequestWasFirstPageRef.current = cursor === undefined;
      if (cursor === undefined) setPresenceError("");
      socket.emit("presence:request", cursor === undefined ? { limit: PRESENCE_LIMIT } : { limit: PRESENCE_LIMIT, cursor });
    };
    requestPresenceRef.current = requestPresence;
    const requestFirstPage = () => requestPresence();
    const onPresenceAvailable = (payload: { items: AvailablePlayer[]; nextCursor: number | null }) => {
      setPlayers((current) => {
        const incoming = payload.items.filter((player) => player.status === "AVAILABLE");
        return lastRequestWasFirstPageRef.current ? incoming : incoming.reduce(mergePlayer, current);
      });
      setNextCursor(payload.nextCursor);
      setIsLoading(false);
      setPresenceError("");
    };
    const onPresenceChanged = (player: PresenceChange) => {
      if (player.status === "AVAILABLE") {
        setPlayers((current) =>
          mergePlayer(current, { ...player, status: "AVAILABLE" }),
        );
        return;
      }
      setPlayers((current) => current.filter((currentPlayer) => currentPlayer.userId !== player.userId));
    };
    const onPresenceError = (payload: { message: string }) => {
      setPresenceError(payload.message || "No se pudo cargar la presencia.");
      setIsLoading(false);
    };
    const onInvite = (invite: IncomingInvite) => {
      setIncomingInvites((current) =>
        current.some((item) => item.inviteId === invite.inviteId) ? current : [...current, invite],
      );
    };
    const removeInvite = (inviteId: string) => {
      setIncomingInvites((current) => current.filter((invite) => invite.inviteId !== inviteId));
      setOutgoingInvite((current) => (current?.inviteId === inviteId ? null : current));
      setBusyInviteId((current) => (current === inviteId ? null : current));
    };
    const onInviteAccepted = (payload: { inviteId: string; gameId: number; status: "WAITING" }) => {
      removeInvite(payload.inviteId);
      onRefreshHistory();
      if (!acceptedGamesRef.current.has(payload.gameId)) {
        acceptedGamesRef.current.add(payload.gameId);
        onOpenGame(payload.gameId);
      }
    };
    const onInviteRejected = (payload: { inviteId: string }) => {
      setOutgoingInvite((current) => {
        if (current?.inviteId === payload.inviteId) setNotice("La invitación fue rechazada.");
        return current?.inviteId === payload.inviteId ? null : current;
      });
      setIncomingInvites((current) => current.filter((invite) => invite.inviteId !== payload.inviteId));
      setBusyInviteId((current) => (current === payload.inviteId ? null : current));
    };
    const onInviteCancelled = (payload: { inviteId: string }) => {
      removeInvite(payload.inviteId);
      setNotice("La invitación se ha cancelado.");
    };
    const onInviteExpired = (payload: { inviteId: string }) => {
      removeInvite(payload.inviteId);
      setNotice("La invitación ha caducado.");
    };

    socket.on("connect", requestFirstPage);
    socket.on("presence:available", onPresenceAvailable);
    socket.on("presence:changed", onPresenceChanged);
    socket.on("presence:error", onPresenceError);
    socket.on("game:invite", onInvite);
    socket.on("game:invite:accepted", onInviteAccepted);
    socket.on("game:invite:rejected", onInviteRejected);
    socket.on("game:invite:cancelled", onInviteCancelled);
    socket.on("game:invite:expired", onInviteExpired);

    return () => {
      socket.off("connect", requestFirstPage);
      socket.off("presence:available", onPresenceAvailable);
      socket.off("presence:changed", onPresenceChanged);
      socket.off("presence:error", onPresenceError);
      socket.off("game:invite", onInvite);
      socket.off("game:invite:accepted", onInviteAccepted);
      socket.off("game:invite:rejected", onInviteRejected);
      socket.off("game:invite:cancelled", onInviteCancelled);
      socket.off("game:invite:expired", onInviteExpired);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      requestPresenceRef.current = () => undefined;
    };
  }, [onOpenGame, onRefreshHistory, token]);

  useEffect(() => {
    const expiredIncoming = incomingInvites.filter((invite) => new Date(invite.expiresAt).getTime() <= now);
    if (expiredIncoming.length > 0) {
      const expiredIds = new Set(expiredIncoming.map((invite) => invite.inviteId));
      setIncomingInvites((current) => current.filter((invite) => !expiredIds.has(invite.inviteId)));
    }
  }, [incomingInvites, now]);

  function emitInvite(event: "game:invite:send" | "game:invite:accept" | "game:invite:reject" | "game:invite:cancel", payload: Record<string, string | number>) {
    return new Promise<InviteAck>((resolve) => {
      if (!socketRef.current) {
        resolve({ ok: false, error: "INTERNAL_ERROR" });
        return;
      }
      socketRef.current.emit(event, payload, (ack: InviteAck) => resolve(ack));
    });
  }

  async function handleSendInvite(player: AvailablePlayer) {
    setNotice("");
    setBusyInviteId(`send-${player.userId}`);
    const ack = await emitInvite("game:invite:send", { receiverId: player.userId });
    setBusyInviteId(null);
    if (!ack.ok || !ack.expiresAt) {
      setNotice(inviteErrorMessage(ack.ok ? "INTERNAL_ERROR" : ack.error));
      return;
    }
    setOutgoingInvite({ inviteId: ack.inviteId, receiverName: player.displayName, expiresAt: ack.expiresAt });
    setNotice("Invitación enviada.");
  }

  async function handleInviteAction(event: "game:invite:accept" | "game:invite:reject" | "game:invite:cancel", inviteId: string) {
    setNotice("");
    setBusyInviteId(inviteId);
    const ack = await emitInvite(event, { inviteId });
    if (!ack.ok) {
      setBusyInviteId(null);
      setNotice(inviteErrorMessage(ack.error));
      return;
    }
    if (event !== "game:invite:accept") {
      setIncomingInvites((current) => current.filter((invite) => invite.inviteId !== inviteId));
      setOutgoingInvite((current) => (current?.inviteId === inviteId ? null : current));
    }
    setBusyInviteId(null);
  }

  const currentInvite = incomingInvites[0];
  const outgoingExpired = outgoingInvite && new Date(outgoingInvite.expiresAt).getTime() <= now;

  return (
    <section className="mt-6 rounded-xl border border-[#2B2B2B] bg-[#0D0D0D] p-4" aria-busy={isLoading}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#A3E635]">JUGADORES ONLINE</p>
          <p className="mt-1 text-sm text-[#A3A3A3]">Invita a alguien disponible a una sala privada.</p>
        </div>
        <button type="button" onClick={() => requestPresenceRef.current()} className="text-sm font-semibold text-[#A3E635] hover:text-[#BEF264]">
          Actualizar
        </button>
      </div>

      {presenceError && <p className="mt-3 text-sm text-amber-200" role="alert">{presenceError} <button type="button" onClick={() => requestPresenceRef.current()} className="underline">Reintentar</button></p>}
      {notice && <p className="mt-3 text-sm text-[#D4D4D4]" role="status">{notice}</p>}

      <ul className="mt-4 space-y-2" aria-label="Jugadores disponibles">
        {players.map((player) => (
          <li key={player.userId} className="flex items-center justify-between gap-3 rounded-lg border border-[#2B2B2B] bg-[#141414] px-3 py-2">
            <span className="min-w-0 truncate text-sm font-semibold"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#A3E635]" />{player.displayName}</span>
            <button type="button" onClick={() => void handleSendInvite(player)} disabled={busyInviteId !== null || outgoingInvite !== null} className="shrink-0 rounded-lg border border-[#A3E635] px-3 py-1.5 text-sm font-semibold text-[#A3E635] disabled:cursor-not-allowed disabled:opacity-50">
              {busyInviteId === `send-${player.userId}` ? "Enviando…" : "Invitar"}
            </button>
          </li>
        ))}
      </ul>
      {!isLoading && !presenceError && players.length === 0 && <p className="mt-4 text-sm text-[#A3A3A3]">Ahora mismo no hay jugadores disponibles.</p>}
      {nextCursor !== null && <button type="button" disabled={isLoading} onClick={() => requestPresenceRef.current(nextCursor)} className="mt-4 rounded-lg border border-[#3D3D3D] px-3 py-2 text-sm font-semibold text-[#D4D4D4] disabled:opacity-60">{isLoading ? "Cargando…" : "Ver más jugadores"}</button>}

      {outgoingInvite && !outgoingExpired && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#A3E635]/35 bg-[#A3E635]/10 p-3" role="status"><span className="text-sm">Invitación enviada a <strong>{outgoingInvite.receiverName}</strong> · caduca en {getRemainingTime(outgoingInvite.expiresAt, now)}</span><button type="button" disabled={busyInviteId === outgoingInvite.inviteId} onClick={() => void handleInviteAction("game:invite:cancel", outgoingInvite.inviteId)} className="text-sm font-semibold text-[#A3E635] underline disabled:opacity-60">Cancelar</button></div>}

      {currentInvite && new Date(currentInvite.expiresAt).getTime() > now && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="invite-title"><div className="w-full max-w-sm rounded-2xl border border-[#A3E635]/50 bg-[#141414] p-6 shadow-2xl"><p className="text-xs font-bold tracking-[0.18em] text-[#A3E635]">INVITACIÓN PRIVADA</p><h3 id="invite-title" className="mt-3 text-xl font-black">{currentInvite.from.displayName} quiere jugar contigo</h3><p className="mt-2 text-sm text-[#A3A3A3]">La invitación caduca en {getRemainingTime(currentInvite.expiresAt, now)}.</p><div className="mt-6 flex gap-3"><button type="button" disabled={busyInviteId === currentInvite.inviteId} onClick={() => void handleInviteAction("game:invite:accept", currentInvite.inviteId)} className="rounded-lg bg-[#A3E635] px-4 py-2 text-sm font-bold text-[#090909] disabled:opacity-60">Aceptar</button><button type="button" disabled={busyInviteId === currentInvite.inviteId} onClick={() => void handleInviteAction("game:invite:reject", currentInvite.inviteId)} className="rounded-lg border border-[#3D3D3D] px-4 py-2 text-sm font-semibold disabled:opacity-60">Rechazar</button></div></div></div>}
    </section>
  );
}
