import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Security incidents register (e2e)", () => {
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

  it("supports create/list/update lifecycle for admin", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");

    const created = await request(app.getHttpServer())
      .post("/api/admin/security-incidents")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Potential unauthorized access",
        summary: "Spike in privileged export attempts observed.",
        severity: "high",
        impact: "moderate",
        containsPersonalData: true,
      });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("reported");
    expect(created.body.ndbAssessment).toBe("assessment_in_progress");

    const listed = await request(app.getHttpServer())
      .get("/api/admin/security-incidents")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect(listed.body.some((item: { incidentId: string }) => item.incidentId === created.body.incidentId)).toBe(true);

    const moved = await request(app.getHttpServer())
      .patch(`/api/admin/security-incidents/${created.body.incidentId as string}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "triage", assignedOwnerUserId: "user_admin_001" });
    expect(moved.status).toBe(200);
    expect(moved.body.status).toBe("triage");

    const invalid = await request(app.getHttpServer())
      .patch(`/api/admin/security-incidents/${created.body.incidentId as string}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "notification_ready" });
    expect(invalid.status).toBe(409);
  });

  it("enforces admin-only controls", async () => {
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");
    const denied = await request(app.getHttpServer())
      .post("/api/admin/security-incidents")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: "Unauthorized trial",
        summary: "Attempt from non-admin should fail.",
        severity: "medium",
        impact: "low",
        containsPersonalData: false,
      });
    expect(denied.status).toBe(403);
  });
});
