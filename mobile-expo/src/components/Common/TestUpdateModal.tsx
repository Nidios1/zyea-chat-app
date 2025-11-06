/**
 * Component test để hiển thị UpdateModal
 * Dùng để test UI của modal update
 */

import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { UpdateModal } from './UpdateModal';

export const TestUpdateModal = () => {
  const [visible, setVisible] = useState(false);

  const handleUpdate = () => {
    console.log('Update pressed');
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      <Button title="Test Update Modal" onPress={() => setVisible(true)} />
      
      <UpdateModal
        visible={visible}
        onUpdate={handleUpdate}
        title="Ứng dụng đã có phiên bản mới"
        message="Bạn vui lòng cập nhật Ứng dụng lên phiên bản mới nhất. Nếu không cập nhật, Bạn sẽ không chạy được phiên bản hiện tại trên điện thoại"
        updateButtonText="Cập nhật"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

