import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import { authAPI, adminAPI, studentAPI, marksAPI, attendanceAPI, eventsAPI, announcementsAPI, subjectAPI, downloadBlob } from './services/api';

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password, role, remember: true });
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
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
          <strong>Demo Credentials:</strong><br />
          Admin: admin@cuchd.in / admin@123<br />
          Student: student@cuchd.in / student@123<br />
          Faculty: faculty@cumail.in / faculty@123
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
function AdminDashboard() {
  const [stats, setStats] = useState({ total_students: 0, total_faculty: 0, active_events: 0, total_users: 0 });
  const [users, setUsers] = useState([]);
  const [role, setRoleFilter] = useState('student');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

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
      const res = await adminAPI.getUsers({ role });
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
      const res = await adminAPI.importUsers(file, role);
      setImportResult({ success: true, ...res.data });
      loadUsers();
      loadStats();
    } catch (err) {
      setImportResult({ success: false, message: err.response?.data?.detail || 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await adminAPI.exportUsers(role);
      downloadBlob(res.data, `${role}s_export_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const handleLogout = async () => {
    await authAPI.logout();
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sb-brand">
          <div className="brand-icon">🎓</div>
          <div>
            <div className="brand-name">CampusIQ</div>
            <div className="brand-role">Admin Panel</div>
          </div>
        </div>

        <div className="nav-sec">MAIN MENU</div>
        <div className="nav-a active">
          <span className="ni">📊</span>
          Dashboard
        </div>
        <div className="nav-a">
          <span className="ni">👥</span>
          User Management
        </div>

        <div className="sb-bot">
          <button className="btn bo sm" onClick={handleLogout} style={{ width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main">
        <div className="topbar">
          <div>
            <div className="tb-title">Admin Dashboard</div>
            <div className="tb-sub">Manage your institution</div>
          </div>
        </div>

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

          {/* User Management */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">User Management - Excel Import/Export</div>
                <div className="card-sub">Add, edit and manage all portal users via Excel</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn bg sm" onClick={() => handleDownloadTemplate(role)}>
                  📥 Download Template
                </button>
                <label className="btn bp sm" style={{ cursor: 'pointer' }}>
                  📤 Import Excel
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                    disabled={importing}
                  />
                </label>
                <button className="btn bs sm" onClick={handleExport}>
                  ⬇ Export Excel
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Role Filter */}
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <button
                  className={`btn sm ${role === 'student' ? 'bp' : 'bo'}`}
                  onClick={() => setRoleFilter('student')}
                >
                  🎓 Students ({stats.total_students})
                </button>
                <button
                  className={`btn sm ${role === 'faculty' ? 'bp' : 'bo'}`}
                  onClick={() => setRoleFilter('faculty')}
                >
                  👨‍🏫 Faculty ({stats.total_faculty})
                </button>
              </div>

              {/* Import Result */}
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
                      {role === 'student' ? (
                        <>
                          <th>Dept</th>
                          <th>Batch</th>
                          <th>Semester</th>
                        </>
                      ) : (
                        <>
                          <th>Employee Code</th>
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
                          No {role}s found. Import Excel file to add {role}s.
                        </td>
                      </tr>
                    ) : (
                      users.map((user, idx) => (
                        <tr key={user.id}>
                          <td>{idx + 1}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          {role === 'student' ? (
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
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STUDENT DASHBOARD
// ============================================================================
function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [marks, setMarks] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
    loadMarks();
    loadAttendance();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await studentAPI.getDashboard();
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  const loadMarks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await marksAPI.getStudentMarks(user.id);
      setMarks(res.data);
    } catch (err) {
      console.error('Error loading marks:', err);
    }
  };

  const loadAttendance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await attendanceAPI.getStudentAttendance(user.id);
      setAttendance(res.data.attendance);
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!dashboardData) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sb-brand">
          <div className="brand-icon">🎓</div>
          <div>
            <div className="brand-name">CampusIQ</div>
            <div className="brand-role">Student Portal</div>
          </div>
        </div>

        <div className="sb-user">
          <div className="avatar">{dashboardData.student.name.split(' ').map(n => n[0]).join('')}</div>
          <div>
            <div className="user-name">{dashboardData.student.name}</div>
            <div className="user-id">{dashboardData.student.email}</div>
          </div>
        </div>

        <div className="nav-sec">MAIN MENU</div>
        <div className="nav-a active">
          <span className="ni">📊</span>
          Dashboard
        </div>
        <div className="nav-a">
          <span className="ni">✅</span>
          Attendance
        </div>
        <div className="nav-a">
          <span className="ni">📈</span>
          CGPA Planner
        </div>

        <div className="sb-bot">
          <button className="btn bo sm" onClick={handleLogout} style={{ width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main">
        <div className="topbar">
          <div>
            <div className="tb-title">Good day, {dashboardData.student.name.split(' ')[0]} 👋</div>
            <div className="tb-sub">Semester {dashboardData.student.semester} • {dashboardData.student.dept} Department</div>
          </div>
        </div>

        <div className="content">
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
              <div className="sc-val">{dashboardData.events.length}</div>
              <div className="sc-sub">This month</div>
            </div>
            <div className="sum-card">
              <div className="sc-icon">📚</div>
              <div className="sc-label">Credits Earned</div>
              <div className="sc-val">{dashboardData.total_credits}</div>
              <div className="sc-sub">Total credits</div>
            </div>
          </div>

          {/* Low Attendance Warning */}
          {dashboardData.low_attendance && dashboardData.low_attendance.length > 0 && (
            <div className="card">
              <div className="card-header" style={{ background: 'var(--warn-bg)' }}>
                <div className="card-title" style={{ color: 'var(--warn)' }}>
                  ⚠️ Low Attendance Warning
                </div>
              </div>
              <div className="card-body">
                {dashboardData.low_attendance.map(subject => (
                  <div key={subject.subject_id} style={{ padding: '8px', marginBottom: '8px', background: 'var(--danger-bg)', borderRadius: '8px' }}>
                    <strong>{subject.subject}</strong> - {subject.percentage}% (below 75% threshold)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Overview */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Attendance Overview</div>
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
                      <th>Total</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(att => (
                      <tr key={att.subject_id}>
                        <td>{att.subject}</td>
                        <td>{att.code}</td>
                        <td style={{ color: 'var(--success)' }}>{att.present}</td>
                        <td style={{ color: 'var(--danger)' }}>{att.absent}</td>
                        <td>{att.total}</td>
                        <td>
                          <strong style={{ color: att.status === 'danger' ? 'var(--danger)' : 'var(--success)' }}>
                            {att.percentage}%
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Grades */}
          {marks && Object.keys(marks.semesters).length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Academic Performance</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--blue)' }}>
                  CGPA: {marks.cgpa} | Credits: {marks.total_credits}
                </div>
              </div>
              <div className="card-body">
                {Object.entries(marks.semesters).map(([sem, grades]) => (
                  <div key={sem} style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px', color: 'var(--navy)' }}>{sem}</h4>
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
                              <td><strong>{grade.grade}</strong></td>
                              <td>{grade.grade_point}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FACULTY DASHBOARD
// ============================================================================
function FacultyDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const navigate = useNavigate();

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
      const res = await attendanceAPI.getSubjectAttendance(subjectId, '09:00-10:00');
      setStudents(res.data.students);
      setSelectedSubject(res.data.subject);
      
      // Initialize attendance data
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
        session: '09:00-10:00',
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

  const handleLogout = async () => {
    await authAPI.logout();
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sb-brand">
          <div className="brand-icon">🎓</div>
          <div>
            <div className="brand-name">CampusIQ</div>
            <div className="brand-role">Faculty Portal</div>
          </div>
        </div>

        <div className="nav-sec">MAIN MENU</div>
        <div className="nav-a active">
          <span className="ni">✅</span>
          Mark Attendance
        </div>
        <div className="nav-a">
          <span className="ni">📝</span>
          Enter Marks
        </div>

        <div className="sb-bot">
          <button className="btn bo sm" onClick={handleLogout} style={{ width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main">
        <div className="topbar">
          <div>
            <div className="tb-title">Faculty Dashboard</div>
            <div className="tb-sub">Mark attendance and manage classes</div>
          </div>
        </div>

        <div className="content">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Mark Attendance - Excel Export Available</div>
              {selectedSubject && (
                <button className="btn bs sm" onClick={handleExportAttendance}>
                  ⬇ Export to Excel
                </button>
              )}
            </div>
            <div className="card-body">
              {/* Subject Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Select Subject</label>
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

              {/* Students List */}
              {students.length > 0 && (
                <>
                  <div className="table-scroll">
                    <table className="dt">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Roll No</th>
                          <th>Overall %</th>
                          <th>Today's Attendance</th>
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
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className={`btn sm ${attendanceData[student.id] === 'P' ? 'bs' : 'bo'}`}
                                  onClick={() => handleAttendanceChange(student.id, 'P')}
                                >
                                  ✓ Present
                                </button>
                                <button
                                  className={`btn sm ${attendanceData[student.id] === 'A' ? 'bd' : 'bo'}`}
                                  onClick={() => handleAttendanceChange(student.id, 'A')}
                                >
                                  ✗ Absent
                                </button>
                                <button
                                  className={`btn sm ${attendanceData[student.id] === 'L' ? 'bg' : 'bo'}`}
                                  onClick={() => handleAttendanceChange(student.id, 'L')}
                                >
                                  L Leave
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button className="btn bp" onClick={handleSubmitAttendance}>
                      ✓ Submit Attendance
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
