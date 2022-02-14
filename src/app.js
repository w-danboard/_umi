export function patchRoutes({ routes }) {
  routes.unshift({
    path: '/other',
    exact: true,
    component: require('@/other').default
  })
}