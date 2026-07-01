import request from "supertest";
import { app, createAdminUser, createBuyerUser } from "./helpers";

describe("Buyer management", () => {
  it("lists all buyers (admin only)", async () => {
    const { token } = await createAdminUser();
    await createBuyerUser("listbuyer1");
    await createBuyerUser("listbuyer2");

    const res = await request(app).get("/api/buyers").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects buyer-management access for buyer role", async () => {
    const { token } = await createBuyerUser();
    const res = await request(app).get("/api/buyers").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("regenerates a buyer's token", async () => {
    const { token } = await createAdminUser();
    const { buyer } = await createBuyerUser("regenbuyer");

    const res = await request(app)
      .patch(`/api/buyers/${buyer._id}/regenerate-token`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.buyerToken).not.toBe(buyer.buyerToken);
  });

  it("toggles buyer active status and blocks login when deactivated", async () => {
    const { token } = await createAdminUser();
    const { buyer } = await createBuyerUser("toggleuser", "secretpass1");

    const toggleRes = await request(app)
      .patch(`/api/buyers/${buyer._id}/toggle-active`)
      .set("Authorization", `Bearer ${token}`);

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.isActive).toBe(false);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "toggleuser", password: "secretpass1" });

    expect(loginRes.status).toBe(403);
  });

  it("deletes a buyer", async () => {
    const { token } = await createAdminUser();
    const { buyer } = await createBuyerUser("deletebuyer");

    const res = await request(app).delete(`/api/buyers/${buyer._id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const getRes = await request(app).get(`/api/buyers/${buyer._id}`).set("Authorization", `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});
