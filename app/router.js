// app/router.js

import ItemManagement from './item-management/page'
import Home from './page'

const routes = [
  { path: '/', component: Home },
  { path: '/ItemManagement', component: ItemManagement },
]

export default routes
