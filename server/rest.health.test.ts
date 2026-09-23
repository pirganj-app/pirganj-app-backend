import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { registerRestRoutes } from "./rest";

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>(resolve => server?.close(() => resolve()));
  server = undefined;
});

describe("Pirganj REST API", () => {
  it("returns a stable Bengali-friendly health contract", async () => {
    const app = express();
    registerRestRoutes(app);
    server = app.listen(0);
    const address = server.address() as AddressInfo;

    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ success: true, service: "pirganj-backend", status: "ok" });
    expect(typeof payload.timestamp).toBe("string");
  });
});
