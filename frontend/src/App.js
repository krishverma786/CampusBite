import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import './App.css';
import { authAPI, adminAPI, studentAPI, marksAPI, attendanceAPI, eventsAPI, announcementsAPI, subjectAPI, facultySeatsAPI, timetableAPI, downloadBlob } from './services/api';

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function Sidebar({ role, user, currentPage, onNavigate, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const adminMenus = [
    { icon: '📊', label: 'Analytics', page: 'analytics' },
    { icon: '👥', label: 'User Management', page: 'users' },
    { icon: '📚', label: 'Subjects & Timetable', page: 'subjects' },
    { icon: '📅', label: 'Events', page: 'events' },
    { icon: '📢', label: 'Announcements', page: 'announcements' },
    { icon: '🗺️', label: 'Faculty Seating', page: 'seats' },
  ];

  const studentMenus = [
    { icon: '📊', label: 'Dashboard', page: 'dashboard' },
    { icon: '✅', label: 'My Attendance', page: 'attendance' },
    { icon: '📈', label: 'CGPA Planner', page: 'cgpa' },
    { icon: '🗓️', label: 'Timetable', page: 'timetable' },
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
        
        if (response.data.user.must_change_password) {
          navigate('/change-password');
        } else {
          navigate(response.data.redirect);
        }
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
            <button className="btn sm bp" onClick={() => quickFill('student')}>🎓 Student</button>
            <button className="btn sm bp" onClick={() => quickFill('faculty')}>👨‍🏫 Faculty</button>
            <button className="btn sm bp" onClick={() => quickFill('admin')}>🛡️ Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN - USER MANAGEMENT
// ============================================================================
function AdminUserManagement() {
  const [stats, setStats] = useState({ total_students: 0, total_faculty: 0, active_events: 0, total_users: 0 });
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('student');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'student', dept: '', batch: '', semester: 1
  });

  useEffect(() => {
    loadStats();
    loadUsers();
    // eslint-disable-next-line
  }, [roleFilter]);

  const loadStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ role: roleFilter });
      setUsers(res.data.users);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const res = await adminAPI.importUsers(file, roleFilter);
      setImportResult({ success: true, ...res.data });
      loadUsers();
      loadStats();
    } catch (err) {
      setImportResult({ success: false, message: err.response?.data?.detail || 'Import failed' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const res = await adminAPI.exportUsers(roleFilter);
      downloadBlob(res.data, `${roleFilter}s_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      alert('Export failed');
    }
  };

  const handleDownloadTemplate = async (type) => {
    try {
      const res = await adminAPI.getTemplate(type);
      downloadBlob(res.data, `${type}_template.xlsx`);
    } catch (err) {
      alert('Template download failed');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(newUser);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'student', dept: '', batch: '', semester: 1 });
      loadUsers();
      loadStats();
      alert('✅ User added successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add user');
    }
  };

  return (
    <div className="content">
      {/* Stats */}
      <div className="sum-grid">
        <div className="sum-card">
          <div className="sc-icon">🎓</div>
          <div className="sc-label">Students</div>
          <div className="sc-val">{stats.total_students}</div>
          <div className="sc-sub">Active enrollments</div>
        </div>
        <div className="sum-card">
          <div className="sc-icon">👨‍🏫</div>
          <div className="sc-label">Faculty</div>
          <div className="sc-val">{stats.total_faculty}</div>
          <div className="sc-sub">All departments</div>
        </div>
        <div className="sum-card">
          <div className="sc-icon">📅</div>
          <div className="sc-label">Events</div>
          <div className="sc-val">{stats.active_events}</div>
          <div className="sc-sub">This semester</div>
        </div>
        <div className="sum-card">
          <div className="sc-icon">👤</div>
          <div className="sc-label">Total Users</div>
          <div className="sc-val">{stats.total_users}</div>
          <div className="sc-sub">All roles</div>
        </div>
      </div>

      {/* User Management Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">User Management - Excel Import/Export</div>
            <div className="card-sub">Add, edit and manage all portal users via Excel</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn sm bo" onClick={() => setShowAddUser(true)}>
              ➕ Add User
            </button>
            <button className="btn bg sm" onClick={() => handleDownloadTemplate(roleFilter)}>
              📥 Template
            </button>
            <label className="btn bp sm" style={{ cursor: 'pointer' }}>
              📤 Import
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImport}
                style={{ display: 'none' }}
                disabled={importing}
              />
            </label>
            <button className="btn bs sm" onClick={handleExport}>
              ⬇ Export
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Role Filter */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn sm ${roleFilter === 'student' ? 'bp' : 'bo'}`}
              onClick={() => setRoleFilter('student')}
            >
              🎓 Students ({stats.total_students})
            </button>
            <button
              className={`btn sm ${roleFilter === 'faculty' ? 'bp' : 'bo'}`}
              onClick={() => setRoleFilter('faculty')}
            >
              👨‍🏫 Faculty ({stats.total_faculty})
            </button>
          </div>

          {/* Import Result */}
          {importing && <div className="success-msg">⏳ Importing...</div>}
          {importResult && (
            <div className={importResult.success ? 'success-msg' : 'error-msg'} style={{ marginBottom: '16px' }}>
              {importResult.message}
              {importResult.success && (
                <div style={{ marginTop: '8px', fontSize: '12px' }}>
                  ✅ Added: {importResult.added} | ⚠️ Skipped: {importResult.skipped}<br />
                  Default Password: <strong>{importResult.default_password}</strong>
                </div>
              )}
            </div>
          )}

          {/* Users Table */}
          <div className="table-scroll">
            <table className="dt">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  {roleFilter === 'student' ? (
                    <>
                      <th>Dept</th>
                      <th>Batch</th>
                      <th>Semester</th>
                    </>
                  ) : (
                    <>
                      <th>Emp Code</th>
                      <th>Room</th>
                      <th>Mobile</th>
                    </>
                  )}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                      No {roleFilter}s found. Import Excel file to add {roleFilter}s.
                    </td>
                  </tr>
                ) : (
                  users.map((user, idx) => (
                    <tr key={user.id}>
                      <td>{idx + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      {roleFilter === 'student' ? (
                        <>
                          <td>{user.dept}</td>
                          <td>{user.batch}</td>
                          <td>{user.semester}</td>
                        </>
                      ) : (
                        <>
                          <td>{user.employee_code || user.batch}</td>
                          <td>{user.room_no}</td>
                          <td>{user.mobile}</td>
                        </>
                      )}
                      <td>
                        <span style={{ color: user.is_active ? 'var(--success)' : 'var(--danger)' }}>
                          {user.is_active ? '✅ Active' : '🔴 Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px' }}>Add New User</h3>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={newUser.dept} onChange={(e) => setNewUser({ ...newUser, dept: e.target.value })} />
              </div>
              {newUser.role === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Batch</label>
                    <input className="form-input" value={newUser.batch} onChange={(e) => setNewUser({ ...newUser, batch: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <input type="number" className="form-input" value={newUser.semester} onChange={(e) => setNewUser({ ...newUser, semester: parseInt(e.target.value) })} />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button type="button" className="btn bo" onClick={() => setShowAddUser(false)}>Cancel</button>
                <button type="submit" className="btn bp">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STUDENT DASHBOARD
// ============================================================================
function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await studentAPI.getDashboard();
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="content"><div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div></div>;
  if (!dashboardData) return <div className="content"><div style={{ textAlign: 'center', padding: '40px' }}>No data available</div></div>;

  return (
    <div className="content">
      {/* Low Attendance Warning */}
      {dashboardData.low_attendance && dashboardData.low_attendance.length > 0 && (
        <div style={{ background: 'var(--warn-bg)', border: '2px solid var(--warn)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--warn)', marginBottom: '8px' }}>
            ⚠️ Low Attendance Warning
          </div>
          {dashboardData.low_attendance.map(subject => (
            <div key={subject.subject_id} style={{ padding: '8px', marginBottom: '8px', background: 'white', borderRadius: '8px', fontSize: '13px' }}>
              Your attendance in <strong>{subject.subject}</strong> is at <strong>{subject.percentage}%</strong> — below the 75% threshold.
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="sum-grid">
        <div className="sum-card">
          <div className="sc-icon">📊</div>
          <div className="sc-label">Current CGPA</div>
          <div className="sc-val">{dashboardData.cgpa.toFixed(2)}</div>
          <div className="sc-sub">Out of 10.0</div>
        </div>
        <div className="sum-card">
          <div className="sc-icon">✅</div>
          <div className="sc-label">Avg. Attendance</div>
          <div className="sc-val">{dashboardData.avg_attendance}%</div>
          <div className="sc-sub">Across all subjects</div>
        </div>
        <div className="sum-card">
          <div className="sc-icon">📅</div>
          <div className="sc-label">Upcoming Events</div>
          <div className="sc-val">{dashboardData.events?.length || 0}</div>
          <div className="sc-sub">This month</div>
        </div>
        <div className="sum-card">
          <div className="sc-icon">📚</div>
          <div className="sc-label">Credits Earned</div>
          <div className="sc-val">{dashboardData.total_credits}</div>
          <div className="sc-sub">Total credits</div>
        </div>
      </div>

      {/* Upcoming Events */}
      {dashboardData.events && dashboardData.events.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Upcoming Events</div>
          </div>
          <div className="card-body">
            {dashboardData.events.map(event => (
              <div key={event.id} style={{ padding: '12px', marginBottom: '8px', background: 'var(--slate)', borderRadius: '8px', display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--blue)', minWidth: '40px', textAlign: 'center' }}>
                  {event.day}
                  <div style={{ fontSize: '12px', fontWeight: 'normal' }}>{event.month}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{event.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    {event.time} • {event.venue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STUDENT CGPA PLANNER
// ============================================================================
function StudentCGPAPlanner() {
  const [marks, setMarks] = useState(null);
  const [targetCGPA, setTargetCGPA] = useState('8.5');
  const [creditsThisSem, setCreditsThisSem] = useState('20');
  const [requiredSGPA, setRequiredSGPA] = useState(null);

  useEffect(() => {
    loadMarks();
  }, []);

  const loadMarks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await marksAPI.getStudentMarks(user.id);
      setMarks(res.data);
    } catch (err) {
      console.error('Error loading marks:', err);
    }
  };

  const calculateRequiredSGPA = () => {
    if (!marks || !targetCGPA || !creditsThisSem) return;
    
    const target = parseFloat(targetCGPA);
    const credits = parseFloat(creditsThisSem);
    const currentCGPA = marks.cgpa;
    const currentCredits = marks.total_credits;
    
    const required = ((target * (currentCredits + credits)) - (currentCGPA * currentCredits)) / credits;
    setRequiredSGPA(required.toFixed(2));
  };

  if (!marks) return <div className="content"><div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div></div>;

  return (
    <div className="content">
      {/* Current CGPA */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Current Academic Status</div>
        </div>
        <div className="card-body">
          <div className="sum-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="sum-card">
              <div className="sc-label">Current CGPA</div>
              <div className="sc-val" style={{ color: 'var(--blue)' }}>{marks.cgpa}</div>
              <div className="sc-sub">Out of 10.0</div>
            </div>
            <div className="sum-card">
              <div className="sc-label">Credits Earned</div>
              <div className="sc-val">{marks.total_credits}</div>
              <div className="sc-sub">Total credits</div>
            </div>
            <div className="sum-card">
              <div className="sc-label">Semesters Done</div>
              <div className="sc-val">{Object.keys(marks.semesters).length}</div>
              <div className="sc-sub">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Calculator */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🎯 Target CGPA Calculator</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Target CGPA</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={targetCGPA}
                onChange={(e) => setTargetCGPA(e.target.value)}
                placeholder="8.5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Credits This Semester</label>
              <input
                type="number"
                className="form-input"
                value={creditsThisSem}
                onChange={(e) => setCreditsThisSem(e.target.value)}
                placeholder="20"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn bp" onClick={calculateRequiredSGPA} style={{ width: '100%' }}>
                Calculate Required SGPA →
              </button>
            </div>
          </div>

          {requiredSGPA && (
            <div style={{ padding: '20px', background: 'var(--blue-bg)', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '8px' }}>
                You need to score an SGPA of
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--blue)' }}>
                {requiredSGPA}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>
                in this semester to achieve your target CGPA of {targetCGPA}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Semester-wise Grades */}
      {Object.entries(marks.semesters).map(([sem, grades]) => (
        <div key={sem} className="card">
          <div className="card-header">
            <div className="card-title">{sem}</div>
          </div>
          <div className="card-body">
            <div className="table-scroll">
              <table className="dt">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Credits</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>GP</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, idx) => (
                    <tr key={idx}>
                      <td>{grade.subject_name}</td>
                      <td>{grade.subject_code}</td>
                      <td>{grade.credits}</td>
                      <td>{grade.marks}</td>
                      <td><strong style={{ color: 'var(--blue)' }}>{grade.grade}</strong></td>
                      <td>{grade.grade_point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// STUDENT ATTENDANCE
// ============================================================================
function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await attendanceAPI.getStudentAttendance(user.id);
      setAttendance(res.data.attendance);
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  };

  const avgAttendance = attendance.length > 0
    ? (attendance.reduce((sum, a) => sum + a.percentage, 0) / attendance.length).toFixed(1)
    : 0;

  return (
    <div className="content">
      {/* Summary */}
      <div className="sum-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="sum-card">
          <div className="sc-icon">✅</div>
          <div className="sc-label">Overall Attendance</div>
          <div className="sc-val">{avgAttendance}%</div>
        </div>
        <div className="sum-card">
          <div className="sc-icon">📚</div>
          <div className="sc-label">Subjects</div>
          <div className="sc-val">{attendance.length}</div>
        </div>
        <div className="sum-card">
          <div className="sc-icon">⚠️</div>
          <div className="sc-label">At Risk</div>
          <div className="sc-val">{attendance.filter(a => a.percentage < 75).length}</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Subject-wise Attendance</div>
        </div>
        <div className="card-body">
          <div className="table-scroll">
            <table className="dt">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Leave</th>
                  <th>Total</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendance.map(att => (
                    <tr key={att.subject_id}>
                      <td>{att.subject}</td>
                      <td>{att.code}</td>
                      <td style={{ color: 'var(--success)' }}>{att.present}</td>
                      <td style={{ color: 'var(--danger)' }}>{att.absent}</td>
                      <td style={{ color: 'var(--gold)' }}>{att.leave}</td>
                      <td>{att.total}</td>
                      <td>
                        <strong style={{
                          color: att.status === 'danger' ? 'var(--danger)' :
                                 att.status === 'warning' ? 'var(--warn)' : 'var(--success)'
                        }}>
                          {att.percentage}%
                        </strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FACULTY MARK ATTENDANCE
// ============================================================================
function FacultyMarkAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [session, setSession] = useState('09:00-10:00');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await subjectAPI.list();
      setSubjects(res.data.subjects);
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  };

  const loadStudentsForAttendance = async (subjectId) => {
    try {
      const res = await attendanceAPI.getSubjectAttendance(subjectId, session);
      setStudents(res.data.students);
      setSelectedSubject(res.data.subject);
      
      const data = {};
      res.data.students.forEach(s => {
        data[s.id] = s.current_status || 'P';
      });
      setAttendanceData(data);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSubject) return;

    const records = Object.entries(attendanceData).map(([student_id, status]) => ({
      student_id,
      status
    }));

    try {
      await attendanceAPI.mark({
        subject_id: selectedSubject.id,
        session: session,
        records
      });
      alert('✅ Attendance saved successfully!');
      loadStudentsForAttendance(selectedSubject.id);
    } catch (err) {
      alert('❌ Failed to save attendance');
    }
  };

  const handleExportAttendance = async () => {
    try {
      const res = await attendanceAPI.export(selectedSubject?.id);
      downloadBlob(res.data, `attendance_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      alert('Export failed');
    }
  };

  const markAllAs = (status) => {
    const newData = {};
    students.forEach(s => {
      newData[s.id] = status;
    });
    setAttendanceData(newData);
  };

  return (
    <div className="content">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Mark Attendance</div>
          {selectedSubject && (
            <button className="btn bs sm" onClick={handleExportAttendance}>
              ⬇ Export to Excel
            </button>
          )}
        </div>
        <div className="card-body">
          {/* Subject and Session Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select
                className="form-input"
                onChange={(e) => loadStudentsForAttendance(e.target.value)}
                value={selectedSubject?.id || ''}
              >
                <option value="">-- Choose subject --</option>
                {subjects.map(subj => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name} ({subj.code}) - Sem {subj.semester}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Session</label>
              <select className="form-input" value={session} onChange={(e) => setSession(e.target.value)}>
                <option value="09:00-10:00">09:00-10:00</option>
                <option value="10:15-11:15">10:15-11:15</option>
                <option value="11:30-12:30">11:30-12:30</option>
                <option value="14:00-15:00">14:00-15:00</option>
                <option value="15:15-16:15">15:15-16:15</option>
              </select>
            </div>
          </div>

          {/* Quick Actions */}
          {students.length > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn sm bs" onClick={() => markAllAs('P')}>Mark All Present</button>
              <button className="btn sm bd" onClick={() => markAllAs('A')}>Mark All Absent</button>
            </div>
          )}

          {/* Students List */}
          {students.length > 0 ? (
            <>
              <div className="table-scroll">
                <table className="dt">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Roll No</th>
                      <th>Overall %</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr key={student.id}>
                        <td>{idx + 1}</td>
                        <td>{student.name}</td>
                        <td>{student.roll}</td>
                        <td>{student.overall_pct}%</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              className={`btn sm ${attendanceData[student.id] === 'P' ? 'bs' : 'bo'}`}
                              onClick={() => handleAttendanceChange(student.id, 'P')}
                            >
                              ✓ P
                            </button>
                            <button
                              className={`btn sm ${attendanceData[student.id] === 'A' ? 'bd' : 'bo'}`}
                              onClick={() => handleAttendanceChange(student.id, 'A')}
                            >
                              ✗ A
                            </button>
                            <button
                              className={`btn sm ${attendanceData[student.id] === 'L' ? 'bg' : 'bo'}`}
                              onClick={() => handleAttendanceChange(student.id, 'L')}
                            >
                              L
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '14px', padding: '10px', background: 'var(--blue-bg)', borderRadius: '8px' }}>
                  Present: {Object.values(attendanceData).filter(s => s === 'P').length} | 
                  Absent: {Object.values(attendanceData).filter(s => s === 'A').length} | 
                  Leave: {Object.values(attendanceData).filter(s => s === 'L').length}
                </div>
                <button className="btn bp" onClick={handleSubmitAttendance}>
                  ✓ Submit Attendance
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
              Select a subject to load students
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PORTAL LAYOUT
// ============================================================================
function PortalLayout({ role }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const renderPage = () => {
    if (role === 'admin') {
      switch (currentPage) {
        case 'users': return <AdminUserManagement />;
        default: return <AdminUserManagement />;
      }
    } else if (role === 'student') {
      switch (currentPage) {
        case 'dashboard': return <StudentDashboard />;
        case 'attendance': return <StudentAttendance />;
        case 'cgpa': return <StudentCGPAPlanner />;
        default: return <StudentDashboard />;
      }
    } else if (role === 'faculty') {
      switch (currentPage) {
        case 'attendance': return <FacultyMarkAttendance />;
        default: return <FacultyMarkAttendance />;
      }
    }
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      users: 'User Management',
      attendance: role === 'faculty' ? 'Mark Attendance' : 'My Attendance',
      cgpa: 'CGPA Planner',
    };
    return titles[currentPage] || 'Dashboard';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        role={role}
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />
      
      <div className="main">
        <Topbar
          title={getPageTitle()}
          subtitle={role === 'admin' ? 'Manage your institution' : role === 'student' ? `Semester ${user?.semester || 1}` : 'Faculty Portal'}
        />
        
        {renderPage()}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<PortalLayout role="admin" />} />
        <Route path="/student" element={<PortalLayout role="student" />} />
        <Route path="/faculty" element={<PortalLayout role="faculty" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
