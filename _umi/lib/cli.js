let Service = require('./Service/Service')
// 每个命令都是由插件完成的
let pluginDev = require('./plugins/commands/dev')
let pluginUmi = require('./plugins/generateFiles/umi')
let pluginHistory = require('./plugins/generateFiles/history')
let pluginRoutes = require('./plugins/generateFiles/routes')
let pluginPlugin = require('./plugins/generateFiles/plugin')

;(async function() {
  /**
   * 插件的标准定义 { id: 'dev', apply: 此插件对应的函数 }
   */
   await new Service({
    presets: {},
    plugins: [
      { id: 'dev', apply: pluginDev },
      { id: 'history', apply: pluginHistory },
      { id: 'umi', apply: pluginUmi },
      { id: 'routes', apply: pluginRoutes },
      { id: 'plugin', apply: pluginPlugin }
    ]
  }).run({ name: 'dev' })
})()