/**
 * 源码位置：umi\packages\preset-built-in\src\plugins\routes.ts
 */
const Mustache = require('mustache') 
const { join } = require('path')
const { readFileSync } = require('fs')
const writeTmpFile = require('../../writeTmpFile')
const Routes = require('../../Route/Route')
/**
 * 写入临时文件
 */
const plugin = (pluginAPI) => {
  // 监听一个事件，生成文件了
  pluginAPI.onGenerateFiles(async () => {
    const routesTpl = readFileSync(join(__dirname, 'routes.tpl'), 'utf8')
    const routes = await new Routes().getRoutes({ root: pluginAPI.service.paths.absPagesPath })
    let content = Mustache.render(routesTpl, {
      routes: new Routes().getJSON({ routes })
    })
    writeTmpFile({
      path: 'core/routes.js',
      content
    })
  })
}

module.exports = plugin