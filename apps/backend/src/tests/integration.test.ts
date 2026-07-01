import request from "supertest";
import nock from "nock";
import { app, createBuyerUser } from "./helpers";
import { User } from "../models/User";

describe("Integration endpoints (buyer token auth)", () => {
  it("rejects requests without x-buyer-token header", async () => {
    const res = await request(app).get("/api/integrations/ping");
    expect(res.status).toBe(401);
  });

  it("rejects requests with an invalid buyer token", async () => {
    const res = await request(app).get("/api/integrations/ping").set("x-buyer-token", "INVALID-TOKEN");
    expect(res.status).toBe(401);
  });

  it("pings successfully with a valid buyer token", async () => {
    const { buyer } = await createBuyerUser("pingbuyer");
    const res = await request(app).get("/api/integrations/ping").set("x-buyer-token", buyer.buyerToken!);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("pingbuyer");
  });

  it("rejects integration calls for a deactivated buyer", async () => {
    const { buyer } = await createBuyerUser("deactivatedintegration");
    await User.updateOne({ _id: buyer._id }, { isActive: false });

    const res = await request(app).get("/api/integrations/ping").set("x-buyer-token", buyer.buyerToken!);
    expect(res.status).toBe(403);
  });

  it("triggers an instant post using buyer token and records it under that buyer", async () => {
    nock("https://discord.com").post("/api/webhooks/999/xyz").reply(204);

    const { buyer } = await createBuyerUser("triggerbuyer");

    const res = await request(app)
      .post("/api/integrations/trigger-post")
      .set("x-buyer-token", buyer.buyerToken!)
      .send({
        title: "Boost Terjual",
        content: "1x Boost berhasil terjual",
        webhookUrl: "https://discord.com/api/webhooks/999/xyz"
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("posted");
    expect(res.body.data.createdBy).toBe(String(buyer._id));
  });

  it("logs the integration call into the buyer's activityLogs", async () => {
    const { buyer } = await createBuyerUser("activitybuyer");
    await request(app).get("/api/integrations/ping").set("x-buyer-token", buyer.buyerToken!);

    const updated = await User.findById(buyer._id);
    const hasLog = updated?.activityLogs.some((log) => log.action === "integration-call");
    expect(hasLog).toBe(true);
  });

  it("rejects trigger-post when neither webhookUrl nor default is configured", async () => {
    const { buyer } = await createBuyerUser("nowebhookbuyer");

    const res = await request(app)
      .post("/api/integrations/trigger-post")
      .set("x-buyer-token", buyer.buyerToken!)
      .send({ title: "Tanpa Webhook", content: "Test" });

    expect(res.status).toBe(400);
  });
});
