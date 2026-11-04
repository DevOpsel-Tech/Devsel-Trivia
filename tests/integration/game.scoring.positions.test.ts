/* Reproducción del caso de puntuación con PostgreSQL real (trivia_test).
   La partida congela posiciones 1..4 y la solución debe usar la misma
   convención. En particular, CO2 en posición 3 tiene que puntuar. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.js";
import { submitAnswer } from "../../src/services/game.services.js";
import { asegurarBaseDePruebas } from "./helpers/db-guard.js";

asegurarBaseDePruebas(process.env.DATABASE_URL);

let userId = 0;
let gameId = 0;
let gameQuestionId = 0;
let carbonDioxideChoiceId = 0;

beforeAll(async () => {
  const stamp = `${Date.now()}-${Math.random()}`;
  const user = await prisma.user.create({
    data: {
      email: `score-position-${stamp}@test.local`,
      passwordHash: "not-used-by-this-test",
      displayName: "Prueba puntuación",
    },
  });
  userId = user.id;

  const game = await prisma.game.create({
    data: {
      players: { create: { userId, isCreator: true, turnOrder: 1 } },
      questions: {
        create: [0, 1, 2, 3, 4].map((position) => ({
          position,
          statement:
            position === 0
              ? "¿Qué gas necesitan las plantas para la fotosíntesis?"
              : `Pregunta de relleno ${position}`,
          // Misma escala que GameChoice.position: 1..4, no findIndex 0..3.
          solution: 3,
          choices: {
            create: [
              { text: "Oxígeno", position: 1 },
              { text: "Nitrógeno", position: 2 },
              {
                text:
                  position === 0
                    ? "Dióxido de carbono"
                    : "Respuesta correcta inequívoca",
                position: 3,
              },
              { text: "Helio", position: 4 },
            ],
          },
        })),
      },
    },
    include: { questions: { include: { choices: true } } },
  });

  gameId = game.id;
  const firstQuestion = game.questions.find((question) => question.position === 0);
  if (!firstQuestion) throw new Error("No se creó la primera pregunta de prueba");
  gameQuestionId = firstQuestion.id;

  const carbonDioxide = firstQuestion.choices.find(
    (choice) => choice.text === "Dióxido de carbono" && choice.position === 3,
  );
  if (!carbonDioxide) throw new Error("No se creó la opción de CO2 de prueba");
  carbonDioxideChoiceId = carbonDioxide.id;
});

afterAll(async () => {
  asegurarBaseDePruebas(process.env.DATABASE_URL);
  if (gameId) await prisma.game.delete({ where: { id: gameId } });
  if (userId) await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("puntuación con posiciones 1..4", () => {
  it("puntúa CO2 en posición 3 cuando la solución congelada es 3", async () => {
    const result = await submitAnswer(
      gameId,
      userId,
      gameQuestionId,
      carbonDioxideChoiceId,
    );

    expect(result).toEqual({
      ok: true,
      mode: "INDIVIDUAL",
      gameQuestionId,
      isCorrect: true,
      score: 1,
      finished: false,
    });
  });
});
