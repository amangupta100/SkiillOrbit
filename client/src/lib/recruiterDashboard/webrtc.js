// webrtc.js
const DEFAULT_ICE = [
  { urls: "stun:stun.l.google.com:19302" },
  // Add TURN servers here in production
];

export function createWebRTCManager({
  socket,
  roomId,
  localStream,
  localSocketId,
  onRemoteStream,
  onParticipantsList,
}) {
  if (!socket) throw new Error("socket required");
  if (!roomId) throw new Error("roomId required");
  if (!localStream) throw new Error("localStream required");

  const pcs = {}; // socketId => RTCPeerConnection
  const dataChannels = {};
  let _localSocketId = localSocketId || socket.id;

  function normalizeMembers(members) {
    return members.map((m) => ({
      socketId: m.socketId,
      userName: m.userName,
      isHost: !!m.isHost,
    }));
  }

  function replaceTrack(newTrack) {
    Object.values(pcs).forEach((pc) => {
      const sender = pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender) {
        // replaceTrack is safe and supported in modern browsers
        try {
          sender.replaceTrack(newTrack);
        } catch (e) {
          console.warn(
            "replaceTrack failed, fallback to remove/add transceiver",
            e
          );
          // fallback: addTrack on transceiver or do a renegotiation if necessary
        }
      }
    });
  }

  function getOrCreatePC(remoteSocketId) {
    if (pcs[remoteSocketId]) return pcs[remoteSocketId];

    const pc = new RTCPeerConnection({ iceServers: DEFAULT_ICE });

    // add local tracks to this peer
    try {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }
    } catch (err) {
      console.warn("addTrack error", err);
    }

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        socket.emit("signal", {
          roomId,
          to: remoteSocketId,
          from: socket.id,
          data: { candidate: evt.candidate },
        });
      }
    };

    pc.ontrack = (evt) => {
      const remoteStream = evt.streams && evt.streams[0];
      if (remoteStream) {
        onRemoteStream && onRemoteStream(remoteSocketId, remoteStream, { pc });
      }
    };

    pc.onconnectionstatechange = () => {
      // optional: debug
      // console.log(`PC ${remoteSocketId} state:`, pc.connectionState);
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        // attempt cleanup for this peer
        closePeer(remoteSocketId);
      }
    };

    pcs[remoteSocketId] = pc;
    return pc;
  }

  async function createOfferTo(remoteSocketId) {
    const pc = getOrCreatePC(remoteSocketId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("signal", {
        roomId,
        to: remoteSocketId,
        from: socket.id,
        data: { sdp: pc.localDescription },
      });
    } catch (err) {
      console.error("createOffer error", err);
    }
  }

  async function handleSignal({ from, data }) {
    if (!from || !data) return;
    const pc = getOrCreatePC(from);

    if (data.sdp) {
      const remoteDesc = data.sdp;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));
      } catch (err) {
        console.error("setRemoteDescription failed", err);
        return;
      }

      if (remoteDesc.type === "offer") {
        try {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", {
            roomId,
            to: from,
            from: socket.id,
            data: { sdp: pc.localDescription },
          });
        } catch (err) {
          console.error("createAnswer error", err);
        }
      }
    } else if (data.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.warn("addIceCandidate failed", err);
      }
    }
  }

  // Close and cleanup a peer connection
  function closePeer(remoteSocketId) {
    const pc = pcs[remoteSocketId];
    if (pc) {
      try {
        // IMPORTANT: do NOT stop local tracks here.
        // Stopping sender.track would stop the local MediaStreamTrack globally,
        // causing local video to go black for ALL peers.
        pc.close();
      } catch (e) {
        console.warn("pc.close failed", e);
      }
      delete pcs[remoteSocketId];
    }
    if (dataChannels[remoteSocketId]) {
      try {
        dataChannels[remoteSocketId].close();
      } catch (e) {}
      delete dataChannels[remoteSocketId];
    }
  }

  function destroy() {
    Object.keys(pcs).forEach((id) => {
      try {
        pcs[id].close();
      } catch (e) {}
      delete pcs[id];
    });
    // do not stop localStream here; caller owns it
  }

  function attachSocketListeners() {
    // remove any existing listeners we registered earlier (idempotent)
    socket.off("signal");
    socket.off("user-joined");
    socket.off("user-left");
    socket.off("user-count");

    socket.on("signal", (payload) => {
      handleSignal(payload).catch && console.warn("signal handled");
    });

    socket.on("user-joined", ({ socketId: joinedSocketId, userName }) => {
      if (joinedSocketId === socket.id) return;
      setTimeout(() => createOfferTo(joinedSocketId), 100);
    });

    socket.on("user-left", ({ socketId: leftId }) => {
      // Ensure we clean the pc for the leaving peer
      closePeer(leftId);
    });
  }

  return {
    attach: () => attachSocketListeners(),
    createOfferTo,
    handleSignal,
    closePeer,
    destroy,
    replaceTrack,
    getPeerCount: () => Object.keys(pcs).length,
    peers: () => Object.keys(pcs),
  };
}
