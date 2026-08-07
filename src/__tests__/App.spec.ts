import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts renders properly', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          UApp: { template: '<div><slot /></div>' },
          RouterView: true,
          // Real nuxt/ui inputs are flaky in jsdom (oracle review note) — stub the panel.
          ResumeFormPanel: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })
})
