import { useState, useEffect } from 'react';
import Register from './pages/Register';
import ChatRoom from './pages/ChatRoom';
import Login from './pages/Login';
import VideoChat from './pages/VideoChat';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showVideoChat, setShowVideoChat] = useState(false); // ➕

  const handleLoginOrRegister = (user) => {
    setCurrentUser(user);
    setShowLogin(null);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      if (!currentUser) return;

      try {
        const res = await fetch(`https://6fbf-5-133-123-139.ngrok-free.app/api/groups/by-user/${currentUser._id}`);
        if (!res.ok) throw new Error('Ошибка загрузки групп');

        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error('Не удалось получить группы:', err.message);
      }
    };

    fetchGroups();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className='signblock'>
        {showLogin ? (
          <>
            <Login onSuccess={handleLoginOrRegister} />
            <p>
              Нет аккаунта?{' '}
              <button onClick={() => setShowLogin(false)}>
                Зарегистрироваться
              </button>
            </p>
          </>
        ) : (
          <>
            <Register onSuccess={handleLoginOrRegister} />
            <p>
              Уже есть аккаунт?{' '}
              <button onClick={() => setShowLogin(true)}>Войти</button>
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Добро пожаловать, {currentUser.name}!</h2>

      <h3>Ваши группы:</h3>
      <div className="chatview">
        <div className='chatlist'>
          {groups.length === 0 ? (
            <p>Вы не состоите ни в одной группе</p>
          ) : (
            groups.map((group) => (
              <div key={group._id} style={{ marginBottom: '10px' }}>
                <button
                  className='chat-button'
                  onClick={() => {
                    setSelectedGroupId(group._id);
                    setShowVideoChat(false);
                  }}
                >
                  💬 {group.name || `Группа ${group._id.slice(-5)}`}
                </button>
                <button
                  style={{ marginLeft: '10px' }}
                  onClick={() => {
                    setSelectedGroupId(group._id);
                    setShowVideoChat(true);
                  }}
                >
                  📹 Видеочат
                </button>
              </div>
            ))
          )}
        </div>

        {selectedGroupId && !showVideoChat && (
          <ChatRoom groupId={selectedGroupId} currentUser={currentUser} />
        )}

        {selectedGroupId && showVideoChat && (
          <VideoChat roomId={selectedGroupId} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

export default App;
