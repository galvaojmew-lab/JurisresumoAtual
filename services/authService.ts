import { User } from '../types';

const USERS_KEY = 'jurisResumoUsers';
const SESSION_KEY = 'jurisResumoSession';

// --- Helper Functions ---
const getUsers = (): User[] => {
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Error reading users from local storage:', error);
    return [];
  }
};

const saveUsers = (users: User[]): void => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error)
    {
    console.error('Error saving users to local storage:', error);
  }
};

// --- Public Service Functions ---

/**
 * Initializes the default admin user if it doesn't exist.
 * WARNING: In a real app, this should be handled securely on a backend.
 */
export const initAdmin = (): void => {
  const users = getUsers();
  const adminExists = users.some(user => user.isAdmin);
  if (!adminExists) {
    const adminUser: User = {
      id: 'admin-' + new Date().toISOString(),
      email: 'admin@admin.com',
      password: 'admin', // Storing plain text password for prototype purposes ONLY.
      isAdmin: true,
      isApproved: true,
    };
    users.push(adminUser);
    saveUsers(users);
  }
};

/**
 * Registers a new user.
 * @param email User's email
 * @param password User's password
 * @returns The newly created user object.
 */
export const register = (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        const users = getUsers();
        if (users.some(user => user.email === email)) {
            return reject(new Error('Um usuário com este e-mail já existe.'));
        }

        const newUser: User = {
            id: 'user-' + new Date().toISOString() + Math.random(),
            email,
            password, // Storing plain text password for prototype purposes ONLY.
            isAdmin: false,
            isApproved: false, // New users require approval
        };

        users.push(newUser);
        saveUsers(users);
        resolve(newUser);
    });
};

/**
 * Logs in a user.
 * @param email User's email
 * @param password User's password
 * @returns The logged-in user object.
 */
export const login = (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Persist session
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
            resolve(user);
        } else {
            reject(new Error('E-mail ou senha inválidos.'));
        }
    });
};

/**
 * Logs out the current user.
 */
export const logout = (): void => {
    sessionStorage.removeItem(SESSION_KEY);
};

/**
 * Gets the currently logged-in user from session storage.
 * @returns The current user or null if not logged in.
 */
export const getCurrentUser = (): User | null => {
    try {
        const userJson = sessionStorage.getItem(SESSION_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch {
        return null;
    }
};

/**
 * Retrieves all users (for admin purposes).
 * @returns An array of all users.
 */
export const getAllUsers = (): User[] => {
    return getUsers();
};

/**
 * Updates a user's approval status.
 * @param userId The ID of the user to update.
 * @param isApproved The new approval status.
 */
export const updateUserApproval = (userId: string, isApproved: boolean): void => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].isApproved = isApproved;
        saveUsers(users);
    }
};