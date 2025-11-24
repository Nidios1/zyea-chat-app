import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../../utils/platformConfig';
import { getToken } from '../../utils/auth';

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ search: '', userId: '' });

  useEffect(() => {
    fetchPosts();
  }, [pagination.page, filters]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`${apiUrl}/admin/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa post này?')) {
      return;
    }

    try {
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      const response = await fetch(`${apiUrl}/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      fetchPosts();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm nội dung..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <input
            type="number"
            placeholder="User ID (để trống = tất cả)"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Posts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {post.avatar_url && (
                  <img
                    src={post.avatar_url}
                    alt={post.full_name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                    {post.full_name || post.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(post.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: post.privacy === 'public' ? '#dbeafe' : '#f3f4f6',
                  color: post.privacy === 'public' ? '#1e40af' : '#374151'
                }}>
                  {post.privacy === 'public' ? '🌐 Public' :
                   post.privacy === 'friends' ? '👥 Friends' :
                   post.privacy === 'private' ? '🔒 Private' : post.privacy}
                </span>
                <button
                  onClick={() => handleDelete(post.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>

            {post.content && (
              <div style={{
                fontSize: '14px',
                color: '#1e293b',
                marginBottom: '15px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {post.content}
              </div>
            )}

            {post.image_url && (
              <div style={{ marginBottom: '15px' }}>
                <img
                  src={post.image_url}
                  alt="Post"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#64748b' }}>
              <span>👍 {post.likes_count || 0} likes</span>
              <span>💬 {post.comments_count || 0} comments</span>
              <span>📤 {post.shares_count || 0} shares</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
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
        <span style={{ fontSize: '14px', color: '#64748b' }}>
          Trang {pagination.page} / {pagination.totalPages}
        </span>
        <button
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          disabled={pagination.page >= pagination.totalPages}
          style={{
            padding: '8px 16px',
            backgroundColor: pagination.page >= pagination.totalPages ? '#e5e7eb' : '#3b82f6',
            color: pagination.page >= pagination.totalPages ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default AdminPosts;

