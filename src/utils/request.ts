import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://rbac.ymjrhk.com/api'
    : 'http://localhost:8083/api',
  timeout: 10000,
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers!.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  res => {
    const result = res.data
    if (result.code !== 0) {
      ElMessage.error(result.errorMessage || '请求失败')
      return Promise.reject(result)
    }
    return result.data
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.clear()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default request
