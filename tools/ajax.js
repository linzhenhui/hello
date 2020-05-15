import Vue from 'vue'
import axios from 'axios'
import { syncAjax } from 'jquery'

let vm = new Vue()
Vue.prototype.$http = axios
Tools.prototype.$http = axios
Vue.prototype.syncAjax = syncAjax

// 默认不需要缓存
axios.defaults.headers.get['Cache-Control'] = 'no-cache'
axios.defaults.headers.post['Cache-Control'] = 'no-cache'

axios.defaults.headers.get['X-Requested-With'] = 'XMLHttpRequest'
axios.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest'

/**
 *
 * @param type  ajax类型 get post
 * @param options  = {
 *  url: 地址
 *  data: 数据
 *  success:  成功回调
 *  error:  错误回调
 *  contentType: 请求头内容类型    默认 application/json;charset=UTF-8
 *  needCache: 是否需要缓存  默认不缓存
 *  noErrorTip: 请求错是否自动提示 默认true
 *  modal: 弹窗提示是否需要遮罩  默认 true有遮罩
 * }
 * @returns promis
 */

Vue.prototype.http = Tools.prototype.http = {
  get: function (options) { // url, data, success , noErrorTip, needCache
    if (options.needCache) {
      axios.defaults.headers.get['Cache-Control'] = 'no-cache'
    } else {
      axios.defaults.headers.get['Cache-Control'] = 'max-age=0'
    }
    return ajax.call(this, 'get', options)
  },
  post: function (options) {
    if (options.needCache) {
      axios.defaults.headers.post['Cache-Control'] = 'no-cache'
    } else {
      axios.defaults.headers.post['Cache-Control'] = 'max-age=0'
    }
    if (global.config.mock) {
      // 如果是 mock  将post 换成 get
      return ajax.call(this, 'get', options)
    } else {
      return ajax.call(this, 'post', options)
    }
  }
}

function ajax (type, options) {
  let t = (new Date()).getTime()
  let params = options.data || {}
  let urlLen = options.url.length
  let modal = options.modal === undefined ? true : !!options.modal
  if (global.config.mock && options.url.substr(urlLen - 5, 5) !== '.json') {
    let module = options.url.split('/')[0] ? options.url.split('/')[0] : options.url.split('/')[1]
    options.url = 'static/mockData/' + module + '/' + options.url.split('?')[0].replace(/\//g, '_') + '.json'
  }

  let promis

  /*如果url后面没带参数则加上时间戳*/
  let arr = options.url.split('?')
  if (arr.length > 1) {

  } else {
    options.url += '?_' + new Date().getTime()
  }
  let toast = null
  if (modal) {
    if (window.toastTimer) {
      window.clearTimeout(window.toastTimer)
    }
    toast = vm.$toast.loading({
      mask: true,
      duration: 0
    })
  }
  if (type === 'get') {
    promis = vm.$http.get(options.url, {params: params})
  } else {
    promis = vm.$http.post(options.url, params, {
      headers: {
        'Content-Type': options.contentType || 'application/json;charset=UTF-8',
      }
    })
  }
  promis.then(function (data) {
    window.toastTimer = setTimeout(() => {
      toast && toast.clear()
    }, 500)
    //session超时刷新页面
    if (data.data.message === 'ajaxSessionTimeOut') {
      vm.$dialog.alert({
        message: '登录超时，请重新登陆！'
      }).then(() => {
        nativeFunction('closeView')
      })
      return
    }

    options.success ? options.success(data.data) : ''
  }, function (res) {
    toast && toast.clear()
    let errorMap = {
      '404': '系统出现异常(404)，请联系运维人员或稍后重试！',
      '500': '系统出现异常(502)，请联系运维人员或稍后重试！',
      '502': '系统出现异常(502)，请联系运维人员或稍后重试！',
      '503': '系统出现异常(503)，请联系运维人员或稍后重试！',
      '504': '系统出现异常(504)，请联系运维人员或稍后重试！',
      '900': '系统出现异常(900)，请联系运维人员或稍后重试！',
      'timeout': '错误：timeout，连接超时',
      'parsererror': '错误：parsererror，发送数据异常'
    }
    if (options.error) {
      options.error(res)
      return
    }
    if (options.noErrorTip) {
      return
    }

    vm.$dialog.alert({
      title: '提示',
      message: errorMap[res.states] || '网络繁忙，请稍后再试'
    })
  })
  return promis
}
