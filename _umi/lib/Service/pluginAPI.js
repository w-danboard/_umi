const assert = require('assert')
/**
 * 插件核心方法的类，插件的编写需借助这个api，扩展方法需要在preset-built-in的presets集合中进行扩展
 */
class PluginAPI {
  constructor (opts) {
    this.id = opts.id
    this.service = opts.service
  }
  // 注册命令
  registerCommand(command) {
    const { name, alias } = command
    assert(!this.service.commands[name], `api.registerCommand() failed, the command ${name} is exists.`)
    // this.service.commands.dev = { name, description, fn }
    this.service.commands[name] = command
    if (alias) {
      this.service.commands[alias] = name
    }
  }
  // 注册钩子
  register (hook) {
    assert(
      hook.fn && typeof hook.fn === 'function',
      `api.register() failed, hook.fn must supplied and should be function, but got ${hook.fn}.`
    )
    this.service.hooksByPluginId[this.id] = (
      this.service.hooksByPluginId[this.id] || []
    ).concat(hook)
  }

  // 等等方法... 包含：注册预设registerPresets、注册方法registerMethod、跳过插件，不执行的插件skipPlugins
}

module.exports = PluginAPI