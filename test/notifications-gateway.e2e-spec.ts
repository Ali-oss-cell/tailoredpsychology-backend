import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { io, type Socket } from "socket.io-client";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Notifications gateway (e2e)", () => {
  let app: INestApplication;
  let baseUrl: string;
  const clients: Socket[] = [];

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
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterEach(() => {
    for (const client of clients.splice(0)) {
      client.disconnect();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it("pushes notifications:new event after subscribe", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const streamTokenResponse = await request(app.getHttpServer())
      .get("/api/notifications/stream-token")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(streamTokenResponse.status).toBe(200);

    const socket = io(`${baseUrl}/notifications`, {
      transports: ["websocket"],
      forceNew: true,
      auth: { token: `Bearer ${streamTokenResponse.body.socketToken}` },
    });
    clients.push(socket);

    await new Promise<void>((resolve) => socket.once("connect", () => resolve()));
    const subscribeAck = (await socket.emitWithAck("notifications:subscribe", {})) as { ok: boolean; error?: string };
    expect(subscribeAck.ok).toBe(true);

    const eventPromise = new Promise<{ title: string }>((resolve) => {
      socket.once("notifications:new", (payload: { title: string }) => resolve(payload));
    });

    const createBooking = await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        clinicianId: "clinician_003",
        slotId: "clinician_003_2026-05-21_1000",
        appointmentDate: "2026-05-21",
        idempotencyKey: "notif-gateway-case-1",
      });
    expect(createBooking.status).toBe(201);

    const pushed = await eventPromise;
    expect(pushed.title).toBe("Booking request submitted");
  });
});
