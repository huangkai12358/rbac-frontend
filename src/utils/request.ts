import axios, { type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { Result } from '@/types/result'

const request = axios.create({
  baseURL: import.meta.env.PROD ? 'https://rbac.ymjrhk.com/api' : 'http://localhost:8083/api',
  timeout: 10000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers!.Authorization = `Bearer ${token}`
  }

  return config
})

request.interceptors.response.use(
  (res: AxiosResponse<Result<any>>) => {
    // res 回调处理的是：HTTP 请求“成功返回（2xx）”的情况
    const result = res.data

    if (result.code !== 0) {
      ElMessage.error(result.errorMessage || '请求失败')
      return Promise.reject(result) // 返回 Promise.reject(...)，如果被 try 会进入 catch。
    }

    return result.data
  },
  (error) => {
    // error 回调处理的是：HTTP 请求“失败（非 2xx 或网络异常）”的情况

    if (error.response?.status === 401) { // 处理 401
      localStorage.clear()
      location.href = '/login'
    } else if (error.response?.status === 400) { // 处理 400
      const message = error.response?.data?.errorMessage || '请求参数错误'
      ElMessage.error(message)
    } else if (error.response?.status === 403) { // 处理 403
      location.href = '/403'
    } else { // 其他数字
      ElMessage.error('网络异常，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

export default request
