// 正则匹配，然后JSON.stringify()
function routesToJSON ({ routes, config, cwd }) {
  // 因为要往 routes 里加无用的信息，所以必须 deep clone 一下，避免污染
  // const clonedRoutes = lodash.cloneDeep(routes)
  // const clonedRoutes = JSON.parse(JSON.stringify(routes))

  // if (config.dynamicImport) {
  //   patchRoutes(clonedRoutes)
  // }

  // function patchRoutes(routes) {
  //   routes.forEach(patchRoute)
  // }

  // function patchRoute(route) {
  //   if (route.component && !isFunctionComponent(route.component)) {
  //     const webpackChunkName = routeToChunkName({
  //       route,
  //       cwd,
  //     })
  //     // 解决 SSR 开启动态加载后，页面闪烁问题
  //     if (config?.ssr && config?.dynamicImport) {
  //       route._chunkName = webpackChunkName
  //     }
  //     route.component = [
  //       route.component,
  //       webpackChunkName,
  //       route.path || EMPTY_PATH,
  //     ].join(SEPARATOR)
  //   }
  //   if (route.routes) {
  //     patchRoutes(route.routes)
  //   }
  // }

  // function isFunctionComponent(component) {
  //   return (
  //     /^\((.+)?\)(\s+)?=>/.test(component) ||
  //     /^function([^\(]+)?\(([^\)]+)?\)([^{]+)?{/.test(component)
  //   )
  // }

  // function replacer(key, value) {
  //   switch (key) {
  //     case 'component':
  //       if (isFunctionComponent(value)) return value
  //       if (config.dynamicImport) {
  //         const [component, webpackChunkName] = value.split(SEPARATOR)
  //         let loading = ''
  //         if (config.dynamicImport.loading) {
  //           loading = `, loading: LoadingComponent`
  //         }
  //         return `dynamic({ loader: () => import(/* webpackChunkName: '${webpackChunkName}' */'${component}')${loading}})`
  //       } else {
  //         return `require('${value}').default`
  //       }
  //     case 'wrappers':
  //       const wrappers = value.map((wrapper) => {
  //         if (config.dynamicImport) {
  //           let loading = ''
  //           if (config.dynamicImport.loading) {
  //             loading = `, loading: LoadingComponent`
  //           }
  //           return `dynamic({ loader: () => import(/* webpackChunkName: 'wrappers' */'${wrapper}')${loading}})`
  //         } else {
  //           return `require('${wrapper}').default`
  //         }
  //       })
  //       return `[${wrappers.join(', ')}]`
  //     default:
  //       return value
  //   }
  // }

  // return JSON.stringify(clonedRoutes, replacer, 2)
  //   .replace(/\"component\": (\"(.+?)\")/g, (global, m1, m2) => {
  //     return `"component": ${m2.replace(/\^/g, '"')}`
  //   })
  //   .replace(/\"wrappers\": (\"(.+?)\")/g, (global, m1, m2) => {
  //     return `"wrappers": ${m2.replace(/\^/g, '"')}`
  //   })
  //   .replace(/\\r\\n/g, '\r\n')
  //   .replace(/\\n/g, '\r\n')

  function replacer (key, value) {
    switch (key) {
      case "component":
        return `require('${value}').default`
      default:
        return value
    }
  }

  return JSON.stringify(routes, replacer, 2).replace(/\"component\": (\"(.+?)\")/g, (global, m1, m2) => {
    return `"component": ${m2.replace(/\^/g, '"')}`
  })
}

module.exports = routesToJSON