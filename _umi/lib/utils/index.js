/**
 * 源码位置：umi/packages/utils，包名为@umijs/utils
 */
const { existsSync } = require('fs')
const { join } = require('path')

const extsMap = {
  javascript: ['.ts', '.tsx', '.js', '.jsx'],
  css: ['.less', '.sass', '.scss', '.stylus', '.css']
}

/**
 * 统一路径分隔符/
 * @param {string} path 文件或者文件夹路径
 * @returns 统一后的路径
 */
function winPath (path) {
  // @XXX 不知道这个扩展长度路径是干啥的
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  if (isExtendedLengthPath) {
    return path;
  }
  return path.replace(/\\/g, '/')
}

/**
 * 尝试匹配特定目录中文件的精确文件名
 * @param {object} opts 
 * @returns 生成后的路由配置
 * - matched: `{ path: string; filename: string }`
 * - otherwise: `null`
 */
function getFile (opts) {
  const exts = extsMap[opts.type]
  for (const ext of exts) {
    const filename = `${opts.fileNameWithoutExt}${ext}`
    const path = winPath(join(opts.base, filename))
    // 如果存在，则返回
    if (existsSync(path)) {
      return {
        path,
        filename,
      };
    }
  }
  return null
}

/**
 * 获取当前机器IP
 * 参考地址：https://blog.csdn.net/weixin_30236595/article/details/98395908
 */
function getIPAdress () {
  let interfaces = require('os').networkInterfaces()
  for (let devName in interfaces) {
    let iface = interfaces[devName]
    for (let i = 0; i < iface.length; i++) {
      let alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address
      }
    }
  }
}

/**
 * 通过浏览器打开链接
 * @param {string} url  链接
 * @param {string} type 浏览器
 * 参考地址：https://www.jb51.net/article/113860.htm
 */
function openUrl (url, type = 'chrome') {
  const open = require('open')
  open(url, type)
}

module.exports = {
  winPath,
  getFile,
  getIPAdress,
  openUrl
}