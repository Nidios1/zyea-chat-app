import React from 'react';
import styled from 'styled-components';

const DebugContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  max-width: 300px;
  z-index: 9999;
  max-height: 400px;
  overflow-y: auto;
`;

const DebugPanel = ({ conversations, user, isMobile }) => {
  return (
    <DebugContainer>
      <div><strong>Debug Info:</strong></div>
      <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.full_name || user.username : 'Not logged in'}</div>
      <div>Conversations: {conversations ? conversations.length : 0}</div>
      <div>Conversations data:</div>
      <pre style={{ fontSize: '10px', margin: '5px 0' }}>
        {JSON.stringify(conversations, null, 2)}
      </pre>
    </DebugContainer>
  );
};

export default DebugPanel;
