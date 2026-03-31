import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import { authAPI, adminAPI, studentAPI, marksAPI, attendanceAPI, eventsAPI, announcementsAPI, subjectAPI, facultySeatsAPI, downloadBlob } from './services/api';

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function Sidebar({ role, user, currentPage, onNavigate, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const adminMenus = [
    { icon: '📊', label: 'Analytics', page: 'analytics' },
    { icon: '👥', label: 'User Management', page: 'users' },
    { icon: '📚', label: 'Subjects', page: 'subjects' },
    { icon: '📅', label: 'Events', page: 'events' },
    { icon: '📢', label: 'Announcements', page: 'announcements' },
    { icon: '🗺️', label: 'Faculty Seating', page: 'seats' },
  ];

  const studentMenus = [
    { icon: '📊', label: 'Dashboard', page: 'dashboard' },
    { icon: '✅', label: 'My Attendance', page: 'attendance' },
    { icon: '📈', label: 'CGPA Planner', page: 'cgpa' },
    { icon: '📅', label: 'Events', page: 'events' },
    { icon: '🗺️', label: 'Faculty Map', page: 'faculty-map' },
    { icon: '📢', label: 'Announcements', page: 'announcements' },
    { icon: '⚙️', label: 'Settings', page: 'settings' },
  ];

  const facultyMenus = [
    { icon: '📊', label: 'Dashboard', page: 'dashboard' },
    { icon: '✅', label: 'Mark Attendance', page: 'attendance' },
    { icon: '📝', label: 'Enter Marks', page: 'marks' },
    { icon: '📅', label: 'Events', page: 'events' },
    { icon: '🗺️', label: 'Faculty Map', page: 'faculty-map' },
    { icon: '⚙️', label: 'Settings', page: 'settings' },
  ];

  const menus = role === 'admin' ? adminMenus : role === 'student' ? studentMenus : facultyMenus;

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sb-brand">
          <div className="brand-icon">🎓</div>
          <div>
            <div className="brand-name">CampusIQ</div>
            <div className="brand-role">{role === 'admin' ? 'Admin' : role === 'student' ? 'Student' : 'Faculty'} Portal</div>
          </div>
        </div>

        {user && (
          <div className="sb-user">
            <div className="avatar">
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-id">{user.email}</div>
            </div>
          </div>
        )}

        <div className="nav-sec">MAIN MENU</div>
        {menus.map((menu, idx) => (
          <div
            key={idx}
            className={`nav-a ${currentPage === menu.page ? 'active' : ''}`}
            onClick={() => { onNavigate(menu.page); setIsOpen(false); }}
          >
            <span className="ni">{menu.icon}</span>
            {menu.label}
          </div>
        ))}

        <div className="sb-bot">
          <button className="btn bo sm" onClick={onLogout} style={{ width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </div>
      
      {isOpen && <div className="sidebar-overlay open" onClick={() => setIsOpen(false)}></div>}
      
      <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
    </>
  );
}

function Topbar({ title, subtitle }) {
  return (
    <div className="topbar">
      <div>
        <div className="tb-title">{title}</div>
        {subtitle && <div className="tb-sub">{subtitle}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// LOGIN PAGE
// ============================================================================
function LoginPage() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const demoCredentials = {
    student: { email: 'student@cuchd.in', password: 'student@123' },
    faculty: { email: 'faculty@cumail.in', password: 'faculty@123' },
    admin: { email: 'admin@cuchd.in', password: 'admin@123' }
  };

  const quickFill = (type) => {
    setEmail(demoCredentials[type].email);
    setPassword(demoCredentials[type].password);
    setRole(type);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password, role, remember: true });
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.access_token);
        navigate(response.data.redirect);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-icon" style={{ margin: '0 auto 16px', width: '48px', height: '48px', fontSize: '24px' }}>
            🎓
          </div>
          <h1 className="login-title">CampusIQ</h1>
          <p className="login-subtitle">Smart Campus Portal</p>
        </div>

        <div className="role-tabs">
          <button className={`role-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
            🎓 Student
          </button>
          <button className={`role-tab ${role === 'faculty' ? 'active' : ''}`} onClick={() => setRole('faculty')}>
            👨‍🏫 Faculty
          </button>
          <button className={`role-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
            🛡️ Admin
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email / ID</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px', background: 'var(--blue-bg)', borderRadius: '8px', fontSize: '12px' }}>
          <strong>Demo credentials - Click to quick fill:</strong><br />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button className="btn sm bp" type="button" onClick={() => quickFill('student')}>🎓 Student</button>
            <button className="btn sm bp" type="button" onClick={() => quickFill('faculty')}>👨‍🏫 Faculty</button>
            <button className="btn sm bp" type="button" onClick={() => quickFill('admin')}>🛡️ Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Continue in next message due to length...