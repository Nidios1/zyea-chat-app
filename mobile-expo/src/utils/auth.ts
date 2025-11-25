import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

export const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    return token;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error removing token:', error);
    throw error;
  }
};

export const getStoredUser = async (): Promise<any | null> => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting stored user:', error);
    return null;
  }
};

export const storeUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user:', error);
    throw error;
  }
};

export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error removing user:', error);
    throw error;
  }
};

// Multiple accounts management
export interface AccountData {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  token: string;
  lastLogin?: string;
}

export const getStoredAccounts = async (): Promise<AccountData[]> => {
  try {
    const accountsJson = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return accountsJson ? JSON.parse(accountsJson) : [];
  } catch (error) {
    console.error('Error getting stored accounts:', error);
    return [];
  }
};

export const storeAccounts = async (accounts: AccountData[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error storing accounts:', error);
    throw error;
  }
};

export const addAccount = async (account: AccountData): Promise<void> => {
  try {
    const accounts = await getStoredAccounts();
    // Remove existing account with same id if exists
    const filteredAccounts = accounts.filter(acc => acc.id !== account.id);
    // Add new account at the beginning
    filteredAccounts.unshift(account);
    await storeAccounts(filteredAccounts);
  } catch (error) {
    console.error('Error adding account:', error);
    throw error;
  }
};

export const removeAccount = async (accountId: string): Promise<void> => {
  try {
    const accounts = await getStoredAccounts();
    const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
    await storeAccounts(filteredAccounts);
  } catch (error) {
    console.error('Error removing account:', error);
    throw error;
  }
};

export const getCurrentAccountId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_ACCOUNT_ID);
  } catch (error) {
    console.error('Error getting current account id:', error);
    return null;
  }
};

export const setCurrentAccountId = async (accountId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_ACCOUNT_ID, accountId);
  } catch (error) {
    console.error('Error setting current account id:', error);
    throw error;
  }
};

