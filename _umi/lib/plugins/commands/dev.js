/**
 * 源码位置：umi/packages/preset-built-in/src/plugins/commands/dev/dev.ts 
 */
const Server = require('../../Server')
const plugin = (pluginAPI) => {
  // 注册命令
  pluginAPI.registerCommand({
    name: 'dev',
    description: '启动服务',
    fn: async function () {
      await pluginAPI.service.applyPlugins({
        key: 'onGenerateFiles'
      })
      new Server(pluginAPI).start()
    }
  })
}
module.exports = plugin