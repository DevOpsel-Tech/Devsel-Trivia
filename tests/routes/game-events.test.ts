import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { gameRouter } from "../../src/routes/games.routes.js";
import {
  confirmGameReady,
  createMultiplayerGame,
  deleteWaitingGame,
  joinGame,
  submitAnswer,
} from "../../src/services/game.services.js";
import { prisma } from "../../src/lib/prisma.js";

const { emit, to } = vi.hoisted(() => {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  return { emit, to };
});

vi.mock("../../src/sockets/index.js", () => ({
  io: { to },
  refreshPresenceForOnlineUsers: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/services/game.services.js", () => ({
  confirmGameReady: vi.fn(),
  createGame: vi.fn(),
  createMultiplayerGame: vi.fn(),
  deleteWaitingGame: vi.fn(),
  getGameById: vi.fn(),
  getMyGames: vi.fn(),
  joinGame: vi.fn(),
  startGame: vi.fn(),
  submitAnswer: vi.fn(),
}));

vi.mock("../../src/lib/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    game: { findUnique: vi.fn() },
  },
}));

const app = express();
app.use(express.json());
app.use("/api/games", gameRouter);

function tokenDe(userId = 1) {
  return jwt.sign({}, process.env.JWT_SECRET!, {
    algorithm: "HS256",
    subject: String(userId),
    expiresIn: "1h",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "secreto-de-prueba";
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1 } as never);
});

describe("eventos de partidas", () => {
  it("notifica la creación en la sala privada del creador con fecha ISO", async () => {
    const createdAt = new Date("2026-11-05T10:00:00.000Z");
    vi.mocked(createMultiplayerGame).mockResolvedValue({
      id: 12,
      mode: "MULTIPLAYER",
      status: "WAITING",
      code: "ABCDEF",
      createdAt,
    } as never);

    const response = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${tokenDe(1)}`)
      .send({ mode: "MULTIPLAYER" });

    expect(response.status).toBe(201);
    expect(to).toHaveBeenCalledWith("user:1");
    expect(emit).toHaveBeenCalledWith("game:created", {
      id: 12,
      mode: "MULTIPLAYER",
      status: "WAITING",
      code: "ABCDEF",
      createdAt: "2026-11-05T10:00:00.000Z",
    });
  });

  it("notifica la unión al jugador y actualiza la sala existente", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 2 } as never);
    vi.mocked(joinGame).mockResolvedValue({
      ok: true,
      game: { id: 12, status: "WAITING", turnVersion: 0 },
    } as never);
    vi.mocked(prisma.game.findUnique).mockResolvedValue({
      id: 12,
      status: "WAITING",
      turnVersion: 0,
    } as never);

    const response = await request(app)
      .post("/api/games/join")
      .set("Authorization", `Bearer ${tokenDe(2)}`)
      .send({ code: "ABCDEF" });

    expect(response.status).toBe(200);
    expect(to).toHaveBeenCalledWith("game:12");
    expect(emit).toHaveBeenNthCalledWith(1, "game:updated", {
      id: 12,
      status: "WAITING",
      turnVersion: 0,
    });
    expect(to).toHaveBeenCalledWith("user:2");
    expect(emit).toHaveBeenNthCalledWith(2, "game:joined", {
      id: 12,
      status: "WAITING",
      turnVersion: 0,
    });
  });

  it("notifica el inicio con estado ACTIVE y la nueva versión", async () => {
    vi.mocked(confirmGameReady).mockResolvedValue({
      ok: true,
      started: true,
      game: { id: 12, status: "ACTIVE", turnVersion: 1 },
    } as never);

    const response = await request(app)
      .post("/api/games/12/start")
      .set("Authorization", `Bearer ${tokenDe(1)}`);

    expect(response.status).toBe(200);
    expect(to).toHaveBeenCalledWith("game:12");
    expect(emit).toHaveBeenCalledWith("game:updated", {
      id: 12,
      status: "ACTIVE",
      turnVersion: 1,
    });
  });

  it.each([
    ["ACTIVE", 4],
    ["FINISHED", 10],
  ] as const)(
    "notifica el turno/resultado con status %s sin incluir respuestas",
    async (status, turnVersion) => {
      vi.mocked(submitAnswer).mockResolvedValue({
        ok: true,
        mode: "MULTIPLAYER",
        gameQuestionId: 55,
        roundComplete: true,
        finished: status === "FINISHED",
        nextTurn: null,
      } as never);
      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 12,
        status,
        turnVersion,
      } as never);

      const response = await request(app)
        .post("/api/games/12/answers")
        .set("Authorization", `Bearer ${tokenDe(1)}`)
        .send({ gameQuestionId: 55, choiceId: 99 });

      expect(response.status).toBe(200);
      expect(to).toHaveBeenCalledWith("game:12");
      expect(emit).toHaveBeenCalledWith("game:updated", {
        id: 12,
        status,
        turnVersion,
      });
      expect(emit.mock.calls[0][1]).not.toHaveProperty("results");
      expect(emit.mock.calls[0][1]).not.toHaveProperty("solution");
    },
  );

  it("notifica la eliminación con el payload existente", async () => {
    vi.mocked(deleteWaitingGame).mockResolvedValue({ ok: true });

    const response = await request(app)
      .delete("/api/games/12")
      .set("Authorization", `Bearer ${tokenDe(1)}`);

    expect(response.status).toBe(204);
    expect(to).toHaveBeenCalledWith("game:12");
    expect(emit).toHaveBeenCalledWith("game:deleted", { id: 12 });
  });
});
