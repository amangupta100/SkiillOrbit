// recordingStorage.js
import { set, get, del } from "idb-keyval";

const VIDEO_KEY = "recording-video-chunks";

export const saveVideoChunks = async (chunks) => {
  await set(VIDEO_KEY, chunks);
};

export const loadVideoChunks = async () => {
  return (await get(VIDEO_KEY)) || [];
};

export const clearVideoChunks = async () => {
  await del(VIDEO_KEY);
};
