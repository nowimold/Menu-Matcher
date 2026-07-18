export type RoomRecord = {
  code: string
  memberCount: number
  createdAt: string
}

const CODE_LENGTH = 6
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

class RoomDatabase {
  private readonly rooms = new Map<string, RoomRecord>()

  createRoom(memberCount: number): RoomRecord {
    let code = this.generateCode()
    while (this.rooms.has(code)) {
      code = this.generateCode()
    }

    const room: RoomRecord = {
      code,
      memberCount,
      createdAt: new Date().toISOString(),
    }
    this.rooms.set(code, room)
    return room
  }

  findRoom(code: string): RoomRecord | null {
    return this.rooms.get(code.trim().toUpperCase()) ?? null
  }

  // 테스트에서만 사용
  clear() {
    this.rooms.clear()
  }

  private generateCode(): string {
    let code = ''
    for (let index = 0; index < CODE_LENGTH; index += 1) {
      const randomIndex = Math.floor(Math.random() * CODE_CHARS.length)
      code += CODE_CHARS[randomIndex]
    }
    return code
  }
}

export const roomDatabase = new RoomDatabase()
