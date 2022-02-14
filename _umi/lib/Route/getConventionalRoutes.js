/**
 * 源码位置: umi/packages/core/src/Route/getConventionalRoutes.ts
 */
const assert = require('assert')
const { join, basename, extname, relative } = require('path')
const { existsSync, readdirSync, statSync } = require('fs')
const { winPath, getFile } = require('../utils')

// 考虑多种情况：
// 可能是目录，没有后缀，比如 [post]/add.tsx
// 可能是文件，有后缀，比如 [id].tsx
// [id$] 是可选动态路由
const RE_DYNAMIC_ROUTE = /^\[(.+?)\]/

/**
 * 获取pages目录下所有符合路由的文件
 * @param {string} root 目录地址，如pages目录
 * @returns 符合注册路由的文件系统
 */
function getFiles (root) {
  if (!existsSync(root)) return [] // 如果此目录不存在，则返回空数组
  return readdirSync(root).filter(file => {
    const absFile = join(root, file)
    const fileStat = statSync(absFile) 
    const isDirectory = fileStat.isDirectory()
    const isFile = fileStat.isFile()

    // components、 component、 utils、 util、 
    if (isDirectory && ['components', 'component', 'utils', 'util'].includes(file)) return false

    /**
     * @XXX 在判断文件或目录是否以 . 或 _ 开头的时候，为啥不用一个if条件判断 （file.charAt(0) === '.' || file.charAt(0) === '_')
     *      是为之后方便扩展???
     */
    // 以 . 开头的文件或目录 
    if (file.charAt(0) === '.') return false
    // 以 _ 开头的文件或目录 
    if (file.charAt(0) === '_') return false

    // 以 test.ts、spec.ts、e2e.ts 结尾的测试文件（适用于 .js、.jsx 和 .tsx 文件）
    if (/\.(test|spec|e2e)\.(j|t)sx?$/.test(file)) return false

    // 以 d.ts 结尾的类型定义文件 
    if (/\.d\.ts$/.test(file)) return false

    // 如果是文件, 要确定文件内容不包含 JSX 元素
    if (isFile) {
      if (!/\.(j|t)sx?$/.test(file)) return false
      try {
        // isReactComponent来自于 @umijs/ast
        // if (!isReactComponent(content)) return false
      } catch (e) {
        throw new Error(
          `Parse conventional route component ${absFile} failed, ${e.message}`,
        )
      }
    }
    return true
  })
}

/**
 * 把路由文件系统转换成路由文件 index.js => { "path": "/",  "exact": true, "component": require('@/pages/index.js').default }
 * @param {object} opts { root, relDir } 文件系统根目录，子目录
 * @param {array} memo 正在累加的路由数组
 * @param {string} file 一个个的文件
 * @returns 生成后的路由配置
 */
 function fileToRouteReducer (opts, memo, file) {
  const { root, relDir = '' } = opts
  const absFile = join(root, relDir, file) // 当前文件的绝对路径 = pages + '' + index.js, add.js的绝对路径 = pages/user/add.js
  const stats = statSync(absFile) // 获取路径文件的信息

  // 约定 [] 包裹的文件或文件夹为动态路由，例：src/pages/list/[id].tsx 会成为 /list/:id
  const __isDynamic = RE_DYNAMIC_ROUTE.test(file)

  // 如果是文件夹，判断文件夹下是否存在_layout文件
  // 若存在，则递归生成子路由
  // 若不存在，则根据文件夹内的文件生成路由
  if (stats.isDirectory()) {
    const relFile = join(relDir, file)

    // UMI约定，_layout.tsx 会生成嵌套路由
    // 以 _layout.tsx 为该目录的layout，layout文件需要返回一个React组件，并通过props.children渲染子组件
    // 例：layoutFile = join(root, relFile, '_layout.js')
    const layoutFile = getFile({
      base: join(root, relFile),
      fileNameWithoutExt: '_layout',
      type: 'javascript'
    })

    const route = {
      path: normalizePath(relFile, opts),
      routes: getRoutes({
        ...opts,
        relDir: relFile
      }),
      __isDynamic,
      ...(layoutFile
        ? { component: layoutFile.path }
        : { exact: true, __toMerge: true } // __toMerge为true, 则 route 配置文件会将这一条合并到上一层
      )
    }

    memo.push(normalizeRoute(route, opts))
  } else { // 如果是文件，则直接生成路由配置
    // 例: profile.js 则 bName 为 profile
    const bName = basename(file, extname(file))
    memo.push(
      normalizeRoute({
        path: normalizePath(join(relDir, bName), opts),
        exact: true,
        component: absFile,
        __isDynamic
      }, opts)
    )
  }

  return memo
}

/**
 * 格式化路由
 * @param {object} route 
 * @param {object} opts [root: 根目录、component：globalLayoutFile.path]
 * @returns 
 */
 function normalizeRoute (route, opts) {
   let props = undefined
   if (route.component) {
    try {
      // 获取参数
      // props = getExportProps(readFileSync(route.component, 'utf-8'))
    } catch (e) {
      throw new Error(
        `Parse conventional route component ${route.component} failed, ${e.message}`,
      )
    }
    route.component = winPath(relative(join(opts.root, '..'), route.component))
    route.component = `${opts.componentPrefix || '@/'}${route.component}`
  }
  return {
    ...route,
    ...(typeof props === 'object' ? props : {})
  }
 }

/**
 * 转换路径
 * @param {string} path 路径 
 * @returns 转换后的路径
 */
function normalizePath (path) {
  path = winPath(path).split('/').map(p => {
    // 动态路由，将 path 中的 RE_DYNAMIC_ROUTE 进行替换，比如 [id] 替换为 :id
    p = p.replace(RE_DYNAMIC_ROUTE, ':$1')
    // 将:post$ 转换为 :post?
    if (p.endsWith('$')) {
      p = p.slice(0, -1) + '?'
    }
    return p
  }).join('/')

  path = `/${path}`

  // 将 /index/index 转换为 /
  if (path === '/index/index') {
    path = '/'
  }

  // 将 xxx/index 转换为 / 
  path = path.replace(/\/index$/, '/')

  // 删除最后一个 / ，例: 将 /abc/ 转换为 /abc
  if (path !== '/' && path.slice(-1) === '/') {
    path = path.slice(0, -1)
  }
  return path
}

/**
 * 对routes做最后的规范化，分为3类，删除 __isDynamic 等不必要的参数
 * @param {array} routes 路由
 * @returns 格式化后的路由表
 */
 function normalizeRoutes (routes) {
  const paramsRoutes = [] // 存在动态参数的路由
  const exactRoutes = []  // 需要完全匹配的路由
  const layoutRoutes = [] // 不需要完全匹配的路由

  routes.forEach(route => {
    /**
     * 动态、精确
     *  分类的原因是排序，route的配置越精确，越往上放，因为配置switch组件，匹配到一个后就不会再进行匹配
     */
    const { __isDynamic, exact } = route
    delete route.__isDynamic
    if (__isDynamic) {
      paramsRoutes.push(route)
    } else if (exact) {
      exactRoutes.push(route)
    } else {
      layoutRoutes.push(route)
    }
  })

  // 一个目录下不可以有多个动态路由
  assert(
    paramsRoutes.length <= 1,
    `We should not have multiple dynamic routes under a directory.`
  )

  return [...exactRoutes, ...layoutRoutes, ...paramsRoutes].reduce((memo, route) => {
    // toMerge 是文件夹进行匹配时候赋值的
    // 由于会根据文件夹内的文件生成路由，所以文件夹生成的路由会比文件深一层
    // 使用 toMerge 标记后，在该函数中会将路由配置上提一层，实现和文件路由配置相同的效果
    if (route.__toMerge && route.routes) {
      memo = memo.concat(route.routes)
    } else {
      memo.push(route)
    }
    return memo
  }, [])
}

/**
 * 扫描pages文件系统，并生成路由
 * @param {} opts root 根目录
 * @param {} opts relDir 子目录
 * @param {} opts config 用户配置
 * @returns 生成后的路由
 */
function getRoutes (opts = {}) {
  const { root, relDir = '', config } = opts
  const files = getFiles(join(root, relDir)) // 获取此目录下的所有文件
  const routes = normalizeRoutes(files.reduce(fileToRouteReducer.bind(null, opts), []))

  if (!relDir) {
    // 约定 src/layouts/index.tsx 为全局路由。返回一个 React 组件，并通过 props.children 渲染子组件
    const globalLayoutFile = getFile({
      base: root,
      fileNameWithoutExt: `../${config.singular ? 'layout' : 'layouts'}/index`,
      type: 'javascript'
    })

    // 如果存在全局路由，则将 globalLayoutFile 放在全局路由的 routes 下
    if (globalLayoutFile) {
      return [
        normalizeRoute(
          {
            path: '/',
            component: globalLayoutFile.path,
            routes,
          },
          opts
        ),
      ]
    }
  }
  return routes
}

module.exports = getRoutes