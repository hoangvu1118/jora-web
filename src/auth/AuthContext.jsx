import { createContext, useContext, useState } from "react";
import { login, register } from "../api/auth";
import { clearToken, getToken, saveToken } from "../api/client";

// Holds "who is logged in" for the whole app. Read it in any component with useAuth().
const AuthContext = createContext(null);
const NAME_KEY = "jora.name";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [name, setName] = useState(localStorage.getItem(NAME_KEY) || "");

  async function logIn(email, password) {
    const response = await login(email, password);
    let displayName = response.username;
    if (!displayName) {
      displayName = email;
    }
    saveToken(response.token);
    localStorage.setItem(NAME_KEY, displayName);
    setToken(response.token);
    setName(displayName);
  }

  async function signUp(email, password) {
    await register(email, password);
    await logIn(email, password);
  }

  function logOut() {
    clearToken();
    localStorage.removeItem(NAME_KEY);
    setToken(null);
    setName("");
  }

  const value = {
    isLoggedIn: token !== null,
    name: name,
    logIn: logIn,
    signUp: signUp,
    logOut: logOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
