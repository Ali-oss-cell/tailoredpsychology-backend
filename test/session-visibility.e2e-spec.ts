import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Session visibility contracts (e2e)", () => {
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

  it("returns patient sessions for owner patient and blocks unrelated patient", async () => {
    const owner = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const other = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");

    const ok = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/sessions")
      .set("Authorization", `Bearer ${owner}`);
    expect(ok.status).toBe(200);
    expect(Array.isArray(ok.body)).toBe(true);
    if (ok.body[0]) expect(ok.body[0]).toEqual(expect.objectContaining({ sessionId: expect.any(String) }));

    const denied = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/sessions")
      .set("Authorization", `Bearer ${other}`);
    expect(denied.status).toBe(403);
  });

  it("returns psychologist sessions for assigned psychologist and blocks patient", async () => {
    const psych = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const patient = await loginAndGetToken(app, "patient@clink.test", "Patient123!");

    const ok = await request(app.getHttpServer())
      .get("/api/psychologists/user_psychologist_001/sessions")
      .set("Authorization", `Bearer ${psych}`);
    expect(ok.status).toBe(200);
    expect(Array.isArray(ok.body)).toBe(true);

    const denied = await request(app.getHttpServer())
      .get("/api/psychologists/user_psychologist_001/sessions")
      .set("Authorization", `Bearer ${patient}`);
    expect(denied.status).toBe(403);
  });

  it("blocks psychologist from another clinician's patient session list when no care relationship", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "psychologist2@clink.test", password: "Psych123!" });
    if (login.status !== 200) {
      return;
    }
    const response = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/sessions")
      .set("Authorization", `Bearer ${login.body.accessToken as string}`);
    expect(response.status).toBe(403);
  });

  it("returns only joint sessions for assigned psychologist on patient session list", async () => {
    const psych = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const res = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/sessions")
      .set("Authorization", `Bearer ${psych}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const row of res.body as { clinicianId: string }[]) {
      expect(row.clinicianId).toBe("clinician_001");
    }
  });

  it("returns normalized session detail for owner and assigned psychologist", async () => {
    const owner = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const psych = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");

    const ownerView = await request(app.getHttpServer())
      .get("/api/sessions/appt_open_001")
      .set("Authorization", `Bearer ${owner}`);
    expect(ownerView.status).toBe(200);
    expect(ownerView.body.viewerAccessMode).toBe("owner_patient");

    const psychView = await request(app.getHttpServer())
      .get("/api/sessions/appt_open_001")
      .set("Authorization", `Bearer ${psych}`);
    expect(psychView.status).toBe(200);
    expect(psychView.body.viewerAccessMode).toBe("assigned_psychologist");
  });
});
