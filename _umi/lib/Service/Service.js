/**
 * 源码位置：umi\packages\core\src\Service\Service.ts
 */
const EventEmitter = require('events').EventEmitter
const { AsyncParallelHook } = require('tapable')
const PluginAPI = require('./pluginAPI')
const getPaths = require('./getPaths')

/**
 * 微内核
 */
class Service extends EventEmitter {
  constructor (opts) {
    super()
    
    this.cwd = opts.cwd || process.cwd() // 进程的当前工作目录
    this.userConfig = {}                 // this.configInstance.getUserConfig() 用户配置，userConfig.outputPath 配置了输出文件路径，默认是 dist
    this.env = 'development'             // opts.env || process.env.NODE_ENV 环境变量

    this.commands = {}          // 存放着所有的命令和他们的对实现 {dev: { name, description, fn }}
    this.plugins = opts.plugins // [{ id: 'dev', apply: pluginDev }]
    this.hooksByPluginId = {}   // 按插件ID划分 {插件ID, [hook]}
    this.hooks = {}             // 按类型划分 { 'onGenerateFiles':[hook] }

    // 获取路径
    this.paths = getPaths({
      cwd: this.cwd,
      config: this.userConfig,
      env: this.env
    })
  }
  async init () {
    await this.initPresetsAndPlugins()
    // 按事件类型对钩子进行分类
    Object.keys(this.hooksByPluginId).forEach(pluginId => {
      let pluginHooks = this.hooksByPluginId[pluginId]
      pluginHooks.forEach(hook => {
        const { key } = hook
        hook.pluginId = pluginId
        this.hooks[key] = (this.hooks[key] || []).concat(hook)
      })
    })
  }
  // 注册预设和插件
  async initPresetsAndPlugins () {
    while (this.plugins.length) {
      await this.initPlugin(this.plugins.shift())
    }
  }
  // 注册插件
  async initPlugin (plugin) {
    const pluginAPI = this.getPluginAPI({ id: plugin.id, service: this })
    plugin.apply(pluginAPI)
  }
  // pluginAPI是插件核心方法的类
  getPluginAPI (opts) {
    const pluginAPI = new PluginAPI(opts)
    pluginAPI.onGenerateFiles = (fn) => {
      pluginAPI.register({
        pluginId: opts.id,
        key: 'onGenerateFiles',
        fn
      })
    }
    return pluginAPI
  }
  // 执行插件
  async applyPlugins (opts) {
    let hooksForKey = this.hooks[opts.key] || []
    // 源码中使用的串行钩子AsyncSeriesWaterfallHook
    let tEvent = new AsyncParallelHook(['_'])
    for (const hook of hooksForKey) {
      tEvent.tapPromise({ name: hook.pluginId }, hook.fn )
    }
    return await tEvent.promise()
  }
  /**
   * 主要做了两件事
   * 1.初始化preset和plugin，获得所有的plugin，注册plugin中的hook
   * 2.依次执行hook
   */
  async run ({ name, args = {} }) {
    await this.init()
    return this.runCommand({ name, args })
  }
  async runCommand ({ name }) {
    const command = this.commands[name]
    return command.fn()
  }
}

module.exports = Service