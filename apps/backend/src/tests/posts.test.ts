import request from "supertest";
import nock from "nock";
import { app, createAdminUser, createBuyerUser } from "./helpers";

const FAKE_WEBHOOK = "https://discord.com/api/webhooks/123/abc";

describe("Posts (Auto Post module)", () => {
  it("rejects access for non-admin (buyer) users", async () => {
    const { token } = await createBuyerUser();
    const res = await request(app).get("/api/posts").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("creates a scheduled post with valid data", async () => {
    const { token } = await createAdminUser();
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Promo Spesial",
        content: "Diskon 50% hari ini saja!",
        webhookUrl: FAKE_WEBHOOK,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("scheduled");
  });

  it("rejects post creation with invalid webhookUrl", async () => {
    const { token } = await createAdminUser();
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Promo Spesial",
        content: "Diskon 50% hari ini saja!",
        webhookUrl: "not-a-url",
        scheduledAt: new Date().toISOString()
      });

    expect(res.status).toBe(400);
  });

  it("sends post immediately via post-now and records success log", async () => {
    nock("https://discord.com").post("/api/webhooks/123/abc").reply(204);

    const { token } = await createAdminUser();
    const createRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Flash Sale",
        content: "Buruan order sekarang!",
        webhookUrl: FAKE_WEBHOOK,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });

    const postId = createRes.body.data._id;

    const postNowRes = await request(app)
      .post(`/api/posts/${postId}/post-now`)
      .set("Authorization", `Bearer ${token}`);

    expect(postNowRes.status).toBe(200);
    expect(postNowRes.body.data.status).toBe("posted");
    expect(postNowRes.body.data.logs.length).toBeGreaterThan(0);
    expect(postNowRes.body.data.logs[0].status).toBe("success");
  });

  it("records failed log when Discord webhook returns an error", async () => {
    nock("https://discord.com").post("/api/webhooks/123/abc").reply(404, { message: "Unknown Webhook" });

    const { token } = await createAdminUser();
    const createRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Webhook Salah",
        content: "Ini akan gagal",
        webhookUrl: FAKE_WEBHOOK,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });

    const postId = createRes.body.data._id;

    const postNowRes = await request(app)
      .post(`/api/posts/${postId}/post-now`)
      .set("Authorization", `Bearer ${token}`);

    expect(postNowRes.status).toBe(502);
    expect(postNowRes.body.data.status).toBe("failed");
  });

  it("cancels a scheduled post", async () => {
    const { token } = await createAdminUser();
    const createRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Akan Dibatalkan",
        content: "Test cancel",
        webhookUrl: FAKE_WEBHOOK,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });

    const postId = createRes.body.data._id;

    const cancelRes = await request(app)
      .patch(`/api/posts/${postId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe("cancelled");
  });

  it("deletes a post", async () => {
    const { token } = await createAdminUser();
    const createRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Akan Dihapus",
        content: "Test delete",
        webhookUrl: FAKE_WEBHOOK,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });

    const postId = createRes.body.data._id;

    const deleteRes = await request(app).delete(`/api/posts/${postId}`).set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app).get(`/api/posts/${postId}`).set("Authorization", `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});
