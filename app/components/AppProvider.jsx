"use client";

import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const logout = async () => {
    await axios.post("/api/auth/logout");
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AppContext.Provider>
  );
};
