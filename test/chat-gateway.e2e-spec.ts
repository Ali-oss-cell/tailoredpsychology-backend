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

function connectClient(baseUrl: string, token?: string): Socket {
  return io(`${baseUrl}/chat`, {
    transports: ["websocket"],
    forceNew: true,
    auth: token ? { token: `Bearer ${token}` } : undefined,
  });
}

function onceEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise<T>((resolve) => {
    socket.once(event, (payload: T) => resolve(payload));
  });
}

describe("Appointments gateway (e2e)", () => {
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

  it("rejects unauthenticated socket connection", async () => {
    const client = connectClient(baseUrl);
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("disconnect", () => resolve());
    });

    expect(client.connected).toBe(false);
  });

  it("joins room and receives presence updates when window is open", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const client = connectClient(baseUrl, token);
    clients.push(client);

    await onceEvent<void>(client, "connect");
    const joined = (await client.emitWithAck("chat:join", {
      appointmentId: "appt_open_001",
    })) as { ok: boolean; messages: unknown[]; presence: { onlineUserIds: string[] } };

    expect(joined.ok).toBe(true);
    expect(Array.isArray(joined.messages)).toBe(true);
    expect(joined.presence.onlineUserIds).toContain("user_patient_001");
  });

  it("rejects message send before T-30 window", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const client = connectClient(baseUrl, token);
    clients.push(client);
    await onceEvent<void>(client, "connect");

    await client.emitWithAck("chat:join", { appointmentId: "appt_locked_001" });
    const response = (await client.emitWithAck("chat:send", {
      appointmentId: "appt_locked_001",
      message: "Can we start now?",
    })) as { ok: boolean; error?: string };
    expect(response.ok).toBe(false);
    expect(response.error).toContain("Chat window is not open");
  });

  it("blocks room join for unauthorized patient", async () => {
    const token = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");
    const client = connectClient(baseUrl, token);
    clients.push(client);
    await onceEvent<void>(client, "connect");

    const response = (await client.emitWithAck("chat:join", {
      appointmentId: "appt_open_001",
    })) as { ok: boolean; error?: string };
    expect(response.ok).toBe(false);
    expect(response.error).toContain("cannot access");
  });
});
