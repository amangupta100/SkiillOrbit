// utils/queue.js
const { Queue } = require("bullmq"); // Remove QueueScheduler from destructuring
const IORedis = require("ioredis");

const redisConnection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  password: process.env.REDIS_SERVER_PASSWORD,
  maxRetriesPerRequest: null, // 🚨 Add this: Required for BullMQ blocking commands
  lazyConnect: true, // Optional: Improves startup speed
});

const REMINDER_QUEUE = "interviewReminderQueue";

const reminderQueue = new Queue(REMINDER_QUEUE, {
  connection: redisConnection,
});

module.exports = {
  reminderQueue,
  connection: redisConnection,
  REMINDER_QUEUE,
};
