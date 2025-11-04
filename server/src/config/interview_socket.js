// Updated interview_socket.js
const axios = require("axios");

const rooms = new Map();
const roomMonitoring = new Map(); // roomId -> { hostId: Set<targetParticipantIds> }

function updateUserCount(roomId, interviewNamespace) {
  const room = rooms.get(roomId);
  if (!room) return;
  const count = (room.host ? 1 : 0) + room.participants.size;
  interviewNamespace.to(roomId).emit("user-count", { count });
}

function handleLeave(socket, roomId, interviewNamespace) {
  const room = rooms.get(roomId);
  if (!room) return;

  // remove from participants
  room.participants.delete(socket.id);
  socket.to(roomId).emit("user-left", { socketId: socket.id });

  if (room.host.socketId === socket.id) {
    // host left -> close room
    rooms.delete(roomId);
    // Clean up monitoring
    roomMonitoring.delete(roomId);
    socket.to(roomId).emit("room-closed");
  } else {
    if (room.participants.size === 0 && !room.host) {
      rooms.delete(roomId);
      roomMonitoring.delete(roomId);
      `Room ${roomId} deleted (empty)`;
    } else {
      updateUserCount(roomId, interviewNamespace);
    }
  }
}

function makeRoomId(length = 16) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789-_";
  const charsNoSpecial =
    "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

  let id = charsNoSpecial.charAt(
    Math.floor(Math.random() * charsNoSpecial.length)
  );
  for (let i = 1; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function interview_Socket(io) {
  const interviewNamespace = io.of("/interview");

  interviewNamespace.on("connection", (socket) => {
    "Interview socket connected", socket.id;

    /**
     * Create Room
     * If frontend provides a roomId (from URL), use it.
     * Otherwise generate a new one.
     */
    socket.on("create-room", ({ roomId, userName }, cb) => {
      let room = rooms.get(roomId);

      if (!room) {
        // create new room
        room = {
          host: { socketId: socket.id, userName: userName || "Guest" },
          participants: new Map(),
          messages: [], // 🔹 new field for chat messages
        };

        rooms.set(roomId, room);
        // Initialize monitoring for this room
        roomMonitoring.set(roomId, new Map());
        socket.join(roomId);
        `Room ${roomId} created by ${socket.id} (${userName})`;
      } else {
        // room already exists → just acknowledge
        `Room ${roomId} already exists, skipping create`;
      }

      const members = [
        {
          socketId: room.host.socketId,
          userName: room.host.userName,
          isHost: true,
        },
        ...Array.from(room.participants.entries()).map(([id, data]) => ({
          socketId: id,
          userName: data.userName,
          isHost: false,
          isMuted: data.isMuted,
          cameraOn: data.cameraOn,
        })),
      ];

      cb && cb({ roomId, members });
      updateUserCount(roomId, interviewNamespace);
    });

    /**
     * Join Room
     */
    socket.on("join-room", ({ roomId, userName }, cb) => {
      const room = rooms.get(roomId);
      if (!room) {
        return cb && cb({ error: "Room not found" });
      }

      // enforce max 4 members
      const totalMembers = 1 + room.participants.size; // host + participants
      if (totalMembers >= 4) {
        return cb && cb({ error: "Room is full (max 4)" });
      }

      // prevent host being added as participant
      if (room.host.socketId !== socket.id) {
        room.participants.set(socket.id, {
          userName: userName || "Guest",
          isMuted: false,
          cameraOn: true,
        });
      }
      socket.join(roomId);

      const members = [
        {
          socketId: room.host.socketId,
          userName: room.host.userName,
          isHost: true,
        },
        ...Array.from(room.participants.entries()).map(([id, data]) => ({
          socketId: id,
          userName: data.userName,
          isHost: false,
          isMuted: data.isMuted,
          cameraOn: data.cameraOn,
        })),
      ];

      cb && cb({ members, messages: room.messages }); // 🔹 send chat history

      // 🔹 inform others that this user is "connecting"
      socket.to(roomId).emit("user-connecting", {
        socketId: socket.id,
        userName,
        isHost: false,
        isMuted: false,
        cameraOn: true,
      });

      updateUserCount(roomId, interviewNamespace);
      `${userName} joined ${roomId}`;
    });

    socket.on("send-message", ({ roomId, userName, message }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const payload = {
        socketId: socket.id,
        userName,
        message,
        time: new Date().toISOString(),
      };

      // 🔹 Save message in memory
      room.messages.push(payload);

      // Broadcast to everyone in room
      interviewNamespace.to(roomId).emit("new-message", payload);
    });

    socket.on("start-monitor", ({ targetId, roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      `[start-monitor] Request from ${socket.id} for target ${targetId} in room ${roomId}`;

      // ✅ Only host can request monitoring
      if (room.host?.socketId !== socket.id) {
        ("[start-monitor] Non-host attempted monitoring");
        return;
      }

      // Get or init host's monitoring set
      const roomMonitorData = roomMonitoring.get(roomId) || new Map();
      let hostTargets = roomMonitorData.get(socket.id) || new Set();

      const isCurrentlyMonitoring = hostTargets.has(targetId);

      if (isCurrentlyMonitoring) {
        // Toggle off
        hostTargets.delete(targetId);
        if (hostTargets.size === 0) {
          roomMonitorData.delete(socket.id);
        }
        roomMonitoring.set(roomId, roomMonitorData);

        // Notify client: stop
        socket.emit("monitoring-updated", { targetId, action: "stop" });

        // 🔹 NEW: Notify participant to stop emitting screenshots and events
        interviewNamespace
          .to(targetId)
          .emit("disable-monitor", { roomId, monitorId: socket.id });

        `[start-monitor] Stopped monitoring ${targetId} in room ${roomId}`;
      } else {
        // Start monitoring
        hostTargets.add(targetId);
        roomMonitorData.set(socket.id, hostTargets);
        roomMonitoring.set(roomId, roomMonitorData);

        // Notify participant to enable event emission (tab switches, screenshots, etc.)
        interviewNamespace
          .to(targetId)
          .emit("enable-monitor", { roomId, monitorId: socket.id });

        // Notify host client: start
        socket.emit("monitoring-updated", { targetId, action: "start" });

        `[start-monitor] Started monitoring ${targetId} in room ${roomId}`;
      }
    });

    socket.on("get-current-monitoring", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.host?.socketId !== socket.id) {
        ("[get-current-monitoring] Unauthorized or room not found");
        return;
      }

      const roomMonitorData = roomMonitoring.get(roomId);
      const hostTargets = roomMonitorData?.get(socket.id) || new Set();

      socket.emit("current-monitoring", {
        monitoredIds: Array.from(hostTargets),
        roomId,
      });

      `[get-current-monitoring] Sent ${hostTargets.size} targets to host ${socket.id} in room ${roomId}`;
    });

    // 🔹 UPDATED: When a participant emits a monitor-event (tab switch, blur, focus, screenshot, etc.)
    socket.on("monitor-event", async ({ roomId, socketId, event }) => {
      const room = rooms.get(roomId);
      if (!room) {
        console.warn(`[monitor-event] Room not found: ${roomId}`);
        return;
      }

      const roomMonitorData = roomMonitoring.get(roomId);
      if (!roomMonitorData) return; // No monitoring active in this room

      // Check if any host is monitoring this socketId
      let isMonitored = false;
      for (const [hostId, targets] of roomMonitorData.entries()) {
        if (targets.has(socketId)) {
          isMonitored = true;
          const payload = {
            socketId,
            event,
            time: new Date().toISOString(),
          };

          // 🔹 NEW: Handle overlay detection for screenshot events
          if (event.type === "screenshot") {
            const base64Screenshot = event.data;
            if (!base64Screenshot) {
              console.warn(
                `[monitor-event] Missing screenshot data from ${socketId}`
              );
              return;
            }
            try {
              `[monitor-event] Processing screenshot for ${socketId}...`;
              const apiBase =
                process.env.API_BASE_URL2 || "http://localhost:8000";
              const response = await axios.post(
                `${apiBase}/overlay/detect`,
                { screenshot: base64Screenshot },
                {
                  headers: {
                    "X-Socket-ID": socketId,
                    "Content-Type": "application/json",
                  },
                }
              );
              // Emit overlay result to host instead of raw event
              interviewNamespace.to(hostId).emit("overlay-detection-result", {
                socketId,
                detected: response.data.detected,
                processedScreenshotB64: response.data.processed_screenshot_b64,
                coords: response.data.coords,
              });
              `[overlay-result] Forwarded detection result from ${socketId} to host ${hostId}: detected=${response.data.detected}`;
              continue; // Skip raw forward for screenshots
            } catch (err) {
              console.error("[overlay-detection] Failed:", err);
              // Emit error to host
              interviewNamespace.to(hostId).emit("overlay-detection-error", {
                socketId,
                error: err.message,
              });
            }
          } else {
            // Forward non-screenshot events (tab switch, etc.)
            interviewNamespace.to(hostId).emit("monitor-event", payload);
          }

          `[monitor-event] Forwarded from participant ${socketId} to host ${hostId} in room ${roomId}:`,
            payload;
        }
      }

      if (!isMonitored) {
        `[monitor-event] Ignored (not monitored): ${socketId} in room ${roomId}`;
      }
    });

    socket.on("get-messages", ({ roomId }, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb && cb({ messages: [] });
      cb && cb({ messages: room.messages || [] });
    });

    /**
     * Remove participant (only host can do this)
     */
    socket.on("remove-participant", ({ roomId, socketId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // sirf host hi kar sakta hai
      if (room.host.socketId !== socket.id) {
        ("Non-host tried to remove a participant");
        return;
      }

      // check if participant exists
      if (room.participants.has(socketId)) {
        room.participants.delete(socketId);
        interviewNamespace.to(socketId).emit("removed-by-host");
        interviewNamespace.sockets.get(socketId)?.leave(roomId);

        // notify others
        interviewNamespace.to(roomId).emit("user-removed", { socketId });
        updateUserCount(roomId, interviewNamespace);
        `Participant ${socketId} removed by host in room ${roomId}`;
      }
    });

    socket.on(
      "participant-update",
      ({ socketId, isMuted, cameraOn, roomId }) => {
        interviewNamespace.to(roomId).emit("participant-update", {
          socketId,
          isMuted,
          cameraOn,
        });
      }
    );

    /**
     * Leave Room
     */
    socket.on("leave-room", ({ roomId }) =>
      handleLeave(socket, roomId, interviewNamespace)
    );

    /**
     * Disconnect
     */
    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;
        handleLeave(socket, roomId, interviewNamespace);
      }
    });

    /**
     * WebRTC Signaling
     */
    socket.on("signal", ({ roomId, to, from, data }) => {
      interviewNamespace.to(to).emit("signal", { from, data });
    });
  });
}

module.exports = { interview_Socket };
