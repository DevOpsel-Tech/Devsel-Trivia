import { apiRequest } from "./http";
// Datos públicos de un participante. Nunca contiene el email ni credenciales
export type GamePlayer = {
  userId: number;
  displayName: string;
  turnOrder: number;
  score: number; //Puntuación única no revela una ronda incompleta.
  isReady: boolean;
  isCreator: boolean;
};

//Cada tarjeta de GET /api/me/games
export type GameHistoryItem = {
  id: number;
  mode: "INDIVIDUAL" | "MULTIPLAYER";
  status: "WAITING" | "ACTIVE" | "FINISHED";
  code: string | null;
  createdAt: string; //ISO 8601
  finishedAt: string | null; //ISO 8601
  score: number;
  players: GamePlayer[];
  winnerUserId: number | null; //null si no hay ganador
  isDraw: boolean; //true si hay empate
};

// La respuesta completa de GET /api/me/games
type GameHistoryResponse = {
  items: GameHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
};
/* Obtiene la página de partidos del usuario autenticado
apirequest añade Authorization: Bearer "token"*/
export function getMyGames(token: string, page = 1, pageSize = 20) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest<GameHistoryResponse>(`/api/me/games?${query}`, {
    token,
  });
}
// Datos que devuelve POST /api/games al crear una sala multijugador.
export type CreatedMultiplayerGame = {
  id: number;
  status: "WAITING";
  code: string;
};

// Crea una sola y envía  el token para auteticar la petición.
export function createMultiplayerGame(token: string) {
  return apiRequest<CreatedMultiplayerGame>("/api/games", {
    method: "POST",
    token,
    body: { mode: "MULTIPLAYER" },
  });
}
export function joinMultiplayerGame(token: string, code: string) {
  return apiRequest<{ id: number; status: string }>("/api/games/join", {
    method: "POST",
    token,
    body: { code },
  });
}

export function deleteWaitingGame(token: string, gameId: number) {
  return apiRequest<void>(`/api/games/${gameId}`, {
    method: "DELETE",
    token,
  });
}

export type GameDetails = {
  id: number;
  status: "WAITING" | "ACTIVE" | "FINISHED";
  mode: "MULTIPLAYER";
  code: string | null;
  turnVersion: number; //Incrementa cada vez que un jugador responde o se une a la partida.
  createdAt: string; //ISO 8601
  finishedAt: string | null; //ISO 8601
  score: number; //Puntuación única no revela una ronda incompleta.
  nextQuestionId: number | null; // null si no hay más preguntas
  players: GamePlayer[];
  winnerUserId: number | null; //null si no hay ganador
  isDraw: boolean; //true si hay empate
  currentTurn: {
    userId: number;
    turnOrder: number;
    gameQuestionId: number;
  } | null;
  questions: {
    id: number;
    position: number;
    statement: string;
    answered: boolean;
    answeredCount: number;
    revealed: boolean;
    results:
      | {
          userId: number;
          isCorrect: boolean;
        }[]
      | null;
    choices: {
      id: number;
      text: string;
      position: number;
    }[];
  }[];
};
export function getGame(token: string, gameId: number) {
  return apiRequest<GameDetails>(`/api/games/${gameId}`, { token });
}

export function startMultiplayerGame(token: string, gameId: number) {
  return apiRequest<{
    id: number;
    status: "WAITING" | "ACTIVE";
    started: boolean;
  }>(`/api/games/${gameId}/start`, { method: "POST", token });
}
export function submitAnswer(
  token: string,
  gameId: number,
  gameQuestionId: number,
  choiceId: number,
) {
  return apiRequest<{ roundComplete: boolean }>(
    `/api/games/${gameId}/answers`,
    {
      method: "POST",
      token,
      body: { gameQuestionId, choiceId },
    },
  );
}
