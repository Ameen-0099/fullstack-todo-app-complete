"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import Login from '../components/Login';
import Register from '../components/Register';
import { useAuth } from '../context/AuthContext'; // Import useAuth

interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 

export default function Home() {
  const router = useRouter(); // Initialize useRouter
  const { isAuthenticated, user, logout, token, isLoading: authLoading, error: authError } = useAuth(); // Use useAuth hook
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');
  const [editedTaskDescription, setEditedTaskDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Local loading state for tasks
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'pending', 'completed'
  const [sortField, setSortField] = useState<string>('created_at'); // 'created_at', 'title'
  const [error, setError] = useState<string | null>(null); // Local error state for tasks
  const [showLogin, setShowLogin] = useState(true); // State to toggle between Login/Register forms

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchTasks();
    } else if (!isAuthenticated && !authLoading) {
      setLoading(false); // If not authenticated and auth check is done, stop local loading
    }
  }, [isAuthenticated, token, authLoading, filterStatus, sortField]); // Re-run when auth state changes or filter/sort changes

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (sortField) {
        params.append('sort', sortField);
      }
      const queryString = params.toString();
      const url = `${API_BASE_URL}/api/tasks${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout(); // Token might be expired or invalid
          router.push('/'); // Redirect to home/login
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data: Task[] = await response.json();
      setTasks(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching tasks.');
      }
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTaskTitle }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      setNewTaskTitle('');
      fetchTasks();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while creating the task.');
      }
    }
  };

  const toggleTaskCompletion = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      fetchTasks();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while updating the task.');
      }
    }
  };

  const updateTask = async (id: number, newTitle: string, newDescription: string | null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      setEditingTaskId(null); // Exit editing mode
      setEditedTaskTitle('');
      setEditedTaskDescription(null);
      fetchTasks(); // Refresh the task list
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while updating the task.');
      }
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      fetchTasks();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while deleting the task.');
      }
    }
  };

  // No longer need handleLoginSuccess, handleRegisterSuccess, handleLogout here as AuthContext handles it.

  if (authLoading) {
    return <div className="container mx-auto p-4 text-center">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center min-h-screen items-center bg-gray-100 py-6">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          {authError && <p className="text-red-500 text-center mb-4 text-sm">{authError}</p>}
          {showLogin ? (
            <>
              <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Login to Your Account</h2>
              <Login />
              <p className="mt-6 text-center text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setShowLogin(false)}
                  className="text-blue-600 hover:text-blue-800 font-medium transition duration-150 ease-in-out"
                >
                  Register
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Create an Account</h2>
              <Register />
              <p className="mt-6 text-center text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setShowLogin(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium transition duration-150 ease-in-out"
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render dashboard/tasks for authenticated users
  return (
    <>
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-xl">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Todo App {user ? `for ${user.email}` : ''}
            </h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition ease-in-out duration-150"
            >
              Logout
            </button>
          </div>

          <form onSubmit={createTask} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new task"
              className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-900"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition ease-in-out duration-150"
            >
              Add Task
            </button>
          </form>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label htmlFor="filter" className="text-gray-700 font-medium">Filter by Status:</label>
              <select
                id="filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-gray-700 font-medium">Sort by:</label>
              <select
                id="sort"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              >
                <option value="created_at">Created At</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>

          {loading && <p>Loading tasks...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          {!loading && tasks.length === 0 && <p>No tasks yet. Add one above!</p>}

          <ul className="space-y-3">
            {tasks.map((task) => (
              <li key={task.id} className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {editingTaskId === task.id ? (
                  // Editing mode
                  <div className="flex-grow w-full">
                    <input
                      type="text"
                      value={editedTaskTitle}
                      onChange={(e) => setEditedTaskTitle(e.target.value)}
                      className="border p-2 w-full mb-2 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <textarea
                      value={editedTaskDescription || ''}
                      onChange={(e) => setEditedTaskDescription(e.target.value)}
                      className="border p-2 w-full text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Task description (optional)"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => updateTask(task.id, editedTaskTitle, editedTaskDescription)}
                        className="px-3 py-1 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 text-sm transition ease-in-out duration-150"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingTaskId(null);
                          setEditedTaskTitle('');
                          setEditedTaskDescription(null);
                        }}
                        className="px-3 py-1 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 text-sm transition ease-in-out duration-150"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex-grow flex items-start sm:items-center gap-3 w-full">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id)}
                      className="min-w-[20px] min-h-[20px] text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'} flex-grow`}>
                      <p className="font-semibold text-lg">{task.title}</p>
                      {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                    </span>

                    <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditedTaskTitle(task.title);
                          setEditedTaskDescription(task.description);
                        }}
                        className="px-3 py-1 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 text-sm transition ease-in-out duration-150"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="px-3 py-1 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 text-sm transition ease-in-out duration-150"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
