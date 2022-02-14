/**
 * 源码位置：
 */
const Mustache = require('mustache')
const { join } = require('path')
const { readFileSync } = require('fs')
const writeTmpFile = require('../../writeTmpFile')
/**
 * 写入临时文件
 */
const plugin = (pluginAPI) => {
  pluginAPI.onGenerateFiles(async () => {
    const umiTpl = readFileSync(join(__dirname, 'umi.tpl'), 'utf8')
    let content = Mustache.render(umiTpl)
    writeTmpFile({
      path: 'umi.js',
      content
    })
  })
}

module.exports = plugin

/**
 * generate files 真的是 umi 非常有创意的一点设计，umi 为了简化代码，它根据配置生成一系列代码，并将这些代码放到临时文件下。以 plugins/generateFiles/umi 为例。

generate files 的流程一般都是编写一个模板文件，然后根据配置完成模板文件中的变量替换，最后将替换后的文件内容输出到指定目录。

plugins/generateFiles/umi 生成的是 umi 项目的入口文件，可以看到，该文件中会收集一些插件对于入口文件的更改信息，然后将这些代码放到模板文件中。
 */