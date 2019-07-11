## Consistency in your Vue/Vuex app with Axios's `transformRequest` and `transformResponse`

Over the last few years, I've worked on countless Vue and React apps that are backed by APIs built using languges like Python, Ruby and Perl. By convention, many backend languages use `snake case` for variables and functions. This often means that I see Vuex stores that look like this:

```js
const state = {
  registered_users: [
    {
      id: 1,
      first_name: "Alice"
    }
  ],
  selectedUserId: 1
}
```

A mix of snake case for data defined on the server, and camel case for data defined in the frontend. While there is nothing wrong with this, strictly speaking, it's easy to transform the response if you are using axios, which is by far the http client I encounter most frequently. By doing so, your codebase can follow the JavaScript convention of camel case. In this post I will show how to do so, using axios's `transformRequest` and `transformResponse` functions. In this example, I will be converting between snake case and camel case, however the concept is applicable to other conventions.

## The App

First, a super simple Vue/Vuex app that has two actions, `getUsers` and `updateUsers`. It's all in one file, for brevity.

```
import Vue from 'vue/dist/vue.esm.js'
import Vuex from 'vuex'
import axios from 'axios'
import camelcaseKeys from 'camelcase-keys'

Vue.use(Vuex)

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
      return axios.post('https://demo3878003.mockable.io', { users })
    },

    getUsers({ commit }) {
      return axios.get('https://demo3878003.mockable.io', {
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
```

This is compiled with webpack `index.html` simply has a `<script>` tag loading the bundle, and a `<div id="app">/div>`.

## Transforming the Request with `transformRequest`

I have a server that returns a response in this shape:

```js
{
  "users": [
    {  
      "first_name": "Alice" 
    }
  ]
}
```

Currently the app and output are as follows:

[ss_1.png]

I want to transform all the keys (in this case `first_name`) to be camel case. I can use the `camelcase-keys` package from npm, combined with `transformResponse`. The updated action looks like this:

```js
getUsers({ commit }) {
  return axios.get('https://demo3878003.mockable.io', {
    transformResponse: [
      (data) => {
        return camelcaseKeys(JSON.parse(data), { deep: true })
      }
    ]
  })
    .then(res => {
      commit('SET_USERS', res.data.users)
    })
}
```

Sinc `data` is a stringify JSON object, we need to use `JSON.parse` before calling `camelcaseKeys`. Now the output is as follows:

[ss_2.png]

Since we used the `{ deep: true }` option, any nested objects will also have their keys transformed.

## Transforming the Response with `transformResponse`

When we call `updateUsers`, we want to transform the response back to snake case, for the server to interpret the data correctly. This is much the same as the previous operation. The new `updateUsers` action looks like this:

```js
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
}
```

Since the request is already a valid JSON object, we do not call `JSON.parse`. Rather, we need to `JSON.stringify` it, since the body of a POST request must be a string. Clicking Update Data and inspecting the network tab shows the response payload was converted back to snake case:

[ss_3.png]

## Globally Configuring Axios

If you want to apply the transforms to all requests and responses, you can do it globally like so:

```js
axios.defaults.transformResponse = [(data, headers) => {
  console.log(data, headers['content-type'])
  if (data && headers['content-type'].includes('application/json')) {
    return camelcaseKeys(JSON.parse(data), { deep: true })
  }
}]

axios.defaults.transformRequest = [(data, headers) => {
  if (data && headers['content-type'].includes('application/json')) {
    return JSON.stringify(snakecaseKeys(data, { deep: true }))
  }
}]
```

This will allow you to code application entirely using the usual JavaScript convention of camel case, and the server side code can continue to operate in snake case.

The source code for the article can be found [here]().
