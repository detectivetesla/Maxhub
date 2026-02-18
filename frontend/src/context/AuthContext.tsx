import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/utils/api';
import { supabase } from '@/utils/supabase';

interface User {
    id: string;
    email: string;
    fullName: string;
    walletBalance: number;
    phoneNumber?: string;
    isBlocked?: boolean;
    role: 'customer' | 'admin';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (data: { token: string; user: User }) => void;
    register: (data: { email: string; fullName: string; phoneNumber: string; password: string }) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        if (token) {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data.user);
            } catch (error) {
                console.error('Failed to fetch user:', error);
                logout();
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, [token]);

    // Real-time user updates (e.g. balance changes from webhooks)
    useEffect(() => {
        let userChannel: any = null;
        if (supabase && user?.id) {
            userChannel = supabase
                .channel(`user-data-${user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${user.id}`
                }, () => {
                    console.log('User data updated in DB, refreshing...');
                    fetchUser();
                })
                .subscribe();
        }

        return () => {
            if (userChannel) {
                supabase?.removeChannel(userChannel);
            }
        };
    }, [user?.id]);

    const login = (data: { token: string; user: User }) => {
        const { token, user } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
    };

    const register = async (data: any) => {
        await api.post('/auth/register', data);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser: fetchUser, isAuthenticated: !!token, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
