/* Prueba de integración para el historial de partidas (GET /api/me/games).

   Usa una base de datos REAL (trivia_test) para comprobar que el historial
   no revela información que no debe. Se ejecuta con:
     npm run test:integration

   Comprueba 4 cosas:
   1. Si solo respondió un jugador, el historial del otro no puede adivinar
      si acertó o falló (score: 0).
   2. Cuando ambos respondieron una ronda, cada uno ve solo sus propios aciertos.
   3. Cuando la partida termina, cada usuario ve su puntuación total,
      no la suma de los dos.
   4. El historial y el detalle de la partida (/api/games/:id) dan el mismo
      resultado para el mismo usuario. Ni uno ni el otro publican respuestas
      ni soluciones de rondas que aún no se han revelado. */

import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "node:http";
import { initSockets } from "../../src/sockets/index.js";
import { gameRouter } from "../../src/routes/games.routes.js";
import { meRouter } from "../../src/routes/me.routes.js";
import { prisma } from "../../src/lib/prisma.js";
import { asegurarBaseDePruebas } from "./helpers/db-guard.js";
initSockets(createServer());

asegurarBaseDePruebas(process.env.DATABASE_URL);

const app = express();
app.use(express.json());
app.use("/api/games", gameRouter);
app.use("/api/me", meRouter);

function tokenDe(userId: number) {
  return jwt.sign({}, process.env.JWT_SECRET!, {
    algorithm: "HS256",
    subject: String(userId),
    expiresIn: "1h",
  });
}

const idsUsuarios: number[] = [];
const idsPartidas: number[] = [];

async function limpiarBaseDeDatos() {
  asegurarBaseDePruebas(process.env.DATABASE_URL);
  if (idsPartidas.length > 0) {
    await prisma.game.deleteMany({ where: { id: { in: idsPartidas } } });
  }
  if (idsUsuarios.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: idsUsuarios } } });
  }
  idsPartidas.length = 0;
  idsUsuarios.length = 0;
}

async function crearEscenarioBase() {
  const usuarioA = await prisma.user.create({
    data: {
      email: `hist-a-${Date.now()}@test.com`,
      passwordHash: "x",
      displayName: "Ana",
    },
  });
  const usuarioB = await prisma.user.create({
    data: {
      email: `hist-b-${Date.now()}@test.com`,
      passwordHash: "x",
      displayName: "Luis",
    },
  });
  idsUsuarios.push(usuarioA.id, usuarioB.id);

  const partida = await prisma.game.create({
    data: {
      mode: "MULTIPLAYER",
      status: "ACTIVE",
      players: {
        create: [
          { userId: usuarioA.id, turnOrder: 1 },
          { userId: usuarioB.id, turnOrder: 2 },
        ],
      },
    },
  });
  idsPartidas.push(partida.id);

  return { usuarioA, usuarioB, partida };
}

async function crearPreguntaConOpciones(gameId: number, position: number) {
  const gameQuestion = await prisma.gameQuestion.create({
    data: {
      gameId,
      position,
      statement: `Pregunta de prueba ${position}`,
      solution: 0, // la opción correcta es la de position 0
      choices: {
        create: [
          { text: "Opción correcta", position: 0 },
          { text: "Opción incorrecta 1", position: 1 },
          { text: "Opción incorrecta 2", position: 2 },
          { text: "Opción incorrecta 3", position: 3 },
        ],
      },
    },
    include: { choices: true },
  });
  // solution = 0 → la opción correcta es la de position 0.
  const correcta = gameQuestion.choices.find((c) => c.position === 0);
  const incorrecta = gameQuestion.choices.find((c) => c.position === 1);
  return {
    gameQuestion,
    correctaId: correcta!.id,
    incorrectaId: incorrecta!.id,
  };
}

async function responder(
  gameQuestionId: number,
  userId: number,
  choiceId: number,
  isCorrect: boolean,
) {
  return prisma.answer.create({
    data: { gameQuestionId, userId, choiceId, isCorrect },
  });
}

beforeEach(limpiarBaseDeDatos);
afterAll(async () => {
  await limpiarBaseDeDatos();
  await prisma.$disconnect();
});

describe("GET /api/me/games — puntuación del usuario autenticado", () => {
  it("1. no revela el acierto del rival antes de que ambos respondan", async () => {
    const { usuarioA, usuarioB, partida } = await crearEscenarioBase();
    const { gameQuestion, correctaId } = await crearPreguntaConOpciones(
      partida.id,
      0,
    );

    await responder(gameQuestion.id, usuarioA.id, correctaId, true);

    const resB = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioB.id)}`);

    expect(resB.status).toBe(200);
    const itemB = resB.body.items.find((i: any) => i.id === partida.id);
    expect(itemB).toBeDefined();
    expect(itemB.score).toBe(0);

    const resA = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioA.id)}`);

    const itemA = resA.body.items.find((i: any) => i.id === partida.id);
    expect(itemA.score).toBe(0);

    const detalleB = await request(app)
      .get(`/api/games/${partida.id}`)
      .set("Authorization", `Bearer ${tokenDe(usuarioB.id)}`);

    expect(detalleB.status).toBe(200);
    expect(detalleB.body.questions[0].results).toBeNull();
    expect(detalleB.body.questions[0].revealed).toBe(false);
  });

  it("2. muestra solo aciertos propios tras completar la ronda", async () => {
    const { usuarioA, usuarioB, partida } = await crearEscenarioBase();
    const { gameQuestion, correctaId, incorrectaId } =
      await crearPreguntaConOpciones(partida.id, 0);

    await responder(gameQuestion.id, usuarioA.id, correctaId, true);
    await responder(gameQuestion.id, usuarioB.id, incorrectaId, false);

    const resA = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioA.id)}`);
    const resB = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioB.id)}`);

    const itemA = resA.body.items.find((i: any) => i.id === partida.id);
    const itemB = resB.body.items.find((i: any) => i.id === partida.id);

    expect(itemA.score).toBe(1);
    expect(itemB.score).toBe(0);

    expect(itemB.players).toEqual([
      {
        userId: usuarioA.id,
        displayName: "Ana",
        turnOrder: 1,
        isCreator: false,
        isReady: false,
        score: 1,
      },
      {
        userId: usuarioB.id,
        displayName: "Luis",
        turnOrder: 2,
        isCreator: false,
        isReady: false,
        score: 0,
      },
    ]);

    expect(itemB.players[0]).not.toHaveProperty("email");
    expect(itemB.players[0]).not.toHaveProperty("passwordHash");
  });

  it("3. muestra puntuación completa y distinta para cada usuario al terminar", async () => {
    const { usuarioA, usuarioB, partida } = await crearEscenarioBase();

    for (let i = 0; i < 5; i++) {
      const { gameQuestion, correctaId, incorrectaId } =
        await crearPreguntaConOpciones(partida.id, i);
      const aciertaA = i < 3;
      const aciertaB = i >= 3;

      await responder(
        gameQuestion.id,
        usuarioA.id,
        aciertaA ? correctaId : incorrectaId,
        aciertaA,
      );
      await responder(
        gameQuestion.id,
        usuarioB.id,
        aciertaB ? correctaId : incorrectaId,
        aciertaB,
      );
    }

    await prisma.game.update({
      where: { id: partida.id },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        winnerUserId: usuarioA.id,
      },
    });

    const resA = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioA.id)}`);
    const resB = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioB.id)}`);

    const itemA = resA.body.items.find((i: any) => i.id === partida.id);
    const itemB = resB.body.items.find((i: any) => i.id === partida.id);

    expect(itemA.score).toBe(3);
    expect(itemB.score).toBe(2);
    expect(itemA.winnerUserId).toBe(usuarioA.id);
    expect(itemB.winnerUserId).toBe(usuarioA.id);
    expect(itemA.isDraw).toBe(false);
    expect(itemB.isDraw).toBe(false);
  });

  it("4. identifica un empate sin inventar un ganador", async () => {
    const { usuarioA, usuarioB, partida } = await crearEscenarioBase();

    //Ambos fallan las cinco rondas: resultado final 0-0.
    for (let i = 0; i < 5; i++) {
      const { gameQuestion, incorrectaId } = await crearPreguntaConOpciones(
        partida.id,
        i,
      );
      await responder(gameQuestion.id, usuarioA.id, incorrectaId, false);
      await responder(gameQuestion.id, usuarioB.id, incorrectaId, false);
    }
    await prisma.game.update({
      where: { id: partida.id },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        winnerUserId: null,
      },
    });

    const historialA = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioA.id)}`);

    const historialB = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioB.id)}`);

    const itemA = historialA.body.items.find(
      (item: any) => item.id === partida.id,
    );
    const itemB = historialB.body.items.find(
      (item: any) => item.id === partida.id,
    );

    expect(itemA.score).toBe(0);
    expect(itemB.score).toBe(0);
    expect(itemA.winnerUserId).toBeNull();
    expect(itemB.winnerUserId).toBeNull();
    expect(itemA.isDraw).toBe(true);
    expect(itemB.isDraw).toBe(true);
  });

   it("5. devuelve una sala WAITING con código, creador y confirmaciones", async () => {
    const { usuarioA, usuarioB, partida } = await crearEscenarioBase();

    // Convertimos el escenario en una sala aún no iniciada.
    await prisma.game.update({
      where: { id: partida.id },
      data: {
        status: "WAITING",
        code: "ABCDEF",
      },
    });

    // A es creador y ya confirmó; B todavía no.
    await prisma.gamePlayer.update({
      where: {
        gameId_userId: {
          gameId: partida.id,
          userId: usuarioA.id,
        },
      },
      data: {
        isCreator: true,
        isReady: true,
      },
    });

    const response = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioA.id)}`);

    expect(response.status).toBe(200);

    const item = response.body.items.find(
      (game: any) => game.id === partida.id,
    );

    expect(item).toMatchObject({
      id: partida.id,
      mode: "MULTIPLAYER",
      status: "WAITING",
      code: "ABCDEF",
      score: 0,
      winnerUserId: null,
      isDraw: false,
      players: [
        {
          userId: usuarioA.id,
          displayName: "Ana",
          turnOrder: 1,
          isCreator: true,
          isReady: true,
          score: 0,
        },
        {
          userId: usuarioB.id,
          displayName: "Luis",
          turnOrder: 2,
          isCreator: false,
          isReady: false,
          score: 0,
        },
      ],
    });
  });


  it("6. historial y detalle coinciden para el mismo usuario y estado", async () => {
    const { usuarioA, usuarioB, partida } = await crearEscenarioBase();
    const { gameQuestion, correctaId, incorrectaId } =
      await crearPreguntaConOpciones(partida.id, 0);

    await responder(gameQuestion.id, usuarioA.id, correctaId, true);
    await responder(gameQuestion.id, usuarioB.id, incorrectaId, false);

    const historialA = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioA.id)}`);
    const detalleA = await request(app)
      .get(`/api/games/${partida.id}`)
      .set("Authorization", `Bearer ${tokenDe(usuarioA.id)}`);

    const historialB = await request(app)
      .get("/api/me/games")
      .set("Authorization", `Bearer ${tokenDe(usuarioB.id)}`);
    const detalleB = await request(app)
      .get(`/api/games/${partida.id}`)
      .set("Authorization", `Bearer ${tokenDe(usuarioB.id)}`);

    expect(historialA.status).toBe(200);
    expect(detalleA.status).toBe(200);
    expect(historialB.status).toBe(200);
    expect(detalleB.status).toBe(200);

    const itemA = historialA.body.items.find(
      (item: any) => item.id === partida.id,
    );
    const itemB = historialB.body.items.find(
      (item: any) => item.id === partida.id,
    );

    expect(itemA.score).toBe(detalleA.body.score);
    expect(itemB.score).toBe(detalleB.body.score);
    expect(itemA.score).toBe(1);
    expect(itemB.score).toBe(0);

    expect(detalleA.body.questions[0]).not.toHaveProperty("solution");
    expect(detalleA.body.questions[0]).not.toHaveProperty("answers");
    expect(detalleA.body.questions[0].revealed).toBe(true);
    expect(detalleA.body.questions[0].results).toHaveLength(2);
  });
});
