import React from 'react';

const AuthContext = React.createContext({
  user: null,
  login: () => {},
  logout: () => {},
  clearUserState: () => {},
  preloadedData: null
});

export default AuthContext;
