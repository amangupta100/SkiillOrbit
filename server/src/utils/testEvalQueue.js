// src/utils/testEvalQueue.js
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const redisConnection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  password: process.env.REDIS_SERVER_PASSWORD,
  maxRetriesPerRequest: null, // 🚨 Add this: Required for BullMQ blocking commands
  lazyConnect: true, // Optional: Improves startup speed
});

const TEST_EVAL_QUEUE_NAME = "testEvaluationQueue";

const testEvalQueue = new Queue(TEST_EVAL_QUEUE_NAME, {
  connection: redisConnection,
});

module.exports = {
  connection: redisConnection,
  TEST_EVAL_QUEUE_NAME,
  testEvalQueue,
};
