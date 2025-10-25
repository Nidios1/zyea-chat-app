import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { friendsAPI } from '../../utils/api';
import { 
  FiPhone, 
  FiVideo, 
  FiUserPlus,
  FiGift,
  FiCheck,
  FiX,
  FiSearch,
  FiPlus,
  FiMessageSquare,
  FiUser,
  FiUsers
} from 'react-icons/fi';
import { BsQrCodeScan } from 'react-icons/bs';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';
import VideoCall from '../Chat/VideoCall';
import PermissionRequest from '../Chat/PermissionRequest';
import MobileUserProfile from './MobileUserProfile';

const ContactsContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* Fill parent container */
  flex: 1;
  height: 100%;
  background: var(--bg-secondary, #f0f2f5);
  overflow: hidden;
  position: relative;
  width: 100%;
`;

const Header = styled.div`
  background: var(--header-bg, #0084ff);
  padding: clamp(8px, 2vw, 12px) clamp(10px, 3vw, 12px);
  display: flex;
  align-items: center;
  gap: clamp(8px, 2.5vw, 12px);
  
  /* Safe area for iPhone notch/Dynamic Island */
  padding-top: max(clamp(8px, 2vw, 12px), env(safe-area-inset-top, 8px));
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    padding: 4px 8px;
    padding-top: max(4px, env(safe-area-inset-top, 4px));
    gap: 6px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    padding: 8px;
    padding-top: max(8px, env(safe-area-inset-top, 8px));
    gap: 8px;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: clamp(16px, 5vw, 20px);
  padding: clamp(4px, 1.5vw, 6px) clamp(8px, 3vw, 12px);
  gap: clamp(6px, 2vw, 8px);
  min-height: var(--touch-min, 36px);

  input {
    flex: 1;
    border: none;
    background: none;
    outline: none;
    color: white;
    font-size: clamp(13px, 3.5vw, 14px);
    min-width: 0;

    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  svg {
    color: rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
    font-size: clamp(16px, 4vw, 18px);
  }
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    padding: 4px 8px;
    min-height: 28px;
    border-radius: 14px;
    
    input {
      font-size: 12px;
    }
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    padding: 4px 8px;
    gap: 6px;
  }
`;

const HeaderButton = styled.button`
  background: none;
  border: none;
  padding: clamp(4px, 1.5vw, 6px);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  min-width: var(--touch-min, 40px);
  min-height: var(--touch-min, 40px);
  -webkit-tap-highlight-color: transparent;

  svg {
    font-size: clamp(18px, 5vw, 20px);
  }

  &:active {
    background: rgba(255, 255, 255, 0.2);
    opacity: 0.7;
    transform: scale(0.95);
  }
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    min-width: 32px;
    min-height: 32px;
    padding: 4px;
    
    svg {
      font-size: 16px;
    }
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    min-width: 36px;
    min-height: 36px;
    padding: 4px;
  }
`;

const Tabs = styled.div`
  display: flex;
  background: var(--bg-primary, white);
  border-bottom: 1px solid var(--border-color, #e4e6eb);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Tab = styled.button`
  flex: 1;
  padding: clamp(10px, 3vw, 12px) clamp(8px, 3vw, 16px);
  border: none;
  background: none;
  color: ${props => props.active ? 'var(--primary-color, #0084ff)' : 'var(--text-secondary, #65676b)'};
  font-size: clamp(13px, 3.5vw, 15px);
  font-weight: 500;
  cursor: pointer;
  position: relative;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary-color, #0084ff)' : 'transparent'};
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: var(--touch-min, 44px);
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--bg-secondary, #f0f2f5);
    opacity: 0.7;
    transform: scale(0.98);
  }
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    padding: 8px 6px;
    font-size: 12px;
    min-height: 36px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    padding: 8px 6px;
    font-size: 12px;
  }
  
  /* Extra small text for very long tabs on small screens */
  @media (max-width: 320px) {
    font-size: 11px;
    padding: 8px 4px;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: var(--bg-secondary, #f0f2f5);
  overscroll-behavior: contain;
  
  /* REMOVED: Don't add padding here, let child components handle it */
  /* This prevents large empty space when content is short */
`;

const Section = styled.div`
  background: var(--bg-primary, white);
  margin-bottom: 8px;
  
  /* Add padding-bottom to last section to prevent BottomNav overlap */
  &:last-child {
    padding-bottom: calc(68px + env(safe-area-inset-bottom, 0));
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  padding: clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.highlight ? '#fff4e6' : 'var(--bg-primary, white)'};
  border-bottom: 1px solid var(--border-color, #e4e6eb);
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    padding: 8px 12px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    padding: 10px 12px;
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 8px);
  font-size: clamp(14px, 3.5vw, 15px);
  font-weight: 500;
  color: var(--text-primary, #050505);
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    font-size: 13px;
    gap: 6px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    font-size: 13px;
  }
`;

const SectionIconWrapper = styled.div`
  width: clamp(32px, 9vw, 36px);
  height: clamp(32px, 9vw, 36px);
  border-radius: 50%;
  background: ${props => props.bgColor || '#0084ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    font-size: clamp(16px, 4.5vw, 18px);
  }
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    width: 30px;
    height: 30px;
    
    svg {
      font-size: 16px;
    }
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    width: 32px;
    height: 32px;
    
    svg {
      font-size: 16px;
    }
  }
`;

const SectionHeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(8px, 3vw, 12px);
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    gap: 8px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    gap: 8px;
  }
`;

const Badge = styled.span`
  background: #ff4444;
  color: white;
  font-size: clamp(10px, 2.5vw, 12px);
  font-weight: 600;
  padding: clamp(2px, 0.5vw, 3px) clamp(5px, 1.5vw, 6px);
  border-radius: 10px;
  min-width: clamp(16px, 4vw, 18px);
  text-align: center;
  line-height: 1.2;
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    font-size: 10px;
    padding: 2px 5px;
    min-width: 16px;
  }
`;

const SectionSubtitle = styled.p`
  margin: 4px 0 0 0;
  font-size: clamp(12px, 3vw, 13px);
  color: var(--text-secondary, #65676b);
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    font-size: 11px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    font-size: 12px;
  }
`;

const Stats = styled.div`
  padding: 0;
  display: flex;
  align-items: center;
  background: var(--bg-primary, white);
  border-bottom: 1px solid var(--border-color, #e4e6eb);
`;

const StatItem = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 1.5vw, 6px);
  font-size: clamp(13px, 3.2vw, 14px);
  color: ${props => props.active ? 'var(--text-primary, #050505)' : 'var(--text-secondary, #65676b)'};
  padding: clamp(12px, 3vw, 14px) clamp(10px, 3vw, 12px);
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary-color, #0084ff)' : 'transparent'};
  font-weight: ${props => props.active ? '600' : '400'};

  strong {
    color: var(--text-primary, #050505);
    font-weight: 600;
    margin-right: 2px;
  }
  
  &:active {
    background: var(--bg-secondary, #f0f2f5);
  }
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    font-size: 12px;
    gap: 3px;
    padding: 10px 8px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    font-size: 12px;
    padding: 10px 8px;
  }
`;

const AlphabetDivider = styled.div`
  padding: clamp(6px, 2vw, 8px) clamp(12px, 4vw, 16px);
  background: var(--bg-secondary, #f0f2f5);
  font-size: clamp(13px, 3.5vw, 14px);
  font-weight: 600;
  color: var(--primary-color, #0084ff);
  position: sticky;
  top: 0;
  z-index: 5;
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    padding: 5px 12px;
    font-size: 12px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    padding: 6px 12px;
    font-size: 12px;
  }
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  padding: clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px);
  background: var(--bg-primary, white);
  border-bottom: 1px solid var(--border-color, #e4e6eb);
  cursor: pointer;
  transition: background 0.2s;
  min-height: var(--touch-min, 60px);
  gap: clamp(8px, 2.5vw, 12px);
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--bg-secondary, #f0f2f5);
    opacity: 0.9;
  }
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    padding: 8px 12px;
    min-height: 52px;
    gap: 8px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    padding: 10px 12px;
    min-height: 56px;
  }
`;

const Avatar = styled.div`
  width: clamp(40px, 11vw, 48px);
  height: clamp(40px, 11vw, 48px);
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: clamp(16px, 4.5vw, 18px);
  flex-shrink: 0;
  position: relative;
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    width: 42px;
    height: 42px;
    font-size: 16px;
  }
  
  /* Extra small screens */
  @media (max-width: 320px) {
    width: 40px;
    height: 40px;
    font-size: 15px;
  }
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: clamp(12px, 3vw, 14px);
  height: clamp(12px, 3vw, 14px);
  background: #31a24c;
  border: 2px solid var(--bg-primary, white);
  border-radius: 50%;
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    width: 12px;
    height: 12px;
    border-width: 2px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    width: 12px;
    height: 12px;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.h3`
  margin: 0;
  font-size: clamp(14px, 4vw, 16px);
  font-weight: 500;
  color: var(--text-primary, #050505);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    font-size: 14px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    font-size: 14px;
  }
`;

const ContactStatus = styled.p`
  margin: 2px 0 0 0;
  font-size: clamp(12px, 3vw, 13px);
  color: var(--text-secondary, #65676b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    font-size: 11px;
    margin-top: 1px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    font-size: 12px;
  }
`;

const ContactActions = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 8px);
  flex-shrink: 0;
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    gap: 6px;
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    gap: 6px;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: clamp(6px, 2vw, 8px);
  color: var(--text-secondary, #65676b);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  min-width: var(--touch-min, 40px);
  min-height: var(--touch-min, 40px);
  -webkit-tap-highlight-color: transparent;

  svg {
    font-size: clamp(18px, 5vw, 20px);
  }

  &:active {
    background: var(--bg-secondary, #f0f2f5);
    opacity: 0.7;
    transform: scale(0.95);
  }
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    padding: 6px;
    min-width: 36px;
    min-height: 36px;
    
    svg {
      font-size: 18px;
    }
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    padding: 6px;
    min-width: 36px;
    min-height: 36px;
    
    svg {
      font-size: 18px;
    }
  }
`;

const EmptyState = styled.div`
  padding: clamp(40px, 12vw, 60px) clamp(16px, 5vw, 20px);
  text-align: center;
  color: var(--text-secondary, #65676b);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  /* Changed from center to flex-start */

  /* Only add extra padding on mobile */
  @media (max-width: 768px) {
    padding-bottom: calc(68px + env(safe-area-inset-bottom, 0));
  }

  h3 {
    margin: 0 0 clamp(6px, 2vw, 8px) 0;
    font-size: clamp(16px, 4.5vw, 18px);
    font-weight: 600;
    color: var(--text-primary, #050505);
  }

  p {
    margin: 0;
    font-size: clamp(13px, 3.5vw, 14px);
    color: var(--text-secondary, #65676b);
    line-height: 1.5;
    max-width: 300px;
  }
  
  /* Landscape mode */
  @media (max-width: 768px) and (orientation: landscape) {
    padding: 30px 16px;
    
    h3 {
      font-size: 16px;
      margin-bottom: 6px;
    }
    
    p {
      font-size: 13px;
    }
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    padding: 40px 16px;
    
    h3 {
      font-size: 16px;
    }
    
    p {
      font-size: 13px;
    }
  }
`;

const AddFriendContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  background: var(--bg-secondary, #f0f2f5);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const AddFriendHeader = styled.div`
  background: var(--bg-primary, white);
  padding: clamp(12px, 3vw, 16px);
  padding-top: max(clamp(12px, 3vw, 16px), env(safe-area-inset-top, 12px));
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-color, #e4e6eb);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary, #050505);
  font-size: clamp(20px, 5vw, 24px);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.6;
  }
`;

const AddFriendTitle = styled.h2`
  margin: 0;
  font-size: clamp(16px, 4vw, 18px);
  font-weight: 600;
  color: var(--text-primary, #050505);
`;

const QRSection = styled.div`
  background: var(--bg-primary, white);
  padding: clamp(20px, 5vw, 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
`;

const QRCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: clamp(20px, 5vw, 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 280px;
`;

const QRUserName = styled.h3`
  margin: 0;
  color: white;
  font-size: clamp(16px, 4vw, 18px);
  font-weight: 600;
`;

const QRCodeBox = styled.div`
  background: white;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(150px, 40vw, 180px);
  height: clamp(150px, 40vw, 180px);
`;

const QRPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
`;

const QRText = styled.p`
  margin: 0;
  color: white;
  font-size: clamp(12px, 3vw, 13px);
  text-align: center;
  opacity: 0.9;
`;

const PhoneInputSection = styled.div`
  background: var(--bg-primary, white);
  padding: clamp(16px, 4vw, 20px);
  margin-bottom: 8px;
`;

const PhoneInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CountryCodeSelect = styled.select`
  padding: clamp(10px, 2.5vw, 12px);
  border: 1px solid var(--border-color, #e4e6eb);
  border-radius: 8px;
  font-size: clamp(14px, 3.5vw, 15px);
  color: var(--text-primary, #050505);
  background: var(--bg-primary, white);
  cursor: pointer;
  min-width: 70px;
`;

const PhoneInput = styled.input`
  flex: 1;
  padding: clamp(10px, 2.5vw, 12px);
  border: 1px solid var(--border-color, #e4e6eb);
  border-radius: 8px;
  font-size: clamp(14px, 3.5vw, 15px);
  color: var(--text-primary, #050505);
  outline: none;

  &:focus {
    border-color: var(--primary-color, #0084ff);
  }

  &::placeholder {
    color: var(--text-tertiary, #999);
  }
`;

const SearchButton = styled.button`
  background: var(--bg-secondary, #f0f2f5);
  border: none;
  width: clamp(40px, 10vw, 44px);
  height: clamp(40px, 10vw, 44px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary, #65676b);
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--border-color, #e4e6eb);
  }
`;

const OptionButton = styled.button`
  background: var(--bg-primary, white);
  border: none;
  padding: clamp(14px, 3.5vw, 16px) clamp(16px, 4vw, 20px);
  display: flex;
  align-items: center;
  gap: clamp(12px, 3vw, 16px);
  width: 100%;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color, #e4e6eb);
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--bg-secondary, #f0f2f5);
  }
`;

const OptionIcon = styled.div`
  width: clamp(36px, 9vw, 40px);
  height: clamp(36px, 9vw, 40px);
  border-radius: 50%;
  background: var(--primary-color, #0084ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: clamp(18px, 4.5vw, 20px);
`;

const OptionContent = styled.div`
  flex: 1;
  text-align: left;
`;

const OptionTitle = styled.div`
  font-size: clamp(15px, 3.75vw, 16px);
  font-weight: 500;
  color: var(--text-primary, #050505);
  margin-bottom: 2px;
`;

const OptionSubtitle = styled.div`
  font-size: clamp(12px, 3vw, 13px);
  color: var(--text-secondary, #65676b);
`;

const getAvatarColor = (name) => {
  const colors = ['#0084ff', '#31a24c', '#f02849', '#ffc107', '#9c27b0', '#ff6b6b', '#4ecdc4', '#45b7d1'];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const MobileContacts = ({ onBack, onCall, onVideoCall, onAddFriend, socket, user, onHideBottomNav, onStartChat }) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [showPendingView, setShowPendingView] = useState(false); // For viewing pending requests
  const [showAddFriendView, setShowAddFriendView] = useState(false); // For add friend screen
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+84');
  const [statsFilter, setStatsFilter] = useState('all'); // 'all' or 'recent'
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [birthdays, setBirthdays] = useState([]);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
      loadPendingRequests(); // Always load pending requests to show badge
      loadBirthdays();
    }
  }, [activeTab]);

  useEffect(() => {
    if (showPendingView) {
      loadPendingRequests();
    }
  }, [showPendingView]);

  // Hide/show bottom nav based on Add Friend view
  useEffect(() => {
    if (onHideBottomNav) {
      onHideBottomNav(showAddFriendView);
    }
    
    // Cleanup: show bottom nav when component unmounts
    return () => {
      if (onHideBottomNav) {
        onHideBottomNav(false);
      }
    };
  }, [showAddFriendView, onHideBottomNav]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getFriends();
      setFriends(response.data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getPendingRequests();
      setPendingRequests(response.data || []);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBirthdays = () => {
    // Mock data for birthdays - in real app, fetch from API
    const today = new Date();
    const mockBirthdays = friends.filter(friend => {
      // Check if friend has birthday today or in next 7 days
      return Math.random() > 0.9; // Mock: 10% chance
    });
    setBirthdays(mockBirthdays.slice(0, 3));
  };

  const groupFriendsByAlphabet = (friendsList) => {
    const grouped = {};
    friendsList.forEach(friend => {
      const firstLetter = (friend.full_name || 'Unknown')[0].toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(friend);
    });
    return grouped;
  };

  // Filter friends based on search and stats filter
  let filteredFriends = friends;
  
  // Apply search filter
  if (searchQuery) {
    filteredFriends = filteredFriends.filter(friend =>
        friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply stats filter (recent = online or recently active)
  if (statsFilter === 'recent') {
    filteredFriends = filteredFriends.filter(friend => 
      friend.is_online || friend.recently_active
    );
  }

  const groupedFriends = groupFriendsByAlphabet(filteredFriends);
  const recentlyActiveCount = friends.filter(f => f.is_online || f.recently_active).length;

  const handleCall = (friend, type) => {
    setSelectedFriend(friend);
    if (type === 'voice') {
      setIsVideoCall(false);
      setShowPermissionRequest(true);
    } else if (type === 'video') {
      setIsVideoCall(true);
      setShowPermissionRequest(true);
    }
  };

  const handlePermissionAllow = () => {
    setShowPermissionRequest(false);
    setShowVideoCall(true);
  };

  const handlePermissionDeny = () => {
    setShowPermissionRequest(false);
    setSelectedFriend(null);
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      await friendsAPI.acceptFriendRequest(friendId);
      await loadPendingRequests();
      await loadFriends();
      // Close pending view if no more requests
      if (pendingRequests.length <= 1) {
        setShowPendingView(false);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Có lỗi xảy ra khi chấp nhận lời mời kết bạn');
    }
  };

  const handleRejectRequest = async (friendId) => {
    try {
      await friendsAPI.rejectFriendRequest(friendId);
      await loadPendingRequests();
      // Close pending view if no more requests
      if (pendingRequests.length <= 1) {
        setShowPendingView(false);
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Có lỗi xảy ra khi từ chối lời mời kết bạn');
    }
  };

  const handleUserClick = (friend) => {
    // Open chat with friend instead of profile
    if (onStartChat) {
      onStartChat(friend);
    }
  };

  const handleViewProfile = (friend) => {
    // Open user profile
    setSelectedUser(friend);
    setShowUserProfile(true);
  };

  const handleStartChatFromProfile = (user) => {
    // Close profile and open chat
    setShowUserProfile(false);
    setSelectedUser(null);
    if (onStartChat) {
      onStartChat(user);
    }
  };

  // Render Add Friend View
  if (showAddFriendView) {
    return (
      <AddFriendContainer>
        <AddFriendHeader>
          <BackButton onClick={() => setShowAddFriendView(false)}>
            ←
          </BackButton>
          <AddFriendTitle>Thêm bạn</AddFriendTitle>
        </AddFriendHeader>

        <QRSection>
          <QRCard>
            <QRUserName>{user?.full_name || 'Hoàng Minh Hiếu'}</QRUserName>
            <QRCodeBox>
              <QRPlaceholder>
                <BsQrCodeScan />
              </QRPlaceholder>
            </QRCodeBox>
            <QRText>Quét mã để thêm bạn Zalo với tôi</QRText>
          </QRCard>
        </QRSection>

        <PhoneInputSection>
          <PhoneInputWrapper>
            <CountryCodeSelect 
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              <option value="+84">+84</option>
              <option value="+1">+1</option>
              <option value="+86">+86</option>
              <option value="+82">+82</option>
            </CountryCodeSelect>
            <PhoneInput
              type="tel"
              placeholder="Nhập số điện thoại"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <SearchButton>
              <FiSearch size={20} />
            </SearchButton>
          </PhoneInputWrapper>
        </PhoneInputSection>

        <OptionButton>
          <OptionIcon>
            <BsQrCodeScan />
          </OptionIcon>
          <OptionContent>
            <OptionTitle>Quét mã QR</OptionTitle>
          </OptionContent>
        </OptionButton>

        <OptionButton>
          <OptionIcon>
            <FiUsers />
          </OptionIcon>
          <OptionContent>
            <OptionTitle>Bạn bè có thể quen</OptionTitle>
            <OptionSubtitle>Xem lời mời kết bạn đã gửi tại trang Danh bạ Zalo</OptionSubtitle>
          </OptionContent>
        </OptionButton>
      </AddFriendContainer>
    );
  }

  return (
    <ContactsContainer>
      <Header>
        <SearchContainer>
          <FiSearch size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <HeaderButton onClick={() => setShowAddFriendView(true)} title="Thêm bạn">
          <FiUser size={20} />
        </HeaderButton>
      </Header>

      <Tabs>
        <Tab active={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>
          Bạn bè
        </Tab>
        <Tab active={activeTab === 'groups'} onClick={() => setActiveTab('groups')}>
          Nhóm
        </Tab>
        <Tab active={activeTab === 'oa'} onClick={() => setActiveTab('oa')}>
          OA
        </Tab>
      </Tabs>

      <Content>
        {activeTab === 'friends' && (
          <>
            {/* Friend Requests Section */}
            {pendingRequests.length > 0 && (
              <Section onClick={() => setShowPendingView(true)} style={{ cursor: 'pointer' }}>
                <SectionHeader>
                  <SectionHeaderContent>
                    <SectionIconWrapper bgColor="#0084ff">
                      <FiUserPlus size={18} color="white" />
                    </SectionIconWrapper>
                    <SectionTitle>
                      Lời mời kết bạn ({pendingRequests.length})
                    </SectionTitle>
                  </SectionHeaderContent>
                </SectionHeader>
              </Section>
            )}

            {/* Birthdays Section */}
            {birthdays.length > 0 && (
              <Section>
                <SectionHeader highlight>
                  <SectionHeaderContent>
                    <SectionIconWrapper bgColor="#ff6b6b">
                      <FiGift size={18} color="white" />
                    </SectionIconWrapper>
                    <div>
                      <SectionTitle>
                        Sinh nhật 🎂
                      </SectionTitle>
                      <SectionSubtitle>
                        Hôm nay là sinh nhật của {birthdays[0]?.full_name || 'Bùi Ngọc Nhi'}
                      </SectionSubtitle>
                    </div>
                  </SectionHeaderContent>
                </SectionHeader>
              </Section>
            )}

            {/* Stats Section */}
            <Stats>
              <StatItem 
                active={statsFilter === 'all'}
                onClick={() => setStatsFilter('all')}
              >
                Tất cả <strong>{friends.length}</strong>
              </StatItem>
              <StatItem 
                active={statsFilter === 'recent'}
                onClick={() => setStatsFilter('recent')}
              >
                Mới truy cập
              </StatItem>
            </Stats>

            {/* Friends List */}
            <Section>
              {loading ? (
                <EmptyState>
                  <h3>Đang tải...</h3>
                </EmptyState>
              ) : filteredFriends.length === 0 ? (
                <EmptyState>
                  <h3>Không tìm thấy bạn bè</h3>
                  <p>{searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy thêm bạn bè để bắt đầu kết nối'}</p>
                </EmptyState>
              ) : (
                Object.keys(groupedFriends).sort().map(letter => (
                  <div key={letter}>
                    <AlphabetDivider>{letter}</AlphabetDivider>
                    {groupedFriends[letter].map(friend => (
                      <ContactItem key={friend.id} onClick={() => handleUserClick(friend)}>
                        <Avatar color={getAvatarColor(friend.full_name)}>
                          {friend.avatar_url ? (
                            <img src={getAvatarURL(friend.avatar_url)} alt={friend.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            getInitials(friend.full_name)
                          )}
                          {friend.is_online && <OnlineIndicator />}
                        </Avatar>
                        <ContactInfo>
                          <ContactName>{friend.full_name || 'Người dùng'}</ContactName>
                          {friend.status_message && (
                            <ContactStatus>{friend.status_message}</ContactStatus>
                          )}
                        </ContactInfo>
                        <ContactActions>
                          <ActionButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCall(friend, 'voice');
                            }}
                            title="Gọi thoại"
                          >
                            <FiPhone size={20} />
                          </ActionButton>
                          <ActionButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(friend);
                            }}
                            title="Nhắn tin"
                          >
                            <FiMessageSquare size={20} />
                          </ActionButton>
                        </ContactActions>
                      </ContactItem>
                    ))}
                  </div>
                ))
              )}
            </Section>
          </>
        )}

        {showPendingView && (
          <>
            <Section style={{ paddingTop: '8px' }}>
              <SectionHeader style={{ background: 'var(--bg-secondary, #f0f2f5)', cursor: 'pointer' }} onClick={() => setShowPendingView(false)}>
                <SectionTitle style={{ color: 'var(--primary-color, #0084ff)' }}>
                  ← Quay lại
                </SectionTitle>
              </SectionHeader>
            </Section>
          <Section>
            {loading ? (
              <EmptyState>
                <h3>Đang tải...</h3>
              </EmptyState>
            ) : pendingRequests.length === 0 ? (
              <EmptyState>
                <h3>Không có lời mời kết bạn</h3>
                <p>Lời mời kết bạn mới sẽ hiển thị ở đây</p>
              </EmptyState>
            ) : (
              pendingRequests.map(request => (
                <ContactItem key={request.id} onClick={() => handleUserClick(request)}>
                  <Avatar color={getAvatarColor(request.full_name)}>
                    {request.avatar_url ? (
                      <img src={getAvatarURL(request.avatar_url)} alt={request.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(request.full_name)
                    )}
                  </Avatar>
                  <ContactInfo>
                    <ContactName>{request.full_name || 'Người dùng'}</ContactName>
                    {request.mutual_friends && (
                      <ContactStatus>{request.mutual_friends} bạn chung</ContactStatus>
                    )}
                  </ContactInfo>
                  <ContactActions>
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptRequest(request.id);
                      }}
                      title="Chấp nhận"
                      style={{ background: '#0084ff', color: 'white' }}
                    >
                      <FiCheck size={20} />
                    </ActionButton>
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectRequest(request.id);
                      }}
                      title="Từ chối"
                      style={{ background: '#ff4444', color: 'white' }}
                    >
                      <FiX size={20} />
                    </ActionButton>
                  </ContactActions>
                </ContactItem>
              ))
            )}
          </Section>
          </>
        )}

        {activeTab === 'groups' && (
          <EmptyState>
            <h3>Nhóm</h3>
            <p>Danh sách nhóm của bạn sẽ hiển thị ở đây</p>
          </EmptyState>
        )}

        {activeTab === 'oa' && (
          <EmptyState>
            <h3>OA</h3>
            <p>Danh sách Official Account sẽ hiển thị ở đây</p>
          </EmptyState>
        )}
      </Content>

      {showPermissionRequest && selectedFriend && (
        <PermissionRequest
          isVideoCall={isVideoCall}
          conversationName={selectedFriend.full_name || selectedFriend.username}
          onAllow={handlePermissionAllow}
          onDeny={handlePermissionDeny}
        />
      )}

      {showVideoCall && selectedFriend && socket && (
        <VideoCall
          conversation={selectedFriend}
          isVideoCall={isVideoCall}
          isIncoming={false}
          socket={socket}
          onClose={() => {
            setShowVideoCall(false);
            setSelectedFriend(null);
          }}
        />
      )}

      {showUserProfile && selectedUser && (
        <MobileUserProfile
          user={selectedUser}
          currentUserId={user?.id}
          onClose={() => {
            setShowUserProfile(false);
            setSelectedUser(null);
          }}
          onStartChat={handleStartChatFromProfile}
        />
      )}
    </ContactsContainer>
  );
};

export default MobileContacts;

