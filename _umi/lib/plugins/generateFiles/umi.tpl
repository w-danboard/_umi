// UmiJS运行时
import React from 'react'
import ReactDOM from 'react-dom'
// 新版本 Switch 重命名为 Routes
import { Router, Route, Switch } from 'react-router-dom'
import history from './core/history'
import { getRoutes } from  './core/routes'
import plugin from  './core/plugin'
// import { renderRoutes } from 'react-router-config'

let routes = getRoutes()
ReactDOM.render(
  <Router history={history}>
    {renderRoutes(routes)}
    {/* <Route path="/" component={routes[1].component}></Route> */}
  </Router>, document.getElementById('root')
)

function renderRoutes (routes) {
  return routes.map(({ path, exact, component: RouteComponent, routes: childrenRoutes = [] }) => {
    // routeProps {match路径匹配的结果 history历史对象 location当前的路径}
    // 如果地址中的路径和Route里的path匹配的话，就执行render并渲染其返回值
    return (
      // 路由组件，渲染Route有三种方式 component render children
      <Route
        key={path}
        path={path}
        exact={exact}
        render={
          routeProps => (
            <RouteComponent {...routeProps}>
              {/* 新版版 Switch 重命名为 Routes */}
              <Switch>
                {renderRoutes(childrenRoutes)}
              </Switch>
            </RouteComponent>
          )
        }
      />
    )
  })
}