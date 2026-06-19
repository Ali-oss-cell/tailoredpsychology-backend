import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function login(app: INestApplication, email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return res.body.accessToken as string;
}

describe("BillingController (e2e)", () => {
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

  it("lists invoices for patient", async () => {
    const token = await login(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/billing/invoices")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        invoiceId: expect.any(String),
        issuedDate: expect.any(String),
        amountLabel: expect.any(String),
        status: expect.any(String),
      }),
    );
  });

  it("downloads invoice attachment for patient", async () => {
    const token = await login(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/billing/invoices/INV-1042/download")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/pdf/);
    expect(String(response.headers["content-disposition"])).toContain("attachment");
    expect(String(response.body)).toContain("%PDF-1.4");
    expect(String(response.body)).toContain("INV-1042");
  });

  it("returns 403 for non-patient on invoices list", async () => {
    const token = await login(app, "psychologist@clink.test", "Psych123!");
    const response = await request(app.getHttpServer())
      .get("/api/billing/invoices")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });
});
