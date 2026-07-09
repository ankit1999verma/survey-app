import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      
      if (res.data.token) {
        const userObj = {
          username: res.data.username,
          role: res.data.role,
          companyId: res.data.companyId
        };
        await AsyncStorage.setItem('userInfo', JSON.stringify(userObj));
        await AsyncStorage.setItem('userToken', res.data.token);
        
        setUserInfo(userObj);
        setUserToken(res.data.token);
      }
    } catch (error) {
      console.error(`Login error: ${error}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setUserToken(null);
      setUserInfo(null);
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      console.error(`Logout error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let userInfoStr = await AsyncStorage.getItem('userInfo');
      let userTokenStr = await AsyncStorage.getItem('userToken');
      
      if (userInfoStr && userTokenStr) {
        setUserInfo(JSON.parse(userInfoStr));
        setUserToken(userTokenStr);
      }
    } catch (error) {
      console.error(`isLoggedIn error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
