import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Admin psychologist user management (e2e)", () => {
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

  it("allows admin to list/create/update psychologists", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");

    const listed = await request(app.getHttpServer())
      .get("/api/admin/users/psychologists")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body)).toBe(true);

    const created = await request(app.getHttpServer())
      .post("/api/admin/users/psychologists")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "new.psychologist@clink.test",
        displayName: "Dr New Psychologist",
        registrationNumber: "PSY-AHPRA-999",
        providerNumber: "PRV-999999",
        specialties: ["cbt", "trauma"],
        status: "active",
      });
    expect(created.status).toBe(201);
    expect(created.body.email).toBe("new.psychologist@clink.test");
    expect(created.body.registrationNumber).toBe("PSY-AHPRA-999");

    const updated = await request(app.getHttpServer())
      .patch(`/api/admin/users/psychologists/${created.body.id as string}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        displayName: "Dr Updated Psychologist",
        registrationNumber: "PSY-AHPRA-777",
        providerNumber: "PRV-777777",
        specialties: ["cbt"],
        status: "inactive",
      });
    expect(updated.status).toBe(200);
    expect(updated.body.displayName).toBe("Dr Updated Psychologist");
    expect(updated.body.status).toBe("inactive");
  });

  it("forbids non-admin role", async () => {
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");
    const response = await request(app.getHttpServer())
      .get("/api/admin/users/psychologists")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(response.status).toBe(403);
  });
});
