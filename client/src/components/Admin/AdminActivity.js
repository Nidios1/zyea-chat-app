import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../../utils/platformConfig';
import { getToken } from '../../utils/auth';

const AdminActivity = () => {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const response = await fetch(`${apiUrl}/admin/activity?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      const data = await response.json();
      setActivity(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          onClick={fetchActivity}
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
    <div>
      {/* Recent Users */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' }}>
          👥 Users mới đăng ký
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activity?.recentUsers?.map((user) => (
            <div
              key={user.id}
              style={{
                padding: '15px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                  {user.full_name || user.username}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                  {user.email} • ID: {user.id}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {new Date(user.created_at).toLocaleString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Posts */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' }}>
          📝 Posts mới nhất
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {activity?.recentPosts?.map((post) => (
            <div
              key={post.id}
              style={{
                padding: '15px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                  {post.full_name || post.username}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {new Date(post.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
              {post.content && (
                <div style={{
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminActivity;

