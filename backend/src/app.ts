import cors from 'cors'
import express from 'express'
import { roomDatabase } from './roomDatabase.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.post('/rooms', (req, res) => {
  const memberCount = Number(req.body?.memberCount)
  if (!Number.isInteger(memberCount) || memberCount < 2 || memberCount > 10) {
    res.status(400).json({ message: '유효한 인원 수(2~10명)를 입력해주세요.' })
    return
  }

  const room = roomDatabase.createRoom(memberCount)
  const origin = req.get('origin') ?? `${req.protocol}://${req.get('host')}`
  res.status(201).json({
    code: room.code,
    memberCount: room.memberCount,
    inviteLink: `${origin}/join/${room.code}?members=${room.memberCount}`,
  })
})

app.get('/rooms/:code', (req, res) => {
  const normalizedCode = req.params.code.trim().toUpperCase()
  const room = roomDatabase.findRoom(normalizedCode)
  if (!room) {
    res.status(404).json({ message: '존재하지 않는 방입니다.' })
    return
  }

  res.status(200).json({
    code: room.code,
    memberCount: room.memberCount,
  })
})
