// API configuration for Vercel deployment
const API_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  get: async (path: string) => {
    const response = await fetch(`${API_URL}/api${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  post: async (path: string, data: any) => {
    const response = await fetch(`${API_URL}/api${path}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  put: async (path: string, data: any) => {
    const response = await fetch(`${API_URL}/api${path}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json' 
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  delete: async (path: string) => {
    const response = await fetch(`${API_URL}/api${path}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};

// Helper function to build API URLs
export const buildApiUrl = (path: string) => {
  return `${API_URL}/api${path}`;
};

// Helper function for file uploads
export const uploadFile = async (path: string, formData: FormData) => {
  const response = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData // Don't set Content-Type header for FormData
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};