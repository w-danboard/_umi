let mkdirp = require('mkdirp')
let { writeFileSync } = require('fs')
let { dirname, join } = require('path')
let getPaths = require('./Service/getPaths')

let cwd = process.cwd()  // 进程的当前工作目录
let userConfig = {}      // this.configInstance.getUserConfig() 用户配置
let env = 'development'  // opts.env || process.env.NODE_ENV 环境变量
/**
 * 向临时文件写入文件, @FIXME 源码中是通过 register methods，注册的函数
 * @param {path} 写入文件路径
 * @param {content} 写入的内容
 * 关于mkdirp: https://www.npmjs.com/package/mkdirp 返回值为Promise
 */
async function writeTmpFile ({ path, content }) {
  const absPath = join(getPaths({cwd, config: userConfig, env}).absTmpPath, path)  // 写入的绝对路径
  await mkdirp(dirname(absPath))          // 保证此文件所在文件夹是存在的，如果不存在则先创建文件夹
  writeFileSync(absPath, content, 'utf8') // 将内容写入到文件路径中
}

module.exports = writeTmpFile