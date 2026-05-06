import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Psychologist notes/profile/context + session videos (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("supports notes create/update/sign and psychologist profile", async () => {
    const token = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");

    const created = await request(app.getHttpServer())
      .post("/api/psychologists/user_psychologist_001/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patientId: "user_patient_001",
        sessionId: "appt_open_001",
        status: "draft",
        body: "Initial draft note",
        clinicalDataset: {
          presentingConcerns: "Low mood",
          riskAssessment: "No acute risk",
          interventionsApplied: "CBT psychoeducation",
          progressEvaluation: "Mild improvement",
          followUpPlan: "Review in one week",
        },
      });
    expect(created.status).toBe(201);
    expect(created.body.noteId).toEqual(expect.any(String));

    const updated = await request(app.getHttpServer())
      .patch(`/api/psychologists/user_psychologist_001/notes/${created.body.noteId as string}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "ready_for_signoff", body: "Ready to sign" });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe("ready_for_signoff");

    const signed = await request(app.getHttpServer())
      .post(`/api/psychologists/user_psychologist_001/notes/${created.body.noteId as string}/sign`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(signed.status).toBe(201);
    expect(signed.body.status).toBe("signed");

    const meProfile = await request(app.getHttpServer())
      .get("/api/psychologists/me/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(meProfile.status).toBe(200);
    expect(meProfile.body.psychologistId).toBe("user_psychologist_001");

    const patchedProfile = await request(app.getHttpServer())
      .patch("/api/psychologists/me/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ bio: "Updated psychologist profile bio." });
    expect(patchedProfile.status).toBe(200);
    expect(patchedProfile.body.bio).toContain("Updated");
  });

  it("blocks sign-off when minimum clinical dataset is incomplete", async () => {
    const token = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const created = await request(app.getHttpServer())
      .post("/api/psychologists/user_psychologist_001/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patientId: "user_patient_001",
        sessionId: "appt_open_001",
        status: "ready_for_signoff",
        body: "Dataset-incomplete note",
        clinicalDataset: {
          presentingConcerns: "Anxiety spikes",
          riskAssessment: "",
          interventionsApplied: "",
          progressEvaluation: "No change",
          followUpPlan: "",
        },
      });
    expect(created.status).toBe(201);

    const signAttempt = await request(app.getHttpServer())
      .post(`/api/psychologists/user_psychologist_001/notes/${created.body.noteId as string}/sign`)
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(signAttempt.status).toBe(400);
    const errorPayload = signAttempt.body.code ? signAttempt.body : signAttempt.body.message;
    expect(errorPayload.code).toBe("CLINICAL_MINIMUM_DATASET_MISSING");
    expect(errorPayload.missingFields).toEqual(
      expect.arrayContaining(["riskAssessment", "interventionsApplied", "followUpPlan"]),
    );
  });

  it("returns context and session videos with role guards", async () => {
    const psychToken = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");

    const context = await request(app.getHttpServer())
      .get("/api/psychologists/user_psychologist_001/patients/user_patient_001/context")
      .set("Authorization", `Bearer ${psychToken}`);
    expect(context.status).toBe(200);
    expect(context.body.patientId).toBe("user_patient_001");

    const psychVideos = await request(app.getHttpServer())
      .get("/api/psychologists/user_psychologist_001/session-videos")
      .set("Authorization", `Bearer ${psychToken}`);
    expect(psychVideos.status).toBe(200);
    expect(Array.isArray(psychVideos.body)).toBe(true);
    expect(psychVideos.body[0].watermarkRequired).toBe(true);
    expect(psychVideos.body[0].canDownload).toBe(true);
    expect(psychVideos.body[0].policyStatus).toBe("active");

    const patientVideos = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/session-videos")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(patientVideos.status).toBe(200);

    const denied = await request(app.getHttpServer())
      .get("/api/psychologists/user_psychologist_001/session-videos")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(denied.status).toBe(403);
  });

  it("enforces owners-only and retention policy at video access gate", async () => {
    const psychToken = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");

    const videos = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/session-videos")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(videos.status).toBe(200);
    const targetVideoId = videos.body[0].videoId as string;

    const patientAccess = await request(app.getHttpServer())
      .get(`/api/session-videos/${targetVideoId}/access`)
      .set("Authorization", `Bearer ${patientToken}`);
    expect(patientAccess.status).toBe(200);
    expect(patientAccess.body.canDownload).toBe(true);
    expect(patientAccess.body.accessToken).toEqual(expect.any(String));
    expect(patientAccess.body.watermarkText).toContain("CLINK CONFIDENTIAL");

    const psychAccess = await request(app.getHttpServer())
      .get(`/api/session-videos/${targetVideoId}/access`)
      .set("Authorization", `Bearer ${psychToken}`);
    expect(psychAccess.status).toBe(200);
    expect(psychAccess.body.canDownload).toBe(true);

    const adminDenied = await request(app.getHttpServer())
      .get(`/api/session-videos/${targetVideoId}/access`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminDenied.status).toBe(200);
    expect(adminDenied.body.canDownload).toBe(false);

    await request(app.getHttpServer())
      .post("/api/admin/patients/user_patient_001/legal-hold")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Court order" });

    const holdBlocked = await request(app.getHttpServer())
      .get(`/api/session-videos/${targetVideoId}/access`)
      .set("Authorization", `Bearer ${patientToken}`);
    expect(holdBlocked.status).toBe(409);
    const policyError = holdBlocked.body.code ? holdBlocked.body : holdBlocked.body.message;
    expect(policyError.code).toBe("SESSION_VIDEO_DOWNLOAD_BLOCKED");
    expect(policyError.policyStatus).toBe("hold");
  });
});
