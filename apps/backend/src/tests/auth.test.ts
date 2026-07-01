import request from "supertest";
import { app } from "./helpers";
import { User } from "../models/User";

describe("Auth", () => {
  it("registers a new buyer and returns a buyerToken", async () => {
    const res = await request(app)
      .post("/api/auth/register-buyer")
      .send({ username: "newbuyer", password: "secretpass" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.buyerToken).toMatch(/^MS-/);
  });

  it("rejects registration with invalid username (validation)", async () => {
    const res = await request(app)
      .post("/api/auth/register-buyer")
      .send({ username: "a", password: "secretpass" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects duplicate username", async () => {
    await request(app).post("/api/auth/register-buyer").send({ username: "dupeuser", password: "secretpass" });
    const res = await request(app)
      .post("/api/auth/register-buyer")
      .send({ username: "dupeuser", password: "secretpass" });

    expect(res.status).toBe(409);
  });

  it("logs in successfully and returns token + refreshToken", async () => {
    await request(app).post("/api/auth/register-buyer").send({ username: "loginuser", password: "secretpass" });

    const res = await request(app).post("/api/auth/login").send({ username: "loginuser", password: "secretpass" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.role).toBe("buyer");
  });

  it("rejects login with wrong password", async () => {
    await request(app).post("/api/auth/register-buyer").send({ username: "wrongpass", password: "secretpass" });
    const res = await request(app).post("/api/auth/login").send({ username: "wrongpass", password: "incorrect" });
    expect(res.status).toBe(401);
  });

  it("blocks login for deactivated buyer", async () => {
    await request(app).post("/api/auth/register-buyer").send({ username: "deactivated", password: "secretpass" });
    await User.updateOne({ username: "deactivated" }, { isActive: false });

    const res = await request(app).post("/api/auth/login").send({ username: "deactivated", password: "secretpass" });
    expect(res.status).toBe(403);
  });

  it("refreshes token using a valid refreshToken", async () => {
    await request(app).post("/api/auth/register-buyer").send({ username: "refreshuser", password: "secretpass" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "refreshuser", password: "secretpass" });

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginRes.body.data.refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.token).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
  });

  it("rejects refresh with a revoked refreshToken after logout", async () => {
    await request(app).post("/api/auth/register-buyer").send({ username: "logoutuser", password: "secretpass" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "logoutuser", password: "secretpass" });

    const { token, refreshToken } = loginRes.body.data;

    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`).expect(200);

    const refreshRes = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });

  it("returns buyer-token for an authenticated buyer", async () => {
    await request(app).post("/api/auth/register-buyer").send({ username: "tokenuser", password: "secretpass" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "tokenuser", password: "secretpass" });

    const res = await request(app)
      .get("/api/auth/buyer-token")
      .set("Authorization", `Bearer ${loginRes.body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.buyerToken).toMatch(/^MS-/);
  });
});
