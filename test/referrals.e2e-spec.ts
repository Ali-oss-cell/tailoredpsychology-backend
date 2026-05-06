import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Referral documents (e2e)", () => {
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

  it("POST /api/documents/referrals accepts PDF upload", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/documents/referrals")
      .set("Authorization", `Bearer ${token}`)
      .field("sourceType", "gp_mhtp")
      .attach("file", Buffer.from("%PDF-1.4 test"), {
        filename: "referral.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(201);
    expect(response.body.documentId).toEqual(expect.stringMatching(/^ref_/));
    expect(response.body.status).toBe("received");
  });

  it("POST /api/documents/referrals rejects non-PDF file", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/documents/referrals")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("not-pdf"), {
        filename: "referral.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
  });

  it("POST /api/documents/referrals rejects oversized file", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const oversized = Buffer.alloc(8 * 1024 * 1024 + 1, 0);
    const response = await request(app.getHttpServer())
      .post("/api/documents/referrals")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", oversized, {
        filename: "big.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
  });

  it("GET /api/ops/referrals allows practice_manager and admin, denies patient", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");

    const denied = await request(app.getHttpServer())
      .get("/api/ops/referrals")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(denied.status).toBe(403);

    const managerList = await request(app.getHttpServer())
      .get("/api/ops/referrals")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(managerList.status).toBe(200);
    expect(Array.isArray(managerList.body)).toBe(true);
    expect(managerList.body[0]).toEqual(
      expect.objectContaining({
        dueAt: expect.any(String),
        overdue: expect.any(Boolean),
      }),
    );

    const adminList = await request(app.getHttpServer())
      .get("/api/ops/referrals")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminList.status).toBe(200);
    expect(Array.isArray(adminList.body)).toBe(true);
  });

  it("POST /api/ops/referrals/:id/approve approves referral and blocks duplicate transition", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");

    const uploaded = await request(app.getHttpServer())
      .post("/api/documents/referrals")
      .set("Authorization", `Bearer ${patientToken}`)
      .field("sourceType", "gp_mhtp")
      .attach("file", Buffer.from("%PDF-1.4 approve test"), {
        filename: "approve-referral.pdf",
        contentType: "application/pdf",
      });
    expect(uploaded.status).toBe(201);
    const referralId = uploaded.body.documentId as string;

    const approved = await request(app.getHttpServer())
      .post(`/api/ops/referrals/${referralId}/approve`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ reason: "Referral details verified", notes: "Proceed to onboarding." });
    expect(approved.status).toBe(201);
    expect(approved.body.status).toBe("approved");
    expect(approved.body.reviewReason).toBe("Referral details verified");

    const duplicate = await request(app.getHttpServer())
      .post(`/api/ops/referrals/${referralId}/approve`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ reason: "Trying duplicate approve" });
    expect(duplicate.status).toBe(409);
  });

  it("POST /api/ops/referrals/:id/reject and /request-info enforce role guard", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");

    const uploaded = await request(app.getHttpServer())
      .post("/api/documents/referrals")
      .set("Authorization", `Bearer ${patientToken}`)
      .field("sourceType", "manual_upload")
      .attach("file", Buffer.from("%PDF-1.4 reject test"), {
        filename: "reject-referral.pdf",
        contentType: "application/pdf",
      });
    expect(uploaded.status).toBe(201);
    const referralId = uploaded.body.documentId as string;

    const patientDenied = await request(app.getHttpServer())
      .post(`/api/ops/referrals/${referralId}/request-info`)
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ reason: "Need GP details" });
    expect(patientDenied.status).toBe(403);

    const requested = await request(app.getHttpServer())
      .post(`/api/ops/referrals/${referralId}/request-info`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Missing provider number", notes: "Please upload a clearer copy." });
    expect(requested.status).toBe(201);
    expect(requested.body.status).toBe("info_requested");

    const rejected = await request(app.getHttpServer())
      .post(`/api/ops/referrals/${referralId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Invalid referral date" });
    expect(rejected.status).toBe(201);
    expect(rejected.body.status).toBe("rejected");
  });

  it("GET /api/ops/referrals supports status/owner/overdue filters", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");

    const uploaded = await request(app.getHttpServer())
      .post("/api/documents/referrals")
      .set("Authorization", `Bearer ${patientToken}`)
      .field("sourceType", "gp_mhtp")
      .attach("file", Buffer.from("%PDF-1.4 filter test"), {
        filename: "filter-referral.pdf",
        contentType: "application/pdf",
      });
    expect(uploaded.status).toBe(201);
    const referralId = uploaded.body.documentId as string;

    const mineBeforeAssign = await request(app.getHttpServer())
      .get("/api/ops/referrals?owner=mine")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(mineBeforeAssign.status).toBe(200);

    const approved = await request(app.getHttpServer())
      .post(`/api/ops/referrals/${referralId}/approve`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ reason: "Ready for care" });
    expect(approved.status).toBe(201);

    const approvedOnly = await request(app.getHttpServer())
      .get("/api/ops/referrals?status=approved&owner=mine&overdue=on-track")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(approvedOnly.status).toBe(200);
    expect(approvedOnly.body.some((item: { documentId: string }) => item.documentId === referralId)).toBe(true);
  });
});
