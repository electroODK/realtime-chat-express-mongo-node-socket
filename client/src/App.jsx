import { useState, useEffect } from 'react';
import Register from './pages/Register';
import ChatRoom from './pages/ChatRoom';
import Login from './pages/Login';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  const handleLoginOrRegister = (user) => {
    setCurrentUser(user);
    setShowLogin(null);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      if (!currentUser) return;

      try {
        const res = await fetch(`/api/groups/by-user/${currentUser._id}`);
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
      <div>
        {showLogin ? (
          <>
            <Login onSuccess={handleLoginOrRegister} />
            <p>
              Нет аккаунта?{' '}
              <button onClick={() => setShowLogin(false)}>Зарегистрироваться</button>
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
      {groups.length === 0 ? (
        <p>Вы не состоите ни в одной группе</p>
      ) : (
        groups.map((group) => (
          <button
            key={group._id}
            onClick={() => setSelectedGroupId(group._id)}
            style={{ marginBottom: '5px', display: 'block' }}
          >
            {group.name || `Группа ${group._id.slice(-5)}`}
          </button>
        ))
      )}

      {selectedGroupId && (
        <ChatRoom groupId={selectedGroupId} currentUser={currentUser} />
      )}
    </div>
  );
};

export default App;
