const http = require('http')
const chalk = require('chalk')
const { join } = require('path')
const express = require('express')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpackDevMiddleware = require('webpack-dev-middleware')
// const webpackHotMiddleware = require('webpack-hot-middleware') // 无效
const webpackConfig = require('./webpack.config')
const { getIPAdress, openUrl } = require('./utils')

class Server {
  constructor (opts) {
    this.app = express()
    this.paths = opts.service.paths
  }
  // 创建webpack中间件，打包并预览项目
  setupDevMiddleware () {
    webpackConfig.entry = join(this.paths.absTmpPath, 'umi.js')
    webpackConfig.resolve.alias['@'] = this.paths.absSrcPath
    webpackConfig.plugins.push(
      new HtmlWebpackPlugin({ template: join(__dirname, 'index.html')})
    )

    const compiler = webpack(webpackConfig)
    // 把compiler传给webpackDevMiddleware中间件 (默认是放到内存里，配置writeToDisk: true则放入硬盘)
    const devMiddleware = webpackDevMiddleware(compiler, {
      // writeToDisk: true
    })
    // const hotMiddleWare = webpackHotMiddleware(compiler)
   
    this.app.use(devMiddleware) // 使用中间件
    // this.app.use(hotMiddleWare) // 使用中间件

    // 若不写此中间件，就请求到服务端了，服务端要注册路由才行
    this.app.use((req, res, next) => {
      // 类似fs.readFileSync方法，读取某个文件并返回  (或者memory-fs)
      // webpack会将打包后的文件通过compiler.outputFileSystem进行写入，可能硬盘，可能内存
      res.send(compiler.outputFileSystem.readFileSync(join(__dirname, 'dist/index.html'), 'utf8'))
    })
    return devMiddleware
  }
  async start () {
    const port = 8000
    const devMiddleware = this.setupDevMiddleware();
    devMiddleware.waitUntilValid(() => {
      // webpack打包之后会执行这个回调，启动服务
      let listeningApp = http.createServer(this.app)
      listeningApp.listen(8000, () => {
        const url = `http://localhost:${port}`
        const addressUrl = `http://${getIPAdress()}:${port}`
        console.log(`Server ready at:\n - Local: ${chalk.green(url)}\n - Network: ${chalk.green(addressUrl)}`)
        openUrl(url)
      })
    })
  }
}
module.exports = Server