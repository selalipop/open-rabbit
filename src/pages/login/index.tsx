import { useState } from 'react';
import { login, signup } from './actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (event) => {
    event.preventDefault();
    login({ email, password }); // Pass the email and password to the login function
  };

  const handleSignup = (event) => {
    event.preventDefault();
    signup({ email, password }); // Pass the email and password to the signup function
  };

  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input 
        id="email" 
        name="email" 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)} 
        required 
      />
      <label htmlFor="password">Password:</label>
      <input 
        id="password" 
        name="password" 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)} 
        required 
      />
      <button onClick={handleLogin}>Log in</button>
      <button onClick={handleSignup}>Sign up</button>
    </form>
  );
}
