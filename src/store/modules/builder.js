'use strict'

import SharedService from '@/services/SharedService'
import _ from 'lodash'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const state = {
  // The layout of the builder
  layout: [],
  layoutTemp: [],
  layoutMobile: [],
  // Unkown - may be imporant
  index: 0,
  // Are (all) the grid items resizable
  resizable: true,
  // Are (all) the grid items draggable
  draggable: true,
  //
  colNum: 2,
  //
  rowHeight: 90,

  // Current selected block type
  blockType: null,
  // Current jsonSchema (changes with block type)
  jsonSchema: null,

  // Form's model when adding a block
  addBlockFormData: {},
  addBlockFormMeta: {},

  // Block data defaults
  defaults: {
    x: 0,
    w: 1,
    h: 1,
    colNum: 2,
  },

  // Is the mobile preview active
  mobilePreview: false,

}

const getters = {
  /**
    * Return the max y of the layout
    *
    * @param {*} state
    */
  getMaxY (state) {
    const array = state.layout.map(o => o.y)
    let max

    if (array.length === 0) {
      max = 0
    } else {
      max = Math.max(...array)
      max++
    }

    return max
  },
}

const actions = {

  /**
   * Fetches the layout
   *
   * @param {*} param0
   */
  fetchLayout ({ commit }) {
    // const layout = JSON.parse(localStorage.getItem('layout'))
    // if (layout) {
    //   commit('setLayout', layout)
    // }
  },

  /**
    * Fetches the correct json schema
    * then sets (via mutation) the block type and the json schema
    *
    * @param {*} param0
    * @param {*} event
    */
  async handleBlockTypeChange ({ commit }, event) {
    const selected = event.target.value

    // Api call to get json schema
    try {
      console.log('===> TODO: handleBlockTypeChange', selected)

      // const json = require(`../../api/mock/json-schema-type-${selected}.json`)

      // commit('setJsonSchema', json)
      commit('setBlockType', selected)
    } catch (e) {
      console.log(e)
    }
  },

  /**
    * Gets the last y of the layout
    * Gets a uniq ID for the block
    * Create a block taking the current addBlockFormData
    * Increments the index (mutation)
    * Adds the block to the layout (mutation)
    *
    * @param {*} param0
    * @param {*} blockData
    */
  handleBlockSelectorFormSubmit ({ commit, getters, state }) {
    // Index
    const i = SharedService.generateUniqID()

    // X value
    const x = state.defaults.x

    // It maybe useless to get this
    let y = getters.getMaxY

    // Width
    let w = state.defaults.w

    // Height
    const h = state.defaults.h

    // Data
    const data = SharedService.cloneObject(state.addBlockFormData)

    // Meta
    const meta = SharedService.cloneObject(state.addBlockFormMeta)

    // Block Type
    const blockType = SharedService.cloneObject(state.blockType)

    if (state.addBlockFormMeta.fixed) {
      commit('moveAllBlocksY')

      y = 0
      w = state.colNum
    }

    const block = {
      i,
      x,
      y,
      w,
      h,
      data,
      meta,
      blockType,
    }

    commit('incrementIndex')
    commit('resetAddBlockFormData')
    commit('addBlockToLayout', block)
  },

  /**
   *
   *
   * @param {*} param0
   */
  handleMobilePreviewButtonClick ({ commit, state }) {
    const layout = SharedService.cloneObject(state.layout)

    // Saving layout in temp
    commit('setLayoutTemp', layout)

    // Building mobile layout
    commit('showMobileLayout')
    commit('setMobilePreview', true)

    const layoutMobile = SharedService.cloneObject(state.layout)

    // Saving layout mobile in temp
    commit('setLayoutMobile', layoutMobile)
  },

  handleDoneButtonClick ({ commit, state }) {
    // Saving layout
    localStorage.setItem('layout', JSON.stringify(state.layoutTemp))

    // Saving layout mobile
    localStorage.setItem('layout-mobile', JSON.stringify(state.layoutMobile))

    // Returning to desktop view
    commit('setMobilePreview', false)

    // Setting colNum to default
    commit('setColNum', state.defaults.colNum)

    // Showing desktop layout
    commit('setLayout', state.layoutTemp)

    alert('Layouts saved !')
  },
}

const mutations = {
  //
  // ─── LAYOUT ─────────────────────────────────────────────────────────────────────
  //

  /**
   * Rearrange layout to fit mobile. (1 column)
   *
   * @param {*} state
   */
  showMobileLayout (state) {
    // Clone layout object
    const layout = SharedService.cloneObject(state.layout)

    // Group blocks by y
    const groupedByY = _.groupBy(layout, 'y')

    // Order all groups by x (asc)
    const orderedByYAndX = _.map(groupedByY, (group) => {
      return _.orderBy(group, ['x'], ['asc'])
    })

    // Flatten array
    const flattened = _.flatten(orderedByYAndX)

    // Set colNum to 1
    state.colNum = 1

    // Increment all y
    // All x at 0
    // All w at 1
    flattened.forEach((block, index, array) => {
      array[index].y = index
      array[index].x = 0
      array[index].w = 1
    })

    // Set layout
    state.layout = SharedService.cloneObject(flattened)
  },

  setMobilePreview (state, newValue) {
    state.mobilePreview = newValue
  },

  setLayout (state, newValue) {
    state.layout = newValue
  },

  setLayoutTemp (state, newValue) {
    state.layoutTemp = newValue
  },

  setLayoutMobile (state, newValue) {
    state.layoutMobile = newValue
  },

  incrementIndex (state) {
    state.index++
  },

  setColNum (state, newValue) {
    state.colNum = newValue
  },

  addBlockToLayout (state, block) {
    const layout = SharedService.cloneObject(state.layout)
    layout.push(block)

    state.layout = layout
  },

  removeBlockFromLayout (state, block) {
    const blockID = block.i
    const blockIndex = state.layout.findIndex(o => o.i === blockID)

    const answer = confirm(`Are you sure you want to remove block ${blockID} ?`)
    if (answer) {
      state.layout.splice(blockIndex, 1)
      console.log('removing', blockID, 'at index', blockIndex)
    }
  },

  moveAllBlocksY (state) {
    state.layout.map(o => {
      o.y++
    })
  },

  // ────────────────────────────────────────────────────────────────────────────────
  //
  // ─── BLOCK TYPE FORM ────────────────────────────────────────────────────────────
  //
  setJsonSchema (state, newValue) {
    state.jsonSchema = newValue
  },

  setBlockType (state, newValue) {
    state.blockType = newValue
  },

  setAddBlockFormData (state, newValue) {
    state.addBlockFormData = newValue
  },

  setAddBlockFormMeta (state, newValue) {
    state.addBlockFormMeta = newValue
  },

  resetAddBlockFormData (state) {
    state.blockType = null
    state.addBlockFormData = {}
  },
  // ────────────────────────────────────────────────────────────────────────────────
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
