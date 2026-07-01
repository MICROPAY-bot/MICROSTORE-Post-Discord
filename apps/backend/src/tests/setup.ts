import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import nock from "nock";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret";
process.env.JWT_REFRESH_SECRET = "test_jwt_refresh_secret";
process.env.JWT_EXPIRE = "1h";
process.env.JWT_REFRESH_EXPIRE = "1d";

let mongo: MongoMemoryServer | undefined;

beforeAll(async () => {
  // Jika TEST_MONGO_URI diisi (misal MongoDB lokal/Atlas/Railway yang sudah berjalan),
  // pakai itu. Ini berguna di lingkungan seperti Termux yang sering tidak bisa
  // menjalankan binary mongod hasil download otomatis dari mongodb-memory-server.
  const externalUri = process.env.TEST_MONGO_URI;

  if (externalUri) {
    if (!/test/i.test(externalUri)) {
      throw new Error(
        "TEST_MONGO_URI harus mengarah ke database bernama mengandung 'test' (misal mongodb://localhost:27017/microstore_test). " +
          "Ini untuk mencegah data production tidak sengaja terhapus oleh test (test melakukan deleteMany tiap selesai)."
      );
    }
    await mongoose.connect(externalUri);
  } else {
    // mongodb-memory-server butuh download binary mongod via HTTPS pada percobaan pertama,
    // jadi koneksi jaringan dibiarkan terbuka dulu sampai proses ini selesai.
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }

  // Setelah DB siap, blokir semua koneksi jaringan asli kecuali localhost (dipakai supertest),
  // supaya test tidak pernah benar-benar mengirim ke Discord/webhook asli.
  // Setiap pemanggilan webhook di test HARUS di-mock pakai nock.
  nock.disableNetConnect();
  nock.enableNetConnect(/(127\.0\.0\.1|localhost)/);
});

afterEach(async () => {
  nock.cleanAll();
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  nock.enableNetConnect();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
