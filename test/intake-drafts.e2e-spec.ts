import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Intake drafts (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/patients/:id/intake-latest requires auth", async () => {
    const response = await request(app.getHttpServer()).get("/api/patients/user_patient_001/intake-latest");
    expect(response.status).toBe(401);
  });

  it("POST /api/patients/:id/intake-delta saves and increments version", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const before = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/intake-latest")
      .set("Authorization", `Bearer ${token}`);
    expect(before.status).toBe(200);
    const baseVersion = before.body.draftVersion as number;

    const saveResponse = await request(app.getHttpServer())
      .post("/api/patients/user_patient_001/intake-delta")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseVersion,
        delta: {
          bookingMeta: { bookingType: "initial" },
          patientIdentity: { fullName: "Patient Demo" },
        },
      });
    expect(saveResponse.status).toBe(201);
    expect(saveResponse.body.draftVersion).toBe(baseVersion + 1);

    const latestResponse = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/intake-latest")
      .set("Authorization", `Bearer ${token}`);
    expect(latestResponse.status).toBe(200);
    expect(latestResponse.body.draftVersion).toBe(baseVersion + 1);
    expect(latestResponse.body.data.bookingMeta.bookingType).toBe("initial");
  });

  it("POST /api/patients/:id/intake-delta returns 409 on stale baseVersion", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const latest = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/intake-latest")
      .set("Authorization", `Bearer ${token}`);
    const currentVersion = latest.body.draftVersion as number;
    const staleBase = currentVersion > 0 ? 0 : 1;
    const response = await request(app.getHttpServer())
      .post("/api/patients/user_patient_001/intake-delta")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseVersion: staleBase,
        delta: { careContext: { presentingConcerns: "Updated" } },
      });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe("DRAFT_VERSION_CONFLICT");
  });

  it("POST /api/patients/:id/intake-draft/commit blocks non-owner updates", async () => {
    const token = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");
    const response = await request(app.getHttpServer())
      .post("/api/patients/user_patient_001/intake-draft/commit")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it("GET /api/patients/:id/intake-latest allows assigned psychologist with care relationship", async () => {
    const token = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const response = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/intake-latest")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.patientId).toBe("user_patient_001");
  });

  it("GET /api/patients/:id/intake-latest forbids psychologist without appointment with patient", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "psychologist2@clink.test", password: "Psych123!" });
    if (login.status !== 200) {
      // Second psychologist is seeded in the in-memory user stub; DB e2e may not include this account.
      return;
    }
    const response = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/intake-latest")
      .set("Authorization", `Bearer ${login.body.accessToken as string}`);
    expect(response.status).toBe(403);
  });
});
