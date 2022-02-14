/**
 * 源码位置：umi/packages/core/src/Route/Route.ts
 */
const assert = require('assert')
const path = require('path')
const { winPath } = require('../utils')
const getConventionalRoutes = require('./getConventionalRoutes')
const routesToJSON = require('./routesToJSON')


class Route {
  constructor (opts) {
    this.opts = opts || {}
  }

  /**
   * 
   * @param {object} opts config 用户 + 插件配置 | root 是 absPagesPath | componentPrefix是路径的分割符号，默认是 '/'
   * @returns 
   */
  async getRoutes(opts) {
    const { config = {}, root, componentPrefix = '@/' } = opts
  
    // 避免修改配置里的 routes，导致重复 patch
    let routes = false // lodash.cloneDeep(config.routes)
    let isConventional = false // 是否约定式路由
  
    // 如果用户没有自定义，则使用约定式路由；如果配置了则约定式路由无效。 @FIXME 为使用约定式路由，true为手动添加
    if (!routes) {
      assert(root, `opts.root must be supplied for conventional routes.`)

      // 默认路由的拼接方式
      routes = this.getConventionRoutes({
        root: root,
        config,
        componentPrefix
      })
      isConventional = true
    }
  
    // 生成的路由可以被插件新增，修改，删除
    // await this.patchRoutes(routes, {
    //   ...opts,
    //   isConventional
    // })
    return routes
  }
  
  // TODO:
  // 1. 移动 /404 到最后，并处理 component 和 redirect
  async patchRoutes(routes, opts) {
    // 执行插件的 onPatchRoutesBefore 钩子函数对路由修改
    if (this.opts.onPatchRoutesBefore) {
      await this.opts.onPatchRoutesBefore({
        routes,
        parentRoute: opts.parentRoute
    })
  }

  // routes中的route执行patrchRoute方法
    for (const route of routes) {
      await this.patchRoute(route, opts)
    }

  // onPatchRoutes进行最终的路由修改
    if (this.opts.onPatchRoutes) {
      await this.opts.onPatchRoutes({
        routes,
        parentRoute: opts.parentRoute,
      })
    }
  }
  
  async patchRoute(route, opts) {
    if (this.opts.onPatchRouteBefore) {
      await this.opts.onPatchRouteBefore({
        route,
        parentRoute: opts.parentRoute
      })
    }

    // route.path 的修改需要在子路由 patch 之前做
    if (
      route.path &&
      route.path.charAt(0) !== '/' &&
      !/^https?:\/\//.test(route.path)
    ) {
      route.path = winPath(path.join(opts.parentRoute?.path || '/', route.path))
    }
    if (route.redirect && route.redirect.charAt(0) !== '/') {
      route.redirect = winPath(
        path.join(opts.parentRoute?.path || '/', route.redirect)
      )
    }

    // 递归 patchRoutes
    if (route.routes) {
      await this.patchRoutes(route.routes, {
        ...opts,
        parentRoute: route,
      })
    } else {
      if (!('exact' in route)) {
        // exact by default
        route.exact = true
      }
    }

    // resolve component path
    if (
      route.component &&
      !opts.isConventional &&
      typeof route.component === 'string' &&
      !route.component.startsWith('@/') &&
      !path.isAbsolute(route.component)
    ) {
      route.component = winPath(path.join(opts.root, route.component))
    }

    // resolve wrappers path
    if (route.wrappers) {
      route.wrappers = route.wrappers.map((wrapper) => {
        if (wrapper.startsWith('@/') || path.isAbsolute(wrapper)) {
          return wrapper
        } else {
          return winPath(path.join(opts.root, wrapper))
        }
      })
    }

    // onPatchRoute 钩子函数
    if (this.opts.onPatchRoute) {
      await this.opts.onPatchRoute({
        route,
        parentRoute: opts.parentRoute
      })
    }
  }
  
  // 约定式路由
  getConventionRoutes(opts) {
    return getConventionalRoutes(opts)
  }
  
  getJSON(opts) {
    return routesToJSON(opts)
  }
  
  getPaths({ routes }) {
    return lodash.uniq(
      routes.reduce((memo, route) => {
        if (route.path) memo.push(route.path)
        if (route.routes)
          memo = memo.concat(this.getPaths({ routes: route.routes }))
        return memo
      }, [])
    )
  }
}

module.exports = Route