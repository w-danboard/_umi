let { join } = require('path')
let { existsSync, statSync } = require('fs')

/**
 * 判断某个路径的文件是否存在，并且是一个目录
 * @param {string} path 文件夹路径
 * @returns 
 */
 function isDirectoryAndExist (path) {
  return existsSync(path) && statSync(path).isDirectory()
}


/**
 * getPath 是 getServicePaths 别名
 * @param {string} cwd 当前工作目录
 * @param {any} config 用户配置
 * @param {string} env 环境变量
 * @returns 指定输出路径
 */
module.exports = function getServicePath ({ cwd, config, env }) {
  // 项目的根目录
  let absSrcPath = cwd

  // 若src目录存在，则将 absSrcPath 定位到src路径下
  if (isDirectoryAndExist(join(cwd, 'src'))) {
    absSrcPath = join(cwd, 'src')
  }

  // 用户是否配置单数模式目录，若是则为 src/page, 否则为 src/pages
  const absPagesPath = config.singular
    ? join(absSrcPath, 'page')
    : join(absSrcPath, 'pages')

  // 临时文件路径
  const tmpDir = ['._umi', env !== 'development' && env]
    .filter(Boolean)
    .join('-')

  // 源码中使用normalizeWithWinPath方法返回
  return {
    // cwd,                                                      // 当前工作路径
    // absNodeModulesPath: join(cwd, 'node_modules'),            // node_modules路径
    // absOutputPath: join(cwd, config.outputPath || './dist'),  // 输出路径
    absSrcPath,                             // src目录路径
    absPagesPath,                           // 路由文件系统路径
    absTmpPath: join(absSrcPath, tmpDir)    // 临时文件夹路径
  }
}

