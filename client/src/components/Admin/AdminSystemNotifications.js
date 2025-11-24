import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../../utils/platformConfig';
import { getToken } from '../../utils/auth';

const AdminSystemNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ category: '' });
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Cập nhật tài khoản',
    title: '',
    description: '',
    target_audience: 'all',
    target_user_ids: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [pagination.page, filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`${apiUrl}/admin/system-notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to fetch notifications';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, get text
          const text = await response.text();
          if (text) {
            errorMessage = `Server error: ${text.substring(0, 100)}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      alert('Vui lòng điền đầy đủ tiêu đề và mô tả');
      return;
    }

    try {
      setSubmitting(true);
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const payload = {
        category: formData.category,
        title: formData.title,
        description: formData.description,
        target_audience: formData.target_audience,
        target_user_ids: formData.target_audience === 'specific' && formData.target_user_ids
          ? formData.target_user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
          : null
      };

      const response = await fetch(`${apiUrl}/admin/system-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create notification');
      }

      alert('Gửi thông báo hệ thống thành công!');
      setShowForm(false);
      setFormData({
        category: 'Cập nhật tài khoản',
        title: '',
        description: '',
        target_audience: 'all',
        target_user_ids: ''
      });
      fetchNotifications();
    } catch (err) {
      alert('Lỗi: ' + err.message);
      console.error('Error creating notification:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      return;
    }

    try {
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const response = await fetch(`${apiUrl}/admin/system-notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      fetchNotifications();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day} tháng ${month}`;
  };

  if (loading && notifications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px', color: '#ef4444' }}>Lỗi: {error}</div>
        <button
          onClick={fetchNotifications}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
          Quản lý Thông báo Hệ thống
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {showForm ? 'Hủy' : '+ Gửi thông báo mới'}
        </button>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            Gửi thông báo hệ thống
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Danh mục
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="Cập nhật tài khoản">Cập nhật tài khoản</option>
                <option value="Plan of Publisher">Plan of Publisher</option>
                <option value="Thông báo hệ thống">Thông báo hệ thống</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Tiêu đề *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề thông báo"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Mô tả *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả thông báo"
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Đối tượng nhận
              </label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">Tất cả người dùng</option>
                <option value="specific">Người dùng cụ thể</option>
              </select>
            </div>

            {formData.target_audience === 'specific' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Danh sách User IDs (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formData.target_user_ids}
                  onChange={(e) => setFormData({ ...formData, target_user_ids: e.target.value })}
                  placeholder="Ví dụ: 1, 2, 3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: submitting ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {submitting ? 'Đang gửi...' : 'Gửi thông báo'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    category: 'Cập nhật tài khoản',
                    title: '',
                    description: '',
                    target_audience: 'all',
                    target_user_ids: ''
                  });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="">Tất cả danh mục</option>
          <option value="Cập nhật tài khoản">Cập nhật tài khoản</option>
          <option value="Plan of Publisher">Plan of Publisher</option>
          <option value="Thông báo hệ thống">Thông báo hệ thống</option>
        </select>
      </div>

      {/* Notifications List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Danh mục</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Tiêu đề</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Đối tượng</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Ngày tạo</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <tr key={notification.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{notification.id}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{notification.category}</td>
                <td style={{ padding: '12px', fontSize: '14px', maxWidth: '300px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {notification.title}
                  </div>
                </td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {notification.target_audience === 'all' ? 'Tất cả' : 'Cụ thể'}
                </td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {formatDate(notification.created_at)}
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={() => handleDelete(notification.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {notifications.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Chưa có thông báo hệ thống nào
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            style={{
              padding: '8px 16px',
              backgroundColor: pagination.page === 1 ? '#e5e7eb' : '#3b82f6',
              color: pagination.page === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Trước
          </button>
          <span style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
            style={{
              padding: '8px 16px',
              backgroundColor: pagination.page === pagination.totalPages ? '#e5e7eb' : '#3b82f6',
              color: pagination.page === pagination.totalPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSystemNotifications;

