import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const socket = io('https://6fbf-5-133-123-139.ngrok-free.app'); 

const VideoChat = ({ currentUser, groupId, onClose }) => {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [callStarted, setCallStarted] = useState(false);

  const myVideo = useRef();
  const partnerVideo = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (myVideo.current) myVideo.current.srcObject = currentStream;

      socket.emit('join-video-room', groupId);

      socket.on('user-joined', (partnerId) => {
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: currentStream,
        });

        peer.on('signal', (signalData) => {
          socket.emit('video-signal', {
            to: partnerId,
            from: socket.id,
            signal: signalData,
          });
        });

        peer.on('stream', (partnerStream) => {
          if (partnerVideo.current) partnerVideo.current.srcObject = partnerStream;
        });

        setPeer(peer);
        setCallStarted(true);
      });

      socket.on('video-signal', ({ from, signal }) => {
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: currentStream,
        });

        peer.on('signal', (signalData) => {
          socket.emit('video-signal', {
            to: from,
            from: socket.id,
            signal: signalData,
          });
        });

        peer.on('stream', (partnerStream) => {
          if (partnerVideo.current) partnerVideo.current.srcObject = partnerStream;
        });

        peer.signal(signal);
        setPeer(peer);
        setCallStarted(true);
      });
    });

    return () => {
      leaveCall();
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
          <button onClick={() => { leaveCall(); onClose(); }}>
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
