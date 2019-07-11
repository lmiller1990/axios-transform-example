import Vue from 'vue/dist/vue.esm.js'
import Vuex from 'vuex'
import axios from 'axios'
import camelcaseKeys from 'camelcase-keys'
import snakecaseKeys from 'snakecase-keys'

Vue.use(Vuex)

axios.defaults.transformResponse = [(data, headers) => {
  if (data && headers['content-type'].includes('application/json')) {
    return camelcaseKeys(JSON.parse(data), { deep: true })
  }
}]

axios.defaults.transformRequest = [(data, headers) => {
  if (data && headers['content-type'].includes('application/json')) {
    return JSON.stringify(snakecaseKeys(data, { deep: true }))
  }
}]

document.addEventListener('DOMContentLoaded', () => {
  mount()
})

const store = new Vuex.Store({
  state: {
    users: []
  },

  mutations: {
    SET_USERS(state, payload) {
      state.users = payload
    }
  },

  actions: {
    updateUsers({}, users) {
      return axios.post('https://demo3878003.mockable.io', 
        { users },
        {
          transformRequest: [
            (data) => {
              return JSON.stringify(snakecaseKeys(data, { deep: true }))
            }
          ]
        }
      )
    },

    getUsers({ commit }) {
      return axios.get('https://demo3878003.mockable.io')
        .then(res => {
          commit('SET_USERS', res.data.users)
        })
    }
  }
})

const mount = () => {
  new Vue({
    el: '#app',

    store,

    methods: {
      fetchUsers() {
        this.$store.dispatch('getUsers')
      },

      updateUsers() {
        this.$store.dispatch('updateUsers', this.$store.state.users)
      }
    },

    template: `
      <div>
        <button @click="fetchUsers">
          Fetch Data
        </button>

        <button @click="updateUsers">
          Update Data
        </button>

        <h2>Data</h2>
        {{ $store.state.users }}
      </div>
    `
  })
}
