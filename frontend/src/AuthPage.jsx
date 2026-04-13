import React, { useState } from 'react';
import axios from 'axios';
import { Wallet } from 'lucide-react';
import './AuthPage.css';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name:'', email:'', username:'', password:'' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        const payload = { password: formData.password };
        if (formData.email)    payload.email    = formData.email;
        if (formData.username) payload.username = formData.username;
        const res = await axios.post('/auth/login', payload);
        localStorage.setItem('token', res.data.data.accessToken);
        onLogin(res.data.data.user);
      } else {
        const res = await axios.post('/auth/signup', formData);
        localStorage.setItem('token', res.data.data.accessToken);
        onLogin(res.data.data.user);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        // Show specific Zod validation error e.g. "username: Username can only contain..."
        setError(data.errors.map(e => `${e.field}: ${e.message}`).join(' | '));
      } else {
        setError(data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsLogin(p => !p); setError(null); };

  return (
    <div className="auth-container">
      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="brand">
          <div className="brand-icon"><Wallet size={18} color="#fff" /></div>
          <span className="brand-text">FinTrack Pro</span>
        </div>

        <div className="auth-content">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="subtitle">
            {isLogin
              ? 'Enter your email and password to access your account'
              : 'Sign up to start tracking your finances today'}
          </p>

          <div className="social-btns">
            <button type="button" className="social-btn">
              <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button type="button" className="social-btn">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.78M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Apple
            </button>
          </div>

          <div className="divider"><span>Or Login With</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}

            {!isLogin && (
              <div className="input-row">
                <div className="input-group">
                  <label>Full Name*</label>
                  <input required type="text" placeholder="John Doe" value={formData.name} onChange={set('name')} />
                </div>
                <div className="input-group">
                  <label>Username*</label>
                  <input required type="text" placeholder="johndoe" value={formData.username} onChange={set('username')} />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Email{isLogin ? '' : '*'}</label>
              <input
                required={!isLogin}
                type="email"
                placeholder={isLogin ? 'sellkane@company.com' : 'your@email.com'}
                value={formData.email}
                onChange={set('email')}
              />
            </div>

            {isLogin && (
              <div className="input-group">
                <label>Username (or use Email above)</label>
                <input type="text" placeholder="your username" value={formData.username} onChange={set('username')} />
              </div>
            )}

            <div className="input-group">
              <label>Password*</label>
              <input required type="password" placeholder="••••••••" value={formData.password} onChange={set('password')} />
              {!isLogin && <span style={{fontSize:'11px',color:'#6b7280',marginTop:3,display:'block'}}>Minimum 6 characters</span>}
            </div>

            {isLogin && (
              <div className="form-footer">
                <label className="remember-me">
                  <input type="checkbox" /> Remember Me
                </label>
                <button type="button" className="forgot-link">Forgot Your Password?</button>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Please wait…' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <p className="toggle-text">
            {isLogin ? "Don't have an Account? " : 'Already have an account? '}
            <button type="button" className="toggle-btn" onClick={switchMode}>
              {isLogin ? 'Register Now' : 'Sign In'}
            </button>
          </p>
        </div>

        <div className="auth-footer">
          <span>Copyright © 2025 FinTrack Pro</span>
          <a href="#">Privacy Policy</a>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="right-content">
          <h2>Effortlessly manage your finances and spending.</h2>
          <p>Log in to access your dashboard, set your monthly budget, and track every expense in real time.</p>

          <div className="mockup-stack">
            {/* Card 1: Balance */}
            <div className="mockup-card">
              <div className="mc-top">
                <span className="mc-label">Main Balance</span>
                <span className="mc-tag">April 2024</span>
              </div>
              <div className="mc-row" style={{ gap: 32, alignItems: 'flex-end' }}>
                <div>
                  <div className="mc-value">₹1,08,374</div>
                  <div className="mc-sub">Starting amount this month</div>
                </div>
                <div className="mc-stats">
                  <div className="mc-stat">
                    <div className="mc-stat-val">₹25,894</div>
                    <div className="mc-stat-lbl">Spent</div>
                  </div>
                  <div className="mc-stat">
                    <div className="mc-stat-val" style={{ color: '#86efac' }}>₹82,480</div>
                    <div className="mc-stat-lbl">Remaining</div>
                  </div>
                </div>
              </div>
              <div className="mc-bars">
                {[35, 55, 45, 70, 60, 80, 65, 90, 75, 100, 85, 60].map((h, i) => (
                  <div key={i} className={`mc-bar${i === 10 ? ' active' : ''}`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* Card 2: Expenses */}
            <div className="mockup-card">
              <div className="mc-top">
                <span className="mc-label">Recent Expenses</span>
                <span className="mc-tag">5,249 entries</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['🍔 Food', '₹2,340'], ['🚗 Transport', '₹890'], ['🏠 Housing', '₹12,000']].map(([name, val]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>{name}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
