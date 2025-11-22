// utils/genQtnsQueue.js
const { Queue } = require("bullmq"); // Remove QueueScheduler from destructuring
const IORedis = require("ioredis");

const redisConnection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  password: process.env.REDIS_SERVER_PASSWORD,
  maxRetriesPerRequest: null, // 🚨 Add this: Required for BullMQ blocking commands
  lazyConnect: true, // Optional: Improves startup speed
});

const genQtnQueue = "genQuestionQueue";

const genQtnQueueMain = new Queue(genQtnQueue, {
  connection: redisConnection,
});

module.exports = {
  genQtnQueue,
  connection: redisConnection,
  genQtnQueueMain,
};
