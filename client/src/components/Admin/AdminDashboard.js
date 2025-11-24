import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../../utils/platformConfig';
import { getToken } from '../../utils/auth';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const response = await fetch(`${apiUrl}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stats:', err);
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
          onClick={fetchStats}
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

  const statCards = [
    {
      title: 'Tổng Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    {
      title: 'Tổng Posts',
      value: stats?.totalPosts || 0,
      icon: '📝',
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      title: 'Tổng Messages',
      value: stats?.totalMessages || 0,
      icon: '💬',
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      title: 'Conversations',
      value: stats?.totalConversations || 0,
      icon: '📨',
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    },
    {
      title: 'Active Users (24h)',
      value: stats?.activeUsers || 0,
      icon: '🟢',
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      title: 'Users mới hôm nay',
      value: stats?.newUsersToday || 0,
      icon: '✨',
      color: '#ec4899',
      bgColor: '#fce7f3'
    },
    {
      title: 'Posts mới hôm nay',
      value: stats?.newPostsToday || 0,
      icon: '📊',
      color: '#06b6d4',
      bgColor: '#cffafe'
    }
  ];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {statCards.map((card, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '10px',
                backgroundColor: card.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '15px'
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: card.color,
                  lineHeight: '1'
                }}>
                  {card.value.toLocaleString('vi-VN')}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  marginTop: '5px'
                }}>
                  {card.title}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users by Status */}
      {stats?.usersByStatus && (
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' }}>
            Users theo trạng thái
          </h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {Object.entries(stats.usersByStatus).map(([status, count]) => (
              <div key={status} style={{
                padding: '15px 20px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                  {count}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>
                  {status === 'online' ? '🟢 Online' :
                   status === 'offline' ? '⚫ Offline' :
                   status === 'away' ? '🟡 Away' :
                   status === 'recently_active' ? '🟠 Recently Active' : status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts by Privacy */}
      {stats?.postsByPrivacy && (
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' }}>
            Posts theo quyền riêng tư
          </h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {Object.entries(stats.postsByPrivacy).map(([privacy, count]) => (
              <div key={privacy} style={{
                padding: '15px 20px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                  {count}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>
                  {privacy === 'public' ? '🌐 Public' :
                   privacy === 'friends' ? '👥 Friends' :
                   privacy === 'private' ? '🔒 Private' : privacy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

