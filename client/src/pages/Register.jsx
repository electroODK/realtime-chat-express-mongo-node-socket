import { useState } from 'react';
import axios from 'axios';

const Register = ({ onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(
        'https://3d2f-5-133-123-139.ngrok-free.app/api/users/register',
        form,{
          headers:{
            "ngrok-skip-browser-warning": 'true'
          }
        }
      );
      onSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
    }
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: '0 auto' }}
    >
      <h2>Регистрация</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        name="name"
        placeholder="Имя"
        value={form.name}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Пароль"
        value={form.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
};

export default Register;
