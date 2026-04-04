import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
}

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id: number) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: number, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
}

export const tasksAPI = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getOverdue: () => api.get('/tasks/overdue'),
  create: (data: any) => api.post('/tasks', data),
  update: (id: number, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
}

export const documentsAPI = {
  getAll: (params?: any) => api.get('/documents', { params }),
  create: (data: any) => api.post('/documents', data),
  update: (id: number, data: any) => api.put(`/documents/${id}`, data),
  delete: (id: number) => api.delete(`/documents/${id}`),
}

export const employeesAPI = {
  getAll: () => api.get('/employees'),
  getOne: (id: number) => api.get(`/employees/${id}`),
  update: (id: number, data: any) => api.put(`/employees/${id}`, data),
}

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  delete: (id: number) => api.delete(`/categories/${id}`),
}

export default api