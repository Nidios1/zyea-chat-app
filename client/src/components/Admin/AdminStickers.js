import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { getApiBaseUrl } from '../../utils/platformConfig';

const API_BASE_URL = getApiBaseUrl();
const SERVER_BASE_URL = API_BASE_URL.replace('/api', '');

// Helper để lấy base URL với cùng protocol như current page (tránh Mixed Content)
const getBaseUrlWithSameProtocol = () => {
  const currentProtocol = window.location.protocol; // 'https:' hoặc 'http:'
  const apiUrl = new URL(API_BASE_URL);
  // Nếu current page là HTTPS nhưng API là HTTP, cần xử lý
  if (currentProtocol === 'https:' && apiUrl.protocol === 'http:') {
    console.warn('⚠️ Mixed Content: Page is HTTPS but API is HTTP. Consider using HTTPS for API.');
    // Trong development, có thể vẫn dùng HTTP
    // Trong production, nên dùng HTTPS
  }
  return API_BASE_URL;
};

// Hook để detect window size
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const AdminStickers = () => {
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 768;
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true); // Start with true to show loading
  const [showPackModal, setShowPackModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [packForm, setPackForm] = useState({ name: '', title: '', description: '', icon_url: '', sort_order: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadingSticker, setUploadingSticker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // Track progress for each file
  const [uploadingFiles, setUploadingFiles] = useState([]); // Track files being uploaded
  const [duplicateFiles, setDuplicateFiles] = useState([]); // Track duplicate files
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // Files waiting for user confirmation
  const [draggedSticker, setDraggedSticker] = useState(null); // Track dragged sticker
  const [draggedOverIndex, setDraggedOverIndex] = useState(null); // Track drag over index

  useEffect(() => {
    loadPacks();
  }, []);

  useEffect(() => {
    if (selectedPack) {
      console.log('🔄 Selected pack changed, loading stickers:', selectedPack.id);
      loadStickers(selectedPack.id);
    } else {
      setStickers([]);
    }
  }, [selectedPack]);

  const loadPacks = async () => {
    try {
      setLoading(true);
      const token = getToken();
      console.log('🔍 Loading packs from:', `${API_BASE_URL}/admin/sticker-packs`);
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 API_BASE_URL:', API_BASE_URL);
      
      if (!token) {
        console.error('❌ No token found!');
        toast.error('Vui lòng đăng nhập lại');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/admin/sticker-packs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Packs response:', response.data);
      console.log('Packs array:', response.data.packs);
      console.log('Packs length:', response.data.packs?.length);
      
      const packsData = response.data.packs || [];
      console.log('Setting packs:', packsData);
      setPacks(packsData);
      
      if (packsData.length === 0) {
        console.log('⚠️ No packs found - database might be empty');
      } else {
        console.log('✅ Loaded', packsData.length, 'packs');
      }
    } catch (error) {
      console.error('Error loading packs:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách sticker packs');
    } finally {
      setLoading(false);
    }
  };

  const loadStickers = async (packId) => {
    try {
      setLoading(true);
      const token = getToken();
      console.log('📥 Loading stickers for pack:', packId);
      const response = await axios.get(`${API_BASE_URL}/admin/sticker-packs/${packId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📥 Stickers response:', response.data);
      const stickersData = response.data.stickers || [];
      console.log('📥 Setting stickers:', stickersData.length, 'stickers');
      console.log('📥 Stickers data:', stickersData);
      setStickers(stickersData);
    } catch (error) {
      console.error('❌ Error loading stickers:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Lỗi khi tải danh sách stickers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePack = async (e) => {
    e.preventDefault();
    
    // Validation: Kiểm tra name không được trùng với pack đã có
    const existingPack = packs.find(p => p.name === packForm.name.trim());
    if (existingPack) {
      toast.error(`Tên pack "${packForm.name}" đã tồn tại. Vui lòng chọn tên khác.`);
      return;
    }
    
    // Validation: Name chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang
    const namePattern = /^[a-zA-Z0-9_-]+$/;
    if (!namePattern.test(packForm.name.trim())) {
      toast.error('Tên (ID) chỉ được chứa chữ cái, số, dấu gạch dưới (_) và dấu gạch ngang (-)');
      return;
    }
    
    try {
      const token = getToken();
      const response = await axios.post(`${API_BASE_URL}/admin/sticker-packs`, {
        ...packForm,
        name: packForm.name.trim(),
        title: packForm.title.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tạo sticker pack thành công!');
      const createdPackId = response.data.packId;
      const createdPackName = packForm.name.trim();
      const createdPackTitle = packForm.title.trim();
      
      setShowPackModal(false);
      setPackForm({ name: '', title: '', description: '', icon_url: '', sort_order: 0 });
      
      // Reload packs để hiển thị pack mới
      await loadPacks();
      
      // Tự động chọn pack vừa tạo sau khi reload
      // Sử dụng callback trong setPacks hoặc tìm trong response mới
      setTimeout(async () => {
        try {
          // Load lại packs một lần nữa để đảm bảo có pack mới
          const token = getToken();
          const reloadResponse = await axios.get(`${API_BASE_URL}/admin/sticker-packs`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const updatedPacks = reloadResponse.data.packs || [];
          const newPack = updatedPacks.find(p => p.id === createdPackId || p.name === createdPackName);
          if (newPack) {
            setSelectedPack(newPack);
            console.log('✅ Auto-selected new pack:', newPack);
          }
        } catch (err) {
          console.warn('Could not auto-select new pack:', err);
        }
      }, 200);
    } catch (error) {
      console.error('Error creating pack:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi tạo sticker pack';
      
      // Xử lý lỗi cụ thể
      if (errorMessage.includes('Duplicate') || errorMessage.includes('duplicate')) {
        toast.error('Tên pack này đã tồn tại. Vui lòng chọn tên khác.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Helper function to calculate file hash (simple version using name + size)
  const getFileSignature = (file) => {
    // Use name + size as signature (simple approach)
    // For more accuracy, could use crypto.subtle.digest but that's async
    return `${file.name.toLowerCase()}_${file.size}`;
  };

  // Check for duplicate stickers
  const checkDuplicates = async (files) => {
    if (!selectedPack || stickers.length === 0) {
      return []; // No duplicates if no stickers exist
    }

    const duplicates = [];
    const existingSignatures = new Set();
    
    // Build set of existing sticker signatures (based on image_url filename)
    stickers.forEach(sticker => {
      if (sticker.image_url) {
        try {
          const url = new URL(sticker.image_url, window.location.origin);
          const pathname = url.pathname;
          const filename = pathname.split('/').pop() || pathname;
          // Extract base filename without extension variations
          const baseName = filename.replace(/\.(webp|png|jpg|jpeg|gif)$/i, '').toLowerCase();
          existingSignatures.add(baseName);
        } catch (e) {
          // If URL parsing fails, try to extract filename from path
          const filename = sticker.image_url.split('/').pop() || sticker.image_url;
          const baseName = filename.replace(/\.(webp|png|jpg|jpeg|gif)$/i, '').toLowerCase();
          existingSignatures.add(baseName);
        }
      }
    });

    // Check each file
    files.forEach(file => {
      const fileSignature = getFileSignature(file);
      const baseName = file.name.replace(/\.(webp|png|jpg|jpeg|gif)$/i, '').toLowerCase();
      
      // Check if similar filename exists
      let isDuplicate = false;
      existingSignatures.forEach(existing => {
        if (existing === baseName || existing.includes(baseName) || baseName.includes(existing)) {
          isDuplicate = true;
        }
      });

      // Also check by exact filename match in stickers
      const exactMatch = stickers.some(sticker => {
        if (!sticker.image_url) return false;
        const stickerFilename = sticker.image_url.split('/').pop() || '';
        const stickerBaseName = stickerFilename.replace(/\.(webp|png|jpg|jpeg|gif)$/i, '').toLowerCase();
        return stickerBaseName === baseName;
      });

      if (isDuplicate || exactMatch) {
        duplicates.push({
          file: file,
          name: file.name,
          size: file.size,
          signature: fileSignature
        });
      }
    });

    return duplicates;
  };

  // Upload single sticker
  const uploadSingleSticker = async (file, token, packId, sortOrder) => {
    const fileId = `${file.name}-${Date.now()}-${Math.random()}`;
    
    try {
      // Update progress
      setUploadProgress(prev => ({ ...prev, [fileId]: { file: file.name, progress: 0, status: 'uploading' } }));
      
      console.log('📤 Uploading sticker file:', file.name, file.size, 'bytes');
      
      // Upload sticker file
      const formData = new FormData();
      formData.append('sticker', file);
      
      const uploadUrl = `${API_BASE_URL}/upload/sticker`;
      
      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { file: file.name, progress: percentCompleted, status: 'uploading' }
          }));
        }
      });

      setUploadProgress(prev => ({ ...prev, [fileId]: { file: file.name, progress: 100, status: 'saving' } }));

      if (uploadResponse.data.success && (uploadResponse.data.url || uploadResponse.data.imageUrl)) {
        const imageUrl = uploadResponse.data.url || uploadResponse.data.imageUrl;
        
        if (!imageUrl) {
          throw new Error('Không nhận được URL ảnh từ server');
        }
        
        // Add sticker to pack
        const stickerData = {
          image_url: imageUrl,
          file_format: uploadResponse.data.fileFormat || uploadResponse.data.file_format || 'webp',
          file_size: uploadResponse.data.size || file.size,
          width: 512,
          height: 512,
          is_animated: (uploadResponse.data.fileFormat === 'gif' || uploadResponse.data.fileFormat === 'webp') || 
                       (uploadResponse.data.file_format === 'gif' || uploadResponse.data.file_format === 'webp'),
          sort_order: sortOrder
        };

        const addResponse = await axios.post(
          `${API_BASE_URL}/admin/sticker-packs/${packId}/stickers`,
          stickerData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const newSticker = {
          id: addResponse.data.stickerId,
          pack_id: packId,
          image_url: imageUrl,
          file_format: stickerData.file_format,
          file_size: stickerData.file_size,
          width: stickerData.width,
          height: stickerData.height,
          is_animated: stickerData.is_animated,
          sort_order: stickerData.sort_order
        };
        
        setUploadProgress(prev => ({ ...prev, [fileId]: { file: file.name, progress: 100, status: 'success' } }));
        
        return { success: true, sticker: newSticker, fileId };
      } else {
        throw new Error('Upload response không hợp lệ');
      }
    } catch (error) {
      console.error('❌ Error uploading sticker:', file.name, error);
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: {
          file: file.name,
          progress: 0,
          status: 'error',
          error: error.response?.data?.message || error.message || 'Lỗi khi upload'
        }
      }));
      return { success: false, error: error.response?.data?.message || error.message, fileId };
    }
  };

  // Handle upload multiple stickers
  const handleUploadSticker = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!selectedPack) {
      toast.error('Vui lòng chọn một sticker pack trước');
      e.target.value = ''; // Reset input
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error('Vui lòng đăng nhập lại');
      e.target.value = ''; // Reset input
      return;
    }

    // Kiểm tra trùng lặp
    const duplicates = await checkDuplicates(files);
    
    if (duplicates.length > 0) {
      // Có file trùng, hiển thị cảnh báo
      setDuplicateFiles(duplicates);
      setPendingFiles(files);
      setShowDuplicateModal(true);
      e.target.value = ''; // Reset input để có thể chọn lại
      return;
    }

    // Không có trùng, tiếp tục upload
    await proceedWithUpload(files, token);
    e.target.value = ''; // Reset input
  };

  // Proceed with upload after duplicate check
  const proceedWithUpload = async (files, token, skipDuplicates = false) => {
    // Kiểm tra Mixed Content
    const currentProtocol = window.location.protocol;
    const apiProtocol = new URL(API_BASE_URL).protocol;
    if (currentProtocol === 'https:' && apiProtocol === 'http:') {
      console.warn('⚠️ Mixed Content Warning: HTTPS page calling HTTP API');
    }

    setUploadingSticker(true);
    setUploadingFiles(files.map(f => f.name));
    setUploadProgress({});
    setShowDuplicateModal(false);

    const packId = selectedPack.id;
    const startSortOrder = stickers.length;
    const newStickers = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Filter out duplicates if user chose to skip them
    let filesToUpload = files;
    if (skipDuplicates && duplicateFiles.length > 0) {
      const duplicateSignatures = new Set(duplicateFiles.map(d => d.signature));
      filesToUpload = files.filter(file => {
        const signature = getFileSignature(file);
        if (duplicateSignatures.has(signature)) {
          skippedCount++;
          return false;
        }
        return true;
      });
    }

    // Upload files sequentially to avoid overwhelming the server
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const sortOrder = startSortOrder + i;
      
      const result = await uploadSingleSticker(file, token, packId, sortOrder);
      
      if (result.success) {
        newStickers.push(result.sticker);
        successCount++;
      } else {
        errorCount++;
      }
    }

    // Update UI with all new stickers
    if (newStickers.length > 0) {
      setStickers(prev => [...prev, ...newStickers]);
      let message = `Đã thêm ${successCount} sticker${successCount > 1 ? 's' : ''} thành công!`;
      if (skippedCount > 0) {
        message += ` (Đã bỏ qua ${skippedCount} file trùng)`;
      }
      toast.success(message);
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} sticker${errorCount > 1 ? 's' : ''} upload thất bại`);
    }

    if (skippedCount > 0 && successCount === 0) {
      toast.warning(`Đã bỏ qua ${skippedCount} file trùng lặp`);
    }

    // Reload from server to ensure consistency
    setTimeout(async () => {
      try {
        await loadStickers(packId);
        await loadPacks();
      } catch (error) {
        console.error('Error reloading:', error);
      }
      
      // Clear progress after 3 seconds
      setTimeout(() => {
        setUploadProgress({});
        setUploadingFiles([]);
        setDuplicateFiles([]);
      }, 3000);
    }, 1000);

    setUploadingSticker(false);
  };

  const handleDeletePack = async (packId) => {
    if (!window.confirm('Bạn có chắc muốn xóa sticker pack này? Tất cả stickers trong pack sẽ bị xóa.')) {
      return;
    }

    try {
      const token = getToken();
      await axios.delete(`${API_BASE_URL}/admin/sticker-packs/${packId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa sticker pack thành công!');
      if (selectedPack?.id === packId) {
        setSelectedPack(null);
        setStickers([]);
      }
      loadPacks();
    } catch (error) {
      console.error('Error deleting pack:', error);
      toast.error('Lỗi khi xóa sticker pack');
    }
  };

  const handleDeleteSticker = async (stickerId) => {
    if (!window.confirm('Bạn có chắc muốn xóa sticker này?')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }
      
      console.log('🗑️ Deleting sticker:', stickerId);
      
      await axios.delete(`${API_BASE_URL}/admin/stickers/${stickerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Sticker deleted successfully');
      toast.success('Xóa sticker thành công!');
      
      // Reload stickers
      await loadStickers(selectedPack.id);
      
      // Reload packs to update sticker count
      await loadPacks();
    } catch (error) {
      console.error('❌ Error deleting sticker:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi xóa sticker';
      toast.error(errorMessage);
    }
  };

  // Handle drag and drop for reordering stickers
  const handleDragStart = (e, index) => {
    setDraggedSticker(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedSticker === null || draggedSticker === dropIndex) {
      setDraggedSticker(null);
      setDraggedOverIndex(null);
      return;
    }

    try {
      // Reorder stickers in local state
      const newStickers = [...stickers];
      const [draggedItem] = newStickers.splice(draggedSticker, 1);
      newStickers.splice(dropIndex, 0, draggedItem);
      
      // Update sort_order for all affected stickers
      const stickerOrders = newStickers.map((sticker, index) => ({
        id: sticker.id,
        sort_order: index
      }));
      
      // Update UI immediately
      setStickers(newStickers);
      
      // Save to server
      const token = getToken();
      if (!token) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }
      
      await axios.put(
        `${API_BASE_URL}/admin/sticker-packs/${selectedPack.id}/stickers/reorder`,
        { stickerOrders },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Stickers reordered successfully');
      toast.success('Đã sắp xếp lại thứ tự sticker!');
    } catch (error) {
      console.error('❌ Error reordering stickers:', error);
      // Reload from server to revert changes
      await loadStickers(selectedPack.id);
      toast.error('Lỗi khi sắp xếp lại thứ tự sticker');
    } finally {
      setDraggedSticker(null);
      setDraggedOverIndex(null);
    }
  };

  const handleTogglePackActive = async (pack) => {
    try {
      const token = getToken();
      const newActiveStatus = (pack.is_active === 1 || pack.is_active === true) ? false : true;
      await axios.put(
        `${API_BASE_URL}/admin/sticker-packs/${pack.id}`,
        { is_active: newActiveStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Cập nhật trạng thái thành công!');
      loadPacks();
    } catch (error) {
      console.error('Error updating pack:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div style={{ 
      padding: isMobile ? '8px' : '16px', 
      maxWidth: '100%', 
      margin: '0 auto',
      height: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: isMobile ? '12px' : '16px',
        flexShrink: 0,
        gap: isMobile ? '8px' : '16px'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: isMobile ? '18px' : '24px', 
          fontWeight: 'bold',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          Quản lý Stickers
        </h1>
        <button
          onClick={() => setShowPackModal(true)}
          style={{
            padding: isMobile ? '8px 12px' : '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {isMobile ? '+ Pack' : '+ Tạo Pack'}
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
        gap: isMobile ? '12px' : '16px',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Sidebar - Pack List */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: isMobile ? '8px' : '12px', 
          padding: isMobile ? '10px' : '12px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: isMobile ? '10px' : '12px', 
            fontSize: isMobile ? '14px' : '16px', 
            fontWeight: '600' 
          }}>
            Sticker Packs
          </h2>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
          ) : !packs || packs.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              Chưa có sticker pack nào
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
                (Đã tải: {packs ? packs.length : 'null'})
              </div>
              <button
                onClick={loadPacks}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🔄 Thử lại
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPack(pack)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedPack?.id === pack.id ? '#e0e7ff' : '#f3f4f6',
                    border: selectedPack?.id === pack.id ? '2px solid #3b82f6' : '2px solid transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {pack.title || pack.name || 'Unnamed Pack'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {pack.sticker_count || 0} stickers
                      {pack.is_active === 0 && <span style={{ color: '#ef4444', marginLeft: '8px' }}>(Ẩn)</span>}
                      {pack.is_active === false && <span style={{ color: '#ef4444', marginLeft: '8px' }}>(Ẩn)</span>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePackActive(pack);
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: (pack.is_active === 1 || pack.is_active === true) ? '#10b981' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      marginRight: '4px'
                    }}
                  >
                    {(pack.is_active === 1 || pack.is_active === true) ? '✓' : '✗'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePack(pack.id);
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Main Content - Stickers Grid */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: isMobile ? '8px' : '12px', 
          padding: isMobile ? '10px' : '12px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0
        }}>
          {!selectedPack ? (
            <div style={{ 
              textAlign: 'center', 
              padding: isMobile ? '30px 20px' : '40px', 
              color: '#666',
              fontSize: isMobile ? '14px' : '16px'
            }}>
              Chọn một sticker pack để xem stickers
            </div>
          ) : (
            <>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                marginBottom: isMobile ? '10px' : '12px',
                flexShrink: 0,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '10px' : '0'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: isMobile ? '16px' : '18px', 
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {selectedPack.title}
                  </h2>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    color: '#666', 
                    fontSize: isMobile ? '12px' : '13px' 
                  }}>
                    {stickers.length} stickers
                  </p>
                </div>
                <label
                  style={{
                    padding: isMobile ? '8px 12px' : '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: uploadingSticker ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: '600',
                    opacity: uploadingSticker ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    width: isMobile ? '100%' : 'auto',
                    textAlign: 'center'
                  }}
                >
                  {uploadingSticker 
                    ? `Đang upload... (${uploadingFiles.length})` 
                    : isMobile 
                      ? '+ Thêm Sticker' 
                      : '+ Thêm Sticker (có thể chọn nhiều)'}
                  <input
                    type="file"
                    accept=".webp,.png,.jpg,.jpeg,.gif"
                    multiple
                    onChange={handleUploadSticker}
                    disabled={uploadingSticker}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Tiến trình upload:
                  </div>
                  {Object.entries(uploadProgress).map(([fileId, progress]) => (
                    <div key={fileId} style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280' }}>{progress.file}</span>
                        <span style={{ 
                          color: progress.status === 'success' ? '#10b981' : 
                                 progress.status === 'error' ? '#ef4444' : '#3b82f6',
                          fontWeight: '600'
                        }}>
                          {progress.status === 'success' ? '✓ Hoàn thành' : 
                           progress.status === 'error' ? `✗ ${progress.error}` :
                           progress.status === 'saving' ? 'Đang lưu...' :
                           `${progress.progress}%`}
                        </span>
                      </div>
                      {progress.status !== 'error' && (
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${progress.progress}%`,
                            height: '100%',
                            backgroundColor: progress.status === 'success' ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {loading ? (
                <div style={{ 
                  padding: isMobile ? '15px' : '20px', 
                  textAlign: 'center',
                  fontSize: isMobile ? '14px' : '16px'
                }}>
                  Đang tải...
                </div>
              ) : stickers.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: isMobile ? '30px 20px' : '40px', 
                  color: '#666',
                  fontSize: isMobile ? '14px' : '16px'
                }}>
                  Chưa có sticker nào trong pack này
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile 
                    ? 'repeat(auto-fill, minmax(70px, 1fr))' 
                    : 'repeat(auto-fill, minmax(90px, 1fr))', 
                  gap: isMobile ? '8px' : '10px',
                  flex: 1,
                  overflowY: 'auto',
                  paddingBottom: isMobile ? '4px' : '8px',
                  minHeight: 0,
                  maxHeight: '100%'
                }}>
                  {stickers.map((sticker, index) => {
                    // Build image URL
                    let imageSrc = '';
                    if (sticker.image_url) {
                      if (sticker.image_url.startsWith('http')) {
                        imageSrc = sticker.image_url;
                      } else if (sticker.image_url.startsWith('/')) {
                        imageSrc = `${SERVER_BASE_URL}${sticker.image_url}`;
                      } else {
                        imageSrc = `${SERVER_BASE_URL}/${sticker.image_url}`;
                      }
                    }
                    
                    console.log(`🖼️ Rendering sticker ${index + 1}/${stickers.length}:`, {
                      id: sticker.id,
                      image_url: sticker.image_url,
                      full_url: imageSrc
                    });
                    
                    return (
                      <div
                        key={sticker.id || `sticker-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{
                          position: 'relative',
                          border: draggedSticker === index 
                            ? '2px solid #3b82f6' 
                            : draggedOverIndex === index 
                              ? '2px dashed #3b82f6' 
                              : '1px solid #e5e7eb',
                          borderRadius: isMobile ? '4px' : '6px',
                          overflow: 'hidden',
                          aspectRatio: '1',
                          backgroundColor: draggedOverIndex === index ? '#e0e7ff' : '#f9fafb',
                          cursor: 'grab',
                          opacity: draggedSticker === index ? 0.5 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={`Sticker ${sticker.id || index}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              backgroundColor: '#f9fafb'
                            }}
                            onError={(e) => {
                              console.error('❌ Image load error for sticker:', sticker.id);
                              console.error('Image URL:', sticker.image_url);
                              console.error('Full URL:', e.target.src);
                              e.target.style.display = 'none';
                              // Show error placeholder
                              const parent = e.target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 12px;">Lỗi tải ảnh</div>';
                              }
                            }}
                            onLoad={() => {
                              console.log('✅ Image loaded successfully:', sticker.id, imageSrc);
                            }}
                          />
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#999',
                            fontSize: '12px'
                          }}>
                            No image URL
                          </div>
                        )}
                        {sticker.is_animated && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}
                          >
                            GIF
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteSticker(sticker.id)}
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            padding: isMobile ? '3px 6px' : '4px 8px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: isMobile ? '10px' : '12px',
                            fontWeight: '600'
                          }}
                        >
                          {isMobile ? '×' : 'Xóa'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Pack Modal */}
      {showPackModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: isMobile ? 'flex-start' : 'center',
            zIndex: 1000,
            padding: isMobile ? '10px' : '20px',
            overflowY: 'auto'
          }}
          onClick={() => setShowPackModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: isMobile ? '8px' : '12px',
              padding: isMobile ? '16px' : '20px',
              width: '100%',
              maxWidth: isMobile ? '100%' : '420px',
              maxHeight: isMobile ? 'calc(100vh - 20px)' : '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginTop: isMobile ? '10px' : '0',
              marginBottom: isMobile ? '10px' : '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: isMobile ? '12px' : '10px'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: isMobile ? '18px' : '20px', 
                fontWeight: '600' 
              }}>
                Tạo Sticker Pack Mới
              </h2>
              <button
                onClick={() => setShowPackModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>
            </div>
            <p style={{ 
              margin: '0 0 16px 0', 
              fontSize: isMobile ? '12px' : '13px', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Sticker Pack là chủ đề/mục để phân loại stickers. Tạo pack trước, sau đó thêm stickers vào pack đó.
            </p>
            <form onSubmit={handleCreatePack}>
              <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: isMobile ? '4px' : '6px', 
                  fontWeight: '600', 
                  fontSize: isMobile ? '13px' : '14px' 
                }}>
                  Tên (ID) *
                </label>
                <input
                  type="text"
                  value={packForm.name}
                  onChange={(e) => {
                    // Chỉ cho phép chữ cái, số, dấu gạch dưới và dấu gạch ngang
                    const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                    setPackForm({ ...packForm, name: value });
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: isMobile ? '8px' : '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: isMobile ? '14px' : '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="default, funny_animals, etc."
                  pattern="[a-zA-Z0-9_-]+"
                  title="Chỉ được chứa chữ cái, số, dấu gạch dưới (_) và dấu gạch ngang (-)"
                />
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: isMobile ? '11px' : '12px', 
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  Chỉ được chứa chữ cái, số, dấu gạch dưới (_) và dấu gạch ngang (-)
                </p>
              </div>
              <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: isMobile ? '4px' : '6px', 
                  fontWeight: '600', 
                  fontSize: isMobile ? '13px' : '14px' 
                }}>
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={packForm.title}
                  onChange={(e) => setPackForm({ ...packForm, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: isMobile ? '8px' : '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: isMobile ? '14px' : '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Default Stickers"
                />
              </div>
              <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: isMobile ? '4px' : '6px', 
                  fontWeight: '600', 
                  fontSize: isMobile ? '13px' : '14px' 
                }}>
                  Mô tả
                </label>
                <textarea
                  value={packForm.description}
                  onChange={(e) => setPackForm({ ...packForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: isMobile ? '8px' : '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    minHeight: isMobile ? '60px' : '70px',
                    fontSize: isMobile ? '14px' : '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Mô tả về sticker pack..."
                />
              </div>
              <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: isMobile ? '4px' : '6px', 
                  fontWeight: '600', 
                  fontSize: isMobile ? '13px' : '14px' 
                }}>
                  Icon URL (tùy chọn)
                </label>
                <input
                  type="text"
                  value={packForm.icon_url}
                  onChange={(e) => setPackForm({ ...packForm, icon_url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: isMobile ? '8px' : '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: isMobile ? '14px' : '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="URL của icon pack"
                />
              </div>
              <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: isMobile ? '4px' : '6px', 
                  fontWeight: '600', 
                  fontSize: isMobile ? '13px' : '14px' 
                }}>
                  Thứ tự sắp xếp
                </label>
                <input
                  type="number"
                  value={packForm.sort_order}
                  onChange={(e) => setPackForm({ ...packForm, sort_order: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: isMobile ? '8px' : '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: isMobile ? '14px' : '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ 
                display: 'flex', 
                gap: isMobile ? '8px' : '10px', 
                justifyContent: 'flex-end', 
                marginTop: isMobile ? '4px' : '8px',
                flexDirection: isMobile ? 'column-reverse' : 'row'
              }}>
                <button
                  type="button"
                  onClick={() => setShowPackModal(false)}
                  style={{
                    padding: isMobile ? '10px 16px' : '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '500',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: isMobile ? '10px 16px' : '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {showDuplicateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: isMobile ? 'flex-start' : 'center',
            zIndex: 1001,
            padding: isMobile ? '10px' : '20px',
            overflowY: 'auto'
          }}
          onClick={() => {
            setShowDuplicateModal(false);
            setDuplicateFiles([]);
            setPendingFiles([]);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: isMobile ? '8px' : '12px',
              padding: isMobile ? '16px' : '20px',
              width: '100%',
              maxWidth: isMobile ? '100%' : '500px',
              maxHeight: isMobile ? 'calc(100vh - 20px)' : '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginTop: isMobile ? '10px' : '0',
              marginBottom: isMobile ? '10px' : '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: isMobile ? '18px' : '20px', 
                fontWeight: '600',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>Cảnh báo: File trùng lặp</span>
              </h2>
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateFiles([]);
                  setPendingFiles([]);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ 
              margin: '0 0 16px 0', 
              fontSize: isMobile ? '13px' : '14px', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Phát hiện <strong>{duplicateFiles.length}</strong> file có thể trùng lặp với stickers đã có trong pack này:
            </p>

            <div style={{
              marginBottom: '20px',
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: '#f9fafb'
            }}>
              {duplicateFiles.map((dup, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px',
                    marginBottom: '8px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: isMobile ? '13px' : '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {dup.name}
                    </div>
                    <div style={{ 
                      fontSize: isMobile ? '11px' : '12px', 
                      color: '#6b7280',
                      marginTop: '2px'
                    }}>
                      {(dup.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '8px' : '10px', 
              justifyContent: 'flex-end',
              flexDirection: isMobile ? 'column-reverse' : 'row'
            }}>
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateFiles([]);
                  setPendingFiles([]);
                }}
                style={{
                  padding: isMobile ? '10px 16px' : '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  const token = getToken();
                  if (token && pendingFiles.length > 0) {
                    await proceedWithUpload(pendingFiles, token, true); // Skip duplicates
                  }
                  setShowDuplicateModal(false);
                  setDuplicateFiles([]);
                  setPendingFiles([]);
                }}
                style={{
                  padding: isMobile ? '10px 16px' : '10px 20px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '600',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Bỏ qua file trùng và tiếp tục
              </button>
              <button
                onClick={async () => {
                  const token = getToken();
                  if (token && pendingFiles.length > 0) {
                    await proceedWithUpload(pendingFiles, token, false); // Upload all including duplicates
                  }
                  setShowDuplicateModal(false);
                  setDuplicateFiles([]);
                  setPendingFiles([]);
                }}
                style={{
                  padding: isMobile ? '10px 16px' : '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '600',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Vẫn upload tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStickers;

