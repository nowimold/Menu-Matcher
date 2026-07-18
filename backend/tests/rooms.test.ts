import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { roomDatabase } from '../src/roomDatabase.js'

describe('room routes', () => {
  beforeEach(() => {
    roomDatabase.clear()
  })

  it('creates a room with unique code and invite link', async () => {
    const response = await request(app).post('/rooms').send({ memberCount: 4 })

    expect(response.status).toBe(201)
    expect(response.body.code).toMatch(/^[A-Z0-9]{6}$/)
    expect(response.body.memberCount).toBe(4)
    expect(response.body.inviteLink).toContain(`/join/${response.body.code}`)
  })

  it('returns room when room code exists', async () => {
    const created = await request(app).post('/rooms').send({ memberCount: 3 })
    const response = await request(app).get(`/rooms/${created.body.code}`)

    expect(response.status).toBe(200)
    expect(response.body.code).toBe(created.body.code)
    expect(response.body.memberCount).toBe(3)
  })

  it('returns not found when room code does not exist', async () => {
    const response = await request(app).get('/rooms/XXXXXX')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: '존재하지 않는 방입니다.' })
  })
})
