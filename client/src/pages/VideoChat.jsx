import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const socket = io('https://c45d-188-113-200-157.ngrok-free.app', {
  transports: ['websocket'],
});

const VideoChat = ({ currentUser, groupId, onClose }) => {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [callStarted, setCallStarted] = useState(false);

  const myVideo = useRef();
  const partnerVideo = useRef();

  useEffect(() => {
    let currentStream;

    const startMedia = async () => {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(currentStream);
      if (myVideo.current) myVideo.current.srcObject = currentStream;

      socket.emit('join-video-room', groupId);
    };

    startMedia();

    socket.on('user-joined', (partnerId) => {
      if (peer) return;

      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
      });

      newPeer.on('signal', (signalData) => {
        socket.emit('video-signal', {
          to: partnerId,
          from: socket.id,
          signal: signalData,
        });
      });

      newPeer.on('stream', (partnerStream) => {
        if (partnerVideo.current)
          partnerVideo.current.srcObject = partnerStream;
      });

      setPeer(newPeer);
      setCallStarted(true);
    });

    socket.on('video-signal', ({ from, signal }) => {
      if (peer) return;

      const newPeer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
      });

      newPeer.on('signal', (signalData) => {
        socket.emit('video-signal', {
          to: from,
          from: socket.id,
          signal: signalData,
        });
      });

      newPeer.on('stream', (partnerStream) => {
        if (partnerVideo.current)
          partnerVideo.current.srcObject = partnerStream;
      });

      newPeer.signal(signal);
      setPeer(newPeer);
      setCallStarted(true);
    });

    return () => {
      leaveCall();
      socket.off('user-joined');
      socket.off('video-signal');
    };
  }, []);

  const leaveCall = () => {
    peer?.destroy();
    stream?.getTracks().forEach((track) => track.stop());

    setPeer(null);
    setStream(null);
    setCallStarted(false);

    socket.emit('leave-video-room', groupId);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Видеозвонок</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <video ref={myVideo} autoPlay muted playsInline width={200} />
        <video ref={partnerVideo} autoPlay playsInline width={200} />
      </div>

      <div style={{ marginTop: '10px' }}>
        {callStarted ? (
          <button
            onClick={() => {
              leaveCall();
              onClose();
            }}
          >
            Завершить звонок
          </button>
        ) : (
          <p>Ожидаем подключения другого участника...</p>
        )}
      </div>
    </div>
  );
};

export default VideoChat;
