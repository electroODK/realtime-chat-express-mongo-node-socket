import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('https://c45d-188-113-200-157.ngrok-free.app', {
  transports: ['websocket'],
});

const VideoChat = ({ roomId, currentUser }) => {
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef();

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      if (userVideo.current) userVideo.current.srcObject = stream;

      if (!roomId || !currentUser?._id) {
        console.warn('⚠️ join-video-room: Некорректные данные', {
          roomId,
          userId: currentUser?._id,
        });
        return;
      }

      socket.emit('join-video-room', {
        roomId,
        userId: currentUser._id,
      });

      socket.on('all-users', (users) => {
        const newPeers = [];
        users.forEach((userId) => {
          const peer = createPeer(userId, socket.id, stream);
          peersRef.current.push({ peerId: userId, peer });
          newPeers.push({ peerId: userId, peer });
        });
        setPeers(newPeers);
      });

      socket.on('user-connected', ({ socketId: userId }) => {
        const peer = addPeer(userId, stream);
        peersRef.current.push({ peerId: userId, peer });
        setPeers((prev) => [...prev, { peerId: userId, peer }]);
      });

      socket.on('signal', ({ from, signal }) => {
        const item = peersRef.current.find((p) => p.peerId === from);
        if (item) item.peer.signal(signal);
      });

      socket.on('return-signal', ({ from, signal }) => {
        const item = peersRef.current.find((p) => p.peerId === from);
        if (item) item.peer.signal(signal);
      });

      socket.on('user-disconnected', (userId) => {
        const peerObj = peersRef.current.find((p) => p.peerId === userId);
        if (peerObj) peerObj.peer.destroy();

        peersRef.current = peersRef.current.filter((p) => p.peerId !== userId);
        setPeers((prev) => prev.filter((p) => p.peerId !== userId));
      });
    };

    init();

    return () => {
      socket.disconnect();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach(({ peer }) => peer.destroy());
    };
  }, [roomId, currentUser._id]);

  const createPeer = (targetId, callerId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('signal', {
        to: targetId,
        from: callerId,
        signal,
      });
    });

    return peer;
  };

  const addPeer = (incomingId, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('return-signal', {
        to: incomingId,
        from: socket.id,
        signal,
      });
    });

    return peer;
  };

  return (
    <div>
      <h3>Комната видеочата: {roomId}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <video
          ref={userVideo}
          autoPlay
          muted
          playsInline
          width={200}
          style={{ border: '2px solid green' }}
        />
        {peers.map(({ peerId, peer }) => (
          <Video key={peerId} peer={peer} />
        ))}
      </div>
    </div>
  );
};

const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video ref={ref} autoPlay playsInline width={200} />;
};

export default VideoChat;
