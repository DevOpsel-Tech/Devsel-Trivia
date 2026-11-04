import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/lib/prisma.js";
import * as gameQueries from "../../src/services/game.queries.js";
import { initSockets, io } from "../../src/sockets/index.js";
import { gameRouter } from "../../src/routes/games.routes.js";
import { asegurarBaseDePruebas } from "./helpers/db-guard.js";

const PREFIJO = `scoring-proof-${Date.now()}`;
const JWT_SECRET_PRUEBA = "solo-para-pruebas-de-integracion";
const JWT_SECRET_ANTERIOR = process.env.JWT_SECRET;
const ENUNCIADO_OBJETIVO = `[${PREFIJO}] ¿Cuánto es 2 + 2?`;

asegurarBaseDePruebas(process.env.DATABASE_URL);
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
initSockets(createServer());

const app = express();
app.use(express.json());
app.use("/api/games", gameRouter);

const idsUsuarios: number[] = [];
const idsPartidas: number[] = [];
const idsPreguntas: number[] = [];
let idCategoria: number | undefined;
let userId = 0;
let preguntasCatalogo: Awaited<ReturnType<typeof prisma.question.create>>[];

function tokenDe(id: number) {
  return jwt.sign({}, JWT_SECRET_PRUEBA, {
    algorithm: "HS256",
    subject: String(id),
    expiresIn: "1h",
  });
}

async function limpiarDatosDePrueba() {
  asegurarBaseDePruebas(process.env.DATABASE_URL);
  if (idsPartidas.length) {
    await prisma.game.deleteMany({ where: { id: { in: idsPartidas } } });
  }
  if (idsPreguntas.length) {
    await prisma.question.deleteMany({ where: { id: { in: idsPreguntas } } });
  }
  if (idCategoria) {
    await prisma.category.deleteMany({ where: { id: idCategoria } });
    idCategoria = undefined;
  }
  if (idsUsuarios.length) {
    await prisma.user.deleteMany({ where: { id: { in: idsUsuarios } } });
  }
  idsPartidas.length = 0;
  idsPreguntas.length = 0;
  idsUsuarios.length = 0;
}

beforeAll(async () => {
  await limpiarDatosDePrueba();
  const category = await prisma.category.create({
    data: { name: `${PREFIJO}-category` },
  });
  idCategoria = category.id;

  const user = await prisma.user.create({
    data: {
      email: `${PREFIJO}@test.local`,
      passwordHash: "not-used-by-this-test",
      displayName: "Prueba puntuación",
    },
  });
  userId = user.id;
  idsUsuarios.push(user.id);

  const definiciones = [
    { statement: "¿Capital de Francia?", correct: "París" },
    { statement: "¿Planeta rojo?", correct: "Marte" },
    { statement: "¿Cuántos lados tiene un triángulo?", correct: "Tres" },
    { statement: "¿Qué estrella ilumina la Tierra?", correct: "El Sol" },
    { statement: ENUNCIADO_OBJETIVO, correct: "4" },
  ];
  const preguntas = [];
  for (const [index, definition] of definiciones.entries()) {
    const options =
      index === definiciones.length - 1
        ? ["3", "4", "5", "6"]
        : [definition.correct, "Opción incorrecta A", "Opción incorrecta B", "Opción incorrecta C"];
    const question = await prisma.question.create({
      data: {
        statement: definition.statement.startsWith("[")
          ? definition.statement
          : `[${PREFIJO}] ${definition.statement}`,
        categoryId: category.id,
        choices: {
          create: options.map((text, position) => ({
            text,
            position: position + 1,
            isCorrect: text === definition.correct,
          })),
        },
      },
      include: { choices: { orderBy: { position: "asc" } } },
    });
    idsPreguntas.push(question.id);
    expect(question.choices).toHaveLength(4);
    expect(question.choices.map((choice) => choice.position)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(question.choices.filter((choice) => choice.isCorrect)).toHaveLength(1);
    preguntas.push(question);
  }
  preguntasCatalogo = preguntas;

  // createGame conserva su lógica real; el test controla únicamente la selección aleatoria.
  vi.spyOn(gameQueries, "getRandomQuestions").mockResolvedValue(preguntasCatalogo);
});

afterAll(async () => {
  vi.restoreAllMocks();
  await limpiarDatosDePrueba();
  io?.close();
  if (JWT_SECRET_ANTERIOR === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = JWT_SECRET_ANTERIOR;
  }
  await prisma.$disconnect();
});

describe("POST /api/games/:id/answers: evidencia de puntuación", () => {
  it("puntúa la opción correcta y no puntúa una incorrecta en partidas nuevas", async () => {
    const token = tokenDe(userId);
    const preguntaCatalogoObjetivo = preguntasCatalogo.find(
      (question) => question.statement === ENUNCIADO_OBJETIVO,
    );
    expect(preguntaCatalogoObjetivo).toBeDefined();
    if (!preguntaCatalogoObjetivo) throw new Error("Falta pregunta objetivo");

    console.info(
      "EVIDENCIA_CATALOGO",
      JSON.stringify({
        questionId: preguntaCatalogoObjetivo.id,
        statement: preguntaCatalogoObjetivo.statement,
        choices: preguntaCatalogoObjetivo.choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          position: choice.position,
          isCorrect: choice.isCorrect,
        })),
      }),
    );

    for (const elegirCorrecta of [true, false]) {
      const createResponse = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${token}`)
        .send({ mode: "INDIVIDUAL" });
      expect(createResponse.status).toBe(201);
      const gameId = createResponse.body.id as number;
      idsPartidas.push(gameId);

      const game = await prisma.game.findUniqueOrThrow({
        where: { id: gameId },
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { choices: { orderBy: { position: "asc" } } },
          },
        },
      });
      expect(game.questions).toHaveLength(5);
      const gameQuestion = game.questions.find(
        (question) => question.questionId === preguntaCatalogoObjetivo.id,
      );
      expect(gameQuestion).toBeDefined();
      if (!gameQuestion) throw new Error("La partida no copió la pregunta objetivo");
      expect(gameQuestion.statement).toBe(preguntaCatalogoObjetivo.statement);
      expect(gameQuestion.choices).toHaveLength(4);

      const solutionCatalog = preguntaCatalogoObjetivo.choices.find(
        (choice) => choice.isCorrect,
      );
      const solutionCopy = gameQuestion.choices.find(
        (choice) => choice.position === gameQuestion.solution,
      );
      expect(solutionCatalog).toBeDefined();
      expect(gameQuestion.solution).toBe(solutionCatalog?.position);
      expect(solutionCopy?.text).toBe(solutionCatalog?.text);

      console.info(
        "EVIDENCIA_COPIA",
        JSON.stringify({
          case: elegirCorrecta ? "correcta" : "incorrecta",
          gameId,
          gameQuestion: {
            id: gameQuestion.id,
            questionId: gameQuestion.questionId,
            statement: gameQuestion.statement,
            position: gameQuestion.position,
            solution: gameQuestion.solution,
            choices: gameQuestion.choices.map((choice) => ({
              id: choice.id,
              text: choice.text,
              position: choice.position,
              isSolution: choice.position === gameQuestion.solution,
            })),
          },
        }),
      );

      let targetResponse: request.Response | undefined;
      for (const question of game.questions) {
        const isTarget = question.id === gameQuestion.id;
        const choice = isTarget
          ? question.choices.find((candidate) =>
              elegirCorrecta
                ? candidate.position === question.solution
                : candidate.position !== question.solution,
            )
          : question.choices.find(
              (candidate) => candidate.position !== question.solution,
            );
        if (!choice) throw new Error("No hay una opción apropiada para la prueba");

        const response = await request(app)
          .post(`/api/games/${gameId}/answers`)
          .set("Authorization", `Bearer ${token}`)
          .send({ gameQuestionId: question.id, choiceId: choice.id });
        expect(response.status).toBe(200);
        if (isTarget) {
          targetResponse = response;
          const persisted = await prisma.answer.findUniqueOrThrow({
            where: { gameQuestionId_userId: { gameQuestionId: question.id, userId } },
            include: { choice: true },
          });
          const finalState = await prisma.game.findUniqueOrThrow({
            where: { id: gameId },
            include: { players: { where: { userId } } },
          });
          console.info(
            "EVIDENCIA_RESULTADO",
            JSON.stringify({
              case: elegirCorrecta ? "correcta" : "incorrecta",
              request: { gameQuestionId: question.id, choiceId: choice.id },
              http: {
                status: response.status,
                isCorrect: response.body.isCorrect,
                score: response.body.score,
                finished: response.body.finished,
              },
              answer: {
                id: persisted.id,
                gameQuestionId: persisted.gameQuestionId,
                choiceId: persisted.choiceId,
                choiceText: persisted.choice.text,
                isCorrect: persisted.isCorrect,
              },
              finalGame: {
                status: finalState.status,
                score: finalState.players[0]?.score,
              },
            }),
          );
          expect(persisted.choiceId).toBe(choice.id);
          expect(persisted.isCorrect).toBe(elegirCorrecta);
          expect(finalState.status).toBe("FINISHED");
          expect(finalState.players[0]?.score).toBe(elegirCorrecta ? 1 : 0);
        }
      }

      expect(targetResponse?.body).toMatchObject({
        gameQuestionId: gameQuestion.id,
        isCorrect: elegirCorrecta,
        score: elegirCorrecta ? 1 : 0,
        finished: true,
      });
      expect(await prisma.answer.count({ where: { gameQuestionId: { in: game.questions.map((q) => q.id) }, userId } })).toBe(5);
    }
  });
});