import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Profile from '../views/Profile.vue'
import MyBenefits from '../views/MyBenefits.vue'
import Settings from '../views/Settings.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import BenefitDetails from '../views/BenefitDetails.vue'
import Search from '../views/Search.vue'
import Favorites from '../views/Favorites.vue'
import Notifications from '../views/Notifications.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/my-benefits', name: 'MyBenefits', component: MyBenefits },
  { path: '/benefits/:id', name: 'BenefitDetails', component: BenefitDetails },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: Favorites
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: Notifications
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
