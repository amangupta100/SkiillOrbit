// Updated interview_socket.js
const axios = require("axios");

const rooms = new Map();
const roomMonitoring = new Map(); // roomId -> { hostId: Set<targetParticipantIds> }

function getMembers(room) {
  if (!room.host) return [];
  return [
    {
      socketId: room.host.socketId,
      userName: room.host.userName,
      isHost: true,
      isMuted: room.host.isMuted,
      cameraOn: room.host.cameraOn,
    },
    ...Array.from(room.participants.entries()).map(([socketId, data]) => ({
      socketId,
      userName: data.userName,
      isHost: false,
      isMuted: data.isMuted,
      cameraOn: data.cameraOn,
    })),
  ];
}

function updateUserCount(roomId, interviewNamespace) {
  const room = rooms.get(roomId);
  if (!room) return;
  const count = (room.host ? 1 : 0) + room.participants.size;
  interviewNamespace.to(roomId).emit("user-count", { count });
}

function handleLeave(socket, roomId, interviewNamespace) {
  const room = rooms.get(roomId);
  if (!room) return;

  const isHostLeaving = room.host?.socketId === socket.id;
  const userData = isHostLeaving ? room.host : room.participants.get(socket.id);
  const userName = userData?.userName || "Unknown";
  const isHost = isHostLeaving;

  if (isHostLeaving) {
    // Host left: Update state first
    room.host = null; // Clean removal

    // Emit user-left
    interviewNamespace.to(roomId).emit("user-left", {
      socketId: socket.id,
      userName,
      isHost,
    });

    // Emit full updated members (empty host)
    const updatedMembers = getMembers(room);
    interviewNamespace
      .to(roomId)
      .emit("participants-updated", { members: updatedMembers });

    // Notify close
    interviewNamespace.to(roomId).emit("room-closed");

    // Delete room/monitoring
    rooms.delete(roomId);
    roomMonitoring.delete(roomId);
    return;
  }

  // Participant left
  room.participants.delete(socket.id);

  // Emit user-left
  interviewNamespace.to(roomId).emit("user-left", {
    socketId: socket.id,
    userName,
    isHost: false,
  });

  // Emit full updated members
  const updatedMembers = getMembers(room);
  interviewNamespace
    .to(roomId)
    .emit("participants-updated", { members: updatedMembers });

  // If room now empty (no host/participants), delete
  if (!room.host && room.participants.size === 0) {
    interviewNamespace.to(roomId).emit("user-count", { count: 0 }); // Final sync
    rooms.delete(roomId);
    roomMonitoring.delete(roomId);

    return;
  }

  // Update count for remaining
  updateUserCount(roomId, interviewNamespace);
}

function interview_Socket(io) {
  const interviewNamespace = io.of("/interview");

  interviewNamespace.on("connection", (socket) => {
    /**
     * Create/Join Room (merged logic)
     */
    socket.on(
      "create-room",
      (
        { roomId, userName, isHost = false, isMuted = false, cameraOn = true },
        cb
      ) => {
        let room = rooms.get(roomId);
        let created = !room;

        if (created) {
          room = {
            host: null,
            participants: new Map(),
            messages: [], // 🔹 new field for chat messages
          };
          rooms.set(roomId, room);
          // Initialize monitoring for this room
          roomMonitoring.set(roomId, new Map());
        }

        socket.join(roomId); // Always join, even for late joins

        let hostSet = false;
        if (!room.host && isHost) {
          // Claim or set host
          room.host = {
            socketId: socket.id,
            userName: userName || "Guest",
            isMuted,
            cameraOn,
          };
          hostSet = true;
        }

        // Add/update participant if not host
        const isCurrentHost = room.host?.socketId === socket.id;
        if (!isCurrentHost) {
          // Enforce max 4 members
          const totalMembers = (room.host ? 1 : 0) + room.participants.size + 1;
          if (totalMembers > 4) {
            return cb && cb({ error: "Room is full (max 4)" });
          }

          room.participants.set(socket.id, {
            userName: userName || "Guest",
            isMuted,
            cameraOn,
          });

          // Notify others of new participant
          socket.to(roomId).emit("user-connecting", {
            socketId: socket.id,
            userName,
            isHost: false,
            isMuted,
            cameraOn,
          });
        }

        // Handle host claiming with waiting participants
        if (hostSet && room.participants.size > 0) {
          const members = getMembers(room);
          interviewNamespace
            .to(roomId)
            .emit("host-arrived", { members, messages: room.messages });
          // Also emit user-connecting for host to trigger offers from participants
          socket.to(roomId).emit("user-connecting", {
            socketId: socket.id,
            userName,
            isHost: true,
            isMuted,
            cameraOn,
          });
        }

        // Send response based on current state
        if (room.host) {
          const members = getMembers(room);
          cb && cb({ roomId, members, messages: room.messages });
          updateUserCount(roomId, interviewNamespace);
        } else {
          cb && cb({ pending: true, roomId, messages: [] });
        }
      }
    );

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

      // ✅ Only host can request monitoring
      if (room.host?.socketId !== socket.id) {
        socket.emit("monitoring-error", { error: "Only host can monitor" });
        return;
      }

      // Get or init host's monitoring set
      let roomMonitorData = roomMonitoring.get(roomId);
      if (!roomMonitorData) {
        roomMonitorData = new Map();
        roomMonitoring.set(roomId, roomMonitorData);
      }
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

        // 🔹 Notify participant to stop emitting screenshots and events
        interviewNamespace
          .to(targetId)
          .emit("disable-monitor", { roomId, monitorId: socket.id });
      } else {
        // Start monitoring
        hostTargets.add(targetId);
        roomMonitorData.set(socket.id, hostTargets);
        roomMonitoring.set(roomId, roomMonitorData);

        // Notify participant to enable event emission
        interviewNamespace
          .to(targetId)
          .emit("enable-monitor", { roomId, monitorId: socket.id });

        // Notify host client: start
        socket.emit("monitoring-updated", { targetId, action: "start" });
      }
    });

    socket.on("get-current-monitoring", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.host?.socketId !== socket.id) {
        return;
      }

      const roomMonitorData = roomMonitoring.get(roomId);
      const hostTargets = roomMonitorData?.get(socket.id) || new Set();

      socket.emit("current-monitoring", {
        monitoredIds: Array.from(hostTargets),
        roomId,
      });
    });

    // 🔹 UPDATED: When a participant emits a monitor-event
    // Updated monitor-event handler in interview_socket.js
    socket.on("monitor-event", async ({ roomId, socketId, event }) => {
      const room = rooms.get(roomId);
      if (!room) {
        return;
      }

      const roomMonitorData = roomMonitoring.get(roomId);
      if (!roomMonitorData) return; // No monitoring active

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

          // 🔹 Handle overlay detection for screenshot events
          if (event.type === "screenshot") {
            const base64Screenshot = event.data;
            if (!base64Screenshot) {
              interviewNamespace.to(hostId).emit("monitoring-error", {
                socketId,
                error: "Missing screenshot data",
              });
              continue; // Changed from 'return' to 'continue' to allow processing other hosts if any
            }
            try {
              const apiBase = process.env.API_BASE_URL2;

              const response = await axios.post(
                `${apiBase}/overlay/detect`,
                { screenshot: base64Screenshot }, // MUST match FastAPI param name
                {
                  headers: {
                    "Content-Type": "application/json",
                    "X-Socket-ID": socketId,
                  },
                  maxContentLength: Infinity,
                  maxBodyLength: Infinity,
                }
              );

              // Emit overlay result to host
              interviewNamespace.to(hostId).emit("overlay-detection-result", {
                socketId,
                detected: response.data.detected,
                processedScreenshotB64: response.data.processed_screenshot_b64,
                coords: response.data.coords,
              });
            } catch (err) {
              console.error(
                `Overlay detection failed for socket ${socketId}:`,
                err
              ); // Added logging for debugging
              interviewNamespace.to(hostId).emit("overlay-detection-error", {
                socketId,
                error: err.message || "Unknown overlay detection error",
              });
            }
            continue; // Skip raw forward for screenshot events (success or failure)
          } else {
            // Forward non-screenshot events
            interviewNamespace.to(hostId).emit("monitor-event", payload);
          }
        }
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

      if (room.host?.socketId !== socket.id) {
        return;
      }

      if (room.participants.has(socketId)) {
        room.participants.delete(socketId);
        interviewNamespace.to(socketId).emit("removed-by-host");
        interviewNamespace.sockets.get(socketId)?.leave(roomId);

        // Emit full updated members after removal
        const updatedMembers = getMembers(room);
        interviewNamespace
          .to(roomId)
          .emit("participants-updated", { members: updatedMembers });

        // notify others
        interviewNamespace.to(roomId).emit("user-removed", { socketId });
        updateUserCount(roomId, interviewNamespace);
      }
    });

    socket.on(
      "participant-update",
      ({ socketId, isMuted, cameraOn, roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Update stored state for host or participant
        if (room.host?.socketId === socketId) {
          room.host.isMuted = isMuted;
          room.host.cameraOn = cameraOn;
        } else if (room.participants.has(socketId)) {
          const participant = room.participants.get(socketId);
          participant.isMuted = isMuted;
          participant.cameraOn = cameraOn;
        }

        // Broadcast update to room
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
