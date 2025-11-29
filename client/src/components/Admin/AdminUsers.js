import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../../utils/platformConfig';
import { getToken } from '../../utils/auth';
import { useTheme } from '../../contexts/ThemeContext';

const AdminUsers = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`${apiUrl}/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa user này?')) {
      return;
    }

    try {
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const response = await fetch(`${apiUrl}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      fetchUsers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const response = await fetch(`${apiUrl}/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setResetPasswordForm({
      newPassword: '',
      confirmPassword: ''
    });
    setShowResetPasswordModal(true);
  };

  const handleSaveResetPassword = async () => {
    if (!resetPasswordForm.newPassword || resetPasswordForm.newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setResettingPassword(true);
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const response = await fetch(`${apiUrl}/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPassword: resetPasswordForm.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      alert('Đã đổi mật khẩu thành công');
      setShowResetPasswordModal(false);
      setResetPasswordForm({
        newPassword: '',
        confirmPassword: ''
      });
      setSelectedUser(null);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Theme colors for dark mode support
  const themeColors = {
    bgPrimary: isDarkMode ? '#1a1a1a' : 'white',
    bgSecondary: isDarkMode ? '#2a2a2b' : '#f8fafc',
    textPrimary: isDarkMode ? '#ffffff' : '#1e293b',
    textSecondary: isDarkMode ? '#a0a0a0' : '#64748b',
    border: isDarkMode ? '#2a2a2b' : '#e5e7eb',
    buttonPrimary: isDarkMode ? '#0084ff' : '#3b82f6',
    buttonSuccess: isDarkMode ? '#00a651' : '#10b981',
    buttonDanger: isDarkMode ? '#ff4444' : '#ef4444',
    buttonDisabled: isDarkMode ? '#404040' : '#e5e7eb',
    buttonDisabledText: isDarkMode ? '#666666' : '#9ca3af',
    modalBg: isDarkMode ? '#2a2a2b' : 'white',
    inputBg: isDarkMode ? '#1a1a1a' : 'white',
    inputBorder: isDarkMode ? '#2a2a2b' : '#e5e7eb',
    inputText: isDarkMode ? '#ffffff' : '#1e293b',
    roleAdminBg: isDarkMode ? '#92400e' : '#fef3c7',
    roleAdminText: isDarkMode ? '#ffd700' : '#92400e',
    roleUserBg: isDarkMode ? '#1e3a5f' : '#dbeafe',
    roleUserText: isDarkMode ? '#60a5fa' : '#1e40af',
    statusOnlineBg: isDarkMode ? '#065f46' : '#d1fae5',
    statusOnlineText: isDarkMode ? '#34d399' : '#065f46',
    statusOfflineBg: isDarkMode ? '#404040' : '#f3f4f6',
    statusOfflineText: isDarkMode ? '#a0a0a0' : '#374151',
  };

  if (loading && users.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px', color: themeColors.textSecondary }}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div style={{
        backgroundColor: themeColors.bgPrimary,
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
        border: isDarkMode ? `1px solid ${themeColors.border}` : 'none'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{
              padding: '10px',
              border: `1px solid ${themeColors.inputBorder}`,
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: themeColors.inputBg,
              color: themeColors.inputText
            }}
          />
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            style={{
              padding: '10px',
              border: `1px solid ${themeColors.inputBorder}`,
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: themeColors.inputBg,
              color: themeColors.inputText
            }}
          >
            <option value="">Tất cả roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: '10px',
              border: `1px solid ${themeColors.inputBorder}`,
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: themeColors.inputBg,
              color: themeColors.inputText
            }}
          >
            <option value="">Tất cả status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="away">Away</option>
            <option value="recently_active">Recently Active</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: themeColors.bgPrimary,
        borderRadius: '12px',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        border: isDarkMode ? `1px solid ${themeColors.border}` : 'none'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: themeColors.bgSecondary, borderBottom: `2px solid ${themeColors.border}` }}>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: themeColors.textPrimary }}>ID</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: themeColors.textPrimary }}>User</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: themeColors.textPrimary }}>Email</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: themeColors.textPrimary }}>Role</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: themeColors.textPrimary }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: themeColors.textPrimary }}>Ngày tạo</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: themeColors.textPrimary }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                <td style={{ padding: '15px', fontSize: '14px', color: themeColors.textSecondary }}>{user.id}</td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          marginRight: '10px',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: themeColors.textPrimary }}>
                        {user.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: themeColors.textSecondary }}>@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '15px', fontSize: '14px', color: themeColors.textSecondary }}>{user.email}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: user.role === 'admin' ? themeColors.roleAdminBg : themeColors.roleUserBg,
                    color: user.role === 'admin' ? themeColors.roleAdminText : themeColors.roleUserText
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: user.status === 'online' ? themeColors.statusOnlineBg : themeColors.statusOfflineBg,
                    color: user.status === 'online' ? themeColors.statusOnlineText : themeColors.statusOfflineText
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '15px', fontSize: '14px', color: themeColors.textSecondary }}>
                  {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: themeColors.buttonPrimary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: themeColors.buttonSuccess,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Đổi MK
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: themeColors.buttonDanger,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          disabled={pagination.page === 1}
          style={{
            padding: '8px 16px',
            backgroundColor: pagination.page === 1 ? themeColors.buttonDisabled : themeColors.buttonPrimary,
            color: pagination.page === 1 ? themeColors.buttonDisabledText : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          Trước
        </button>
        <span style={{ fontSize: '14px', color: themeColors.textSecondary }}>
          Trang {pagination.page} / {pagination.totalPages}
        </span>
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          disabled={pagination.page >= pagination.totalPages}
          style={{
            padding: '8px 16px',
            backgroundColor: pagination.page >= pagination.totalPages ? themeColors.buttonDisabled : themeColors.buttonPrimary,
            color: pagination.page >= pagination.totalPages ? themeColors.buttonDisabledText : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          Sau
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: themeColors.modalBg,
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.8)' : '0 10px 25px rgba(0,0,0,0.2)',
            border: isDarkMode ? `1px solid ${themeColors.border}` : 'none'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: themeColors.textPrimary }}>Chỉnh sửa User</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: themeColors.textPrimary }}>
                  Tên đầy đủ
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${themeColors.inputBorder}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: themeColors.inputBg,
                    color: themeColors.inputText
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: themeColors.textPrimary }}>
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${themeColors.inputBorder}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: themeColors.inputBg,
                    color: themeColors.inputText
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: themeColors.textPrimary }}>
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${themeColors.inputBorder}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: themeColors.inputBg,
                    color: themeColors.inputText
                  }}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: themeColors.textPrimary }}>
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${themeColors.inputBorder}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: themeColors.inputBg,
                    color: themeColors.inputText
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: themeColors.textPrimary }}>
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${themeColors.inputBorder}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: themeColors.inputBg,
                    color: themeColors.inputText
                  }}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="away">Away</option>
                  <option value="recently_active">Recently Active</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: themeColors.buttonDisabled,
                  color: themeColors.textPrimary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '10px 20px',
                  backgroundColor: themeColors.buttonPrimary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: themeColors.modalBg,
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.8)' : '0 10px 25px rgba(0,0,0,0.2)',
            border: isDarkMode ? `1px solid ${themeColors.border}` : 'none'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: themeColors.textPrimary }}>Đổi mật khẩu</h3>
            {selectedUser && (
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: themeColors.textSecondary }}>
                Người dùng: {selectedUser.full_name || selectedUser.username}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: themeColors.textPrimary }}>
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${themeColors.inputBorder}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: themeColors.inputBg,
                    color: themeColors.inputText
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: themeColors.textPrimary }}>
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${themeColors.inputBorder}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: themeColors.inputBg,
                    color: themeColors.inputText
                  }}
                />
              </div>
              <p style={{ margin: '0', fontSize: '12px', color: themeColors.textSecondary, fontStyle: 'italic' }}>
                Mật khẩu phải có ít nhất 6 ký tự
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUser(null);
                  setResetPasswordForm({
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                disabled={resettingPassword}
                style={{
                  padding: '10px 20px',
                  backgroundColor: themeColors.buttonDisabled,
                  color: themeColors.textPrimary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: resettingPassword ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: resettingPassword ? 0.6 : 1
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveResetPassword}
                disabled={resettingPassword}
                style={{
                  padding: '10px 20px',
                  backgroundColor: resettingPassword ? themeColors.buttonDisabled : themeColors.buttonSuccess,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: resettingPassword ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {resettingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

