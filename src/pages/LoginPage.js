import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Очищаем любые сохраненные данные автозаполнения
  useEffect(() => {
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(input => {
      input.autocomplete = 'off';
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('spellcheck', 'false');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Валидация
    if (!username.trim()) {
      setError('Введите имя пользователя');
      return;
    }
    
    if (!password) {
      setError('Введите пароль');
      return;
    }
    
    console.log('Login attempt:', { 
      username: username.trim(), 
      passwordLength: password.length 
    });
    
    try {
      const result = await login(username.trim(), password);
      console.log('Login result:', result);
      
      if (result?.success) {
        navigate('/admin');
      } else {
        setError(result?.error || 'Неверный логин или пароль');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Ошибка при входе. Пожалуйста, попробуйте еще раз.');
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-form">
          <h1>Вход в админ панель</h1>
          <p>PARADISE_SHOP</p>
          
          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="form-group">
              <input
                type="text"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="form-input"
                required
              />
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <button type="submit" className="login-btn">Войти</button>
          </form>
          
          <div className="login-info">
            <p>Данные для входа:</p>
            <p>Логин: admin</p>
            <p>Пароль: paradise251208</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
