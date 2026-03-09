import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || null);
    const [userId, setUserId] = useState(localStorage.getItem('userId') || null);
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('role', userRole);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userEmail', userEmail);
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userId');
            localStorage.removeItem('userEmail');
        }
    }, [token, userRole, userId, userEmail]);

    const login = (newToken, newRole, newId, newEmail) => {
        setToken(newToken);
        setUserRole(newRole);
        setUserId(newId);
        setUserEmail(newEmail);
    };

    const logout = () => {
        setToken(null);
        setUserRole(null);
        setUserId(null);
        setUserEmail(null);
    };

    return (
        <AuthContext.Provider value={{ token, userRole, userId, userEmail, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
