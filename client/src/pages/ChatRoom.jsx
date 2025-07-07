import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('https://your-server-url.ngrok-free.app');

const VideoChat = ({ roomId, currentUser }) => {
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const videoGridRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      socket.emit('join-video-room', roomId);

      socket.on('all-users', (users) => {
        const newPeers = users.map((userId) => {
          const peer = createPeer(userId, socket.id, stream);
          peersRef.current.push({ peerId: userId, peer });
          return { peerId: userId, peer };
        });
        setPeers(newPeers);
      });

      socket.on('user-joined', (userId) => {
        const peer = addPeer(userId, stream);
        peersRef.current.push({ peerId: userId, peer });
        setPeers((prevPeers) => [...prevPeers, { peerId: userId, peer }]);
      });

      socket.on('user-signal', ({ from, signal }) => {
        const item = peersRef.current.find((p) => p.peerId === from);
        if (item) {
          item.peer.signal(signal);
        }
      });

      socket.on('receive-returned-signal', ({ from, signal }) => {
        const item = peersRef.current.find((p) => p.peerId === from);
        if (item) {
          item.peer.signal(signal);
        }
      });

      socket.on('user-left', (userId) => {
        const peerObj = peersRef.current.find((p) => p.peerId === userId);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        peersRef.current = peersRef.current.filter((p) => p.peerId !== userId);
        setPeers((prev) => prev.filter((p) => p.peerId !== userId));
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createPeer = (targetId, callerId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('sending-signal', {
        targetId,
        callerId,
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
      socket.emit('returning-signal', {
        targetId: incomingId,
        signal,
      });
    });

    return peer;
  };

  return (
    <div>
      <h2>Комната: {roomId}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <video ref={userVideo} autoPlay muted playsInline width={200} />
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
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video ref={ref} autoPlay playsInline width={200} />;
};

export default VideoChat;
