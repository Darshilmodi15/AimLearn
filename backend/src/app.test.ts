import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "./app.js";

describe("AimLearn API", () => {
  it("reports service health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "aimlearn-api" });
  });

  it("rejects invalid signup input before database access", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "A",
      email: "not-an-email",
      password: "weak"
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Please correct the highlighted fields.");
  });

  it("rejects cross-site mutation requests from unknown browser origins", async () => {
    const response = await request(app).post("/api/auth/logout").set("Origin", "https://malicious.example");
    expect(response.status).toBe(403);
    expect(response.body.message).toBe("This request origin is not allowed.");
  });
});
