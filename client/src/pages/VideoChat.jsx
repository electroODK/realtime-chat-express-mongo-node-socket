import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('https://3b1d208aefe0.ngrok-free.app', {
  transports: ['websocket'],
});

const VideoChat = ({ roomId, currentUser }) => {
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef({});
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
        users.forEach((userId) => {
          const peer = createPeer(userId, socket.id, stream);
          peersRef.current[userId] = peer;
        });
      });

      socket.on('user-connected', ({ socketId }) => {
        const peer = addPeer(socketId, stream);
        peersRef.current[socketId] = peer;
      });

      socket.on('signal', ({ from, signal }) => {
        const peer = peersRef.current[from];
        if (peer) peer.signal(signal);
      });

      socket.on('return-signal', ({ from, signal }) => {
        const peer = peersRef.current[from];
        if (peer) peer.signal(signal);
      });

      socket.on('user-disconnected', (userId) => {
        const peer = peersRef.current[userId];
        if (peer) peer.destroy();

        delete peersRef.current[userId];
        setPeers((prev) => prev.filter((p) => p.peerId !== userId));
      });
    };

    init();

    return () => {
      socket.disconnect();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
    };
  }, [roomId, currentUser._id]);

  const createPeer = (targetId, callerId, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on('signal', (signal) => {
      socket.emit('signal', { to: targetId, from: callerId, signal });
    });

    peer.on('stream', (remoteStream) => {
      setPeers((prev) => [...prev, { peerId: targetId, stream: remoteStream }]);
    });

    return peer;
  };

  const addPeer = (incomingId, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on('signal', (signal) => {
      socket.emit('return-signal', {
        to: incomingId,
        from: socket.id,
        signal,
      });
    });

    peer.on('stream', (remoteStream) => {
      setPeers((prev) => [
        ...prev,
        { peerId: incomingId, stream: remoteStream },
      ]);
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
          <Video key={peerId} peerId={peerId} peer={peer} />
        ))}
      </div>
    </div>
  );
};

const Video = ({ peer }) => {
  const ref = useRef();
  const [streamReady, setStreamReady] = useState(false);

  useEffect(() => {
    const handleStream = (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
        setStreamReady(true); // 👉 теперь мы знаем, что можно показать видео
      }
    };

    peer.on('stream', handleStream);

    return () => {
      peer.removeListener('stream', handleStream);
    };
  }, [peer]);

  if (!streamReady) return null;

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      width={200}
      style={{ border: '2px solid blue' }}
    />
  );
};

export default VideoChat;
