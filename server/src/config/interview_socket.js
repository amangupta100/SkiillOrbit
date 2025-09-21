const rooms = new Map();

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
    socket.to(roomId).emit("room-closed");
    console.log(`Host left, room ${roomId} closed`);
  } else {
    if (room.participants.size === 0 && !room.host) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
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
    console.log("Interview socket connected", socket.id);

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
        socket.join(roomId);
        console.log(`Room ${roomId} created by ${socket.id} (${userName})`);
      } else {
        // room already exists → just acknowledge
        console.log(`Room ${roomId} already exists, skipping create`);
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
      console.log(`${userName} joined ${roomId}`);
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
        console.log("Non-host tried to remove a participant");
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
        console.log(
          `Participant ${socketId} removed by host in room ${roomId}`
        );
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
