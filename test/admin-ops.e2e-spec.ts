import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Admin ops governance endpoints (e2e)", () => {
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

  it("serves admin governance snapshots", async () => {
    const token = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const paths = [
      "/api/admin/ops/appointments",
      "/api/admin/ops/patients",
      "/api/admin/ops/staff",
      "/api/admin/ops/settings",
      "/api/admin/ops/resources",
      "/api/admin/ops/deletion-queue",
      "/api/admin/ops/billing",
      "/api/admin/ops/analytics-summary",
    ];
    for (const path of paths) {
      const response = await request(app.getHttpServer()).get(path).set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
    }
  });

  it("forbids non-admin access", async () => {
    const token = await loginAndGetToken(app, "manager@clink.test", "Manager123!");
    const response = await request(app.getHttpServer())
      .get("/api/admin/ops/appointments")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });
});
