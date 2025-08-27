import { v4 as uuidv4 } from 'uuid';
import { User, AuthState } from '../types';

class AuthService {
  private readonly STORAGE_KEYS = {
    USERS: 'tcmt_users',
    CURRENT_USER: 'tcmt_current_user'
  };

  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  private setToStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      throw error;
    }
  }

  initializeDefaultUser(): void {
    const users = this.getFromStorage<User[]>(this.STORAGE_KEYS.USERS, []);
    if (users.length === 0) {
      const defaultUser: User = {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@tcmt.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      
      // Hash password (simple hash for demo - in production use proper hashing)
      const hashedPassword = btoa('admin');
      localStorage.setItem('tcmt_password_admin', hashedPassword);
      
      users.push(defaultUser);
      this.setToStorage(this.STORAGE_KEYS.USERS, users);
    }
  }

  login(username: string, password: string): { success: boolean; user?: User; error?: string } {
    const users = this.getFromStorage<User[]>(this.STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const storedPassword = localStorage.getItem(`tcmt_password_${username}`);
    const hashedPassword = btoa(password);
    
    if (storedPassword !== hashedPassword) {
      return { success: false, error: 'Invalid password' };
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = user;
    this.setToStorage(this.STORAGE_KEYS.USERS, users);
    
    // Set current user
    this.setToStorage(this.STORAGE_KEYS.CURRENT_USER, user);
    
    return { success: true, user };
  }

  register(username: string, password: string, email: string, role: 'admin' | 'tester' = 'tester'): { success: boolean; user?: User; error?: string } {
    const users = this.getFromStorage<User[]>(this.STORAGE_KEYS.USERS, []);
    
    // Check if username already exists
    if (users.some(u => u.username === username)) {
      return { success: false, error: 'Username already exists' };
    }
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }
    
    // Validate password strength
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }
    
    // Create new user
    const newUser: User = {
      id: uuidv4(),
      username,
      email,
      role,
      createdAt: new Date().toISOString()
    };
    
    // Hash and store password
    const hashedPassword = btoa(password);
    localStorage.setItem(`tcmt_password_${username}`, hashedPassword);
    
    users.push(newUser);
    this.setToStorage(this.STORAGE_KEYS.USERS, users);
    
    return { success: true, user: newUser };
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
  }

  getCurrentUser(): User | null {
    return this.getFromStorage<User | null>(this.STORAGE_KEYS.CURRENT_USER, null);
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  getAuthState(): AuthState {
    const user = this.getCurrentUser();
    return {
      user,
      isAuthenticated: user !== null
    };
  }
}

export const authService = new AuthService();