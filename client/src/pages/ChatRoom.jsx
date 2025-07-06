import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('https://6fbf-5-133-123-139.ngrok-free.app');

const ChatRoom = ({ groupId, currentUser }) => {
  const [group, setGroup] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (groupId) {
      socket.emit('joinGroup', groupId);
    }
  }, [groupId]);

  useEffect(() => {
    socket.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('newMessage');
    };
  }, []);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await axios.get(
          `/api/groups/${groupId}/user/${currentUser._id}`
        );

        setGroup(res.data);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Ошибка получения группы:', err.response?.data || err);
      }
    };

    fetchGroup();
  }, [groupId, currentUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        setAllUsers(res.data);
      } catch (err) {
        console.error('Ошибка получения юзеров:', err);
      }
    };

    fetchUsers();
  }, []);

  const isAdmin = group?.admins?.some(
    (id) =>
      id === currentUser._id ||
      (typeof id === 'object' && id._id === currentUser._id)
  );

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${groupId}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Ошибка получения сообщений:', err);
      }
    };

    fetchMessages();
  }, [groupId]);

  const handleSend = async () => {
    if (text.trim()) {
      const message = {
        text,
        groupId,
        sender: currentUser._id,
      };

      try {
        await axios.post('/api/messages', message);
      } catch (err) {
        console.error('Ошибка при отправке сообщения:', err);
      }

      setText('');
    }
  };

  const handleAddUser = async (userId) => {
    try {
      await axios.post(`/api/groups/${groupId}/add-user`, {
        userId,
        requesterId: currentUser._id,
      });

      alert('Пользователь добавлен!');
      setGroup((prev) => ({
        ...prev,
        users: [...prev.users, { _id: userId }],
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  };

  if (!group) return <p>Загрузка группы...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>{group.name}</h2>

      <div
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
        }}
      >
        {messages.map((msg, idx) => {
          const senderId = msg.sender?._id || msg.sender;
          const senderName =
            typeof msg.sender === 'object' && msg.sender?.name
              ? msg.sender.name
              : 'Неизвестный';

          const createdAt = msg.createdAt ? new Date(msg.createdAt) : null;
          const timeString =
            createdAt?.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) || '—';

          return (
            <div key={idx}>
              <strong>
                {senderId === currentUser._id ? 'Вы' : senderName}
              </strong> 
              : {msg.text}
              <span style={{ float: 'right', fontSize: '0.8em' }}>
                {timeString}
              </span>
            </div>
          );
        })}
      </div>

      <input
        type="text"
        placeholder="Написать сообщение"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleSend}>Отправить</button>

      {isAdmin && (
        <div style={{ marginTop: '20px' }}>
          <h4>Добавить пользователя в группу:</h4>
          {allUsers
            .filter((u) => !group.users.some((gu) => gu._id === u._id))
            .map((u) => (
              <div key={u._id} style={{ marginBottom: '5px' }}>
                {u.name}
                <button
                  style={{ marginLeft: '10px' }}
                  onClick={() => handleAddUser(u._id)}
                >
                  Добавить
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
