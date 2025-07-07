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
  const [showVideoChat, setShowVideoChat] = useState(false);

  const handleLoginOrRegister = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user)); // ✅ сохраняем юзера
    setCurrentUser(user);
    setShowLogin(false);
  };

  // ✅ при старте — восстановление пользователя
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setShowLogin(false);
    }
  }, []);

  // ✅ загрузка групп
  useEffect(() => {
    const fetchGroups = async () => {
      if (!currentUser) return;

      try {
        const res = await fetch(
          `https://c45d-188-113-200-157.ngrok-free.app/api/groups/by-user/${currentUser._id}`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Ошибка загрузки групп: ${res.status}`);
        }

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
      <div className="signblock">
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
      <button
        style={{ marginBottom: '10px' }}
        onClick={() => {
          localStorage.removeItem('currentUser'); // ✅ удаляем юзера
          setCurrentUser(null);
          setSelectedGroupId(null);
          setShowLogin(true);
        }}
      >
        🔒 Выйти
      </button>

      <h3>Ваши группы:</h3>
      <div className="chatview">
        <div className="chatlist">
          {groups.length === 0 ? (
            <p>Вы не состоите ни в одной группе</p>
          ) : (
            groups.map((group) => (
              <div key={group._id} style={{ marginBottom: '10px' }}>
                <button
                  className="chat-button"
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

        {/* Контент — чат или видеочат */}
        <div className="chat-content" style={{ flex: 1 }}>
          {selectedGroupId && !showVideoChat && (
            <ChatRoom groupId={selectedGroupId} currentUser={currentUser} />
          )}

          {selectedGroupId && showVideoChat && (
            <>
              <VideoChat roomId={selectedGroupId} currentUser={currentUser} />
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => setShowVideoChat(false)}>
                  ⬅ Вернуться в чат
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
