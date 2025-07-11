import { useState } from 'react';
import axios from 'axios';

const Login = ({ onSuccess }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(
        'https://3b1d208aefe0.ngrok-free.app/api/users/login',
        form,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      const user = res.data.user;
      localStorage.setItem('currentUser', JSON.stringify(user)); // ✅ сохраняем
      onSuccess(user);
    } catch (err) {
      const msg = err.response?.data?.message || 'Ошибка входа';
      setError(msg);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>Вход</h2>
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        placeholder="Пароль"
        value={form.password}
        onChange={handleChange}
      />
      <button type="submit">Войти</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
};

export default Login;
