import { useState } from 'react'

type Screen =
  | 'home'
  | 'createSetup'
  | 'joinCodeEntry'
  | 'generated'
  | 'hostPreferences'
  | 'menuCompleted'
type MenuEntryRole = 'host' | 'participant'
type MenuInputs = {
  preferred: string[]
  disliked: string[]
}

const createEmptyMenuInputs = (): MenuInputs => ({
  preferred: ['', '', ''],
  disliked: ['', '', ''],
})

function App() {
  const readInviteCodeFromPath = () => {
    if (typeof window === 'undefined') {
      return ''
    }

    const matched = window.location.pathname.match(/^\/join\/([^/]+)/i)
    return matched?.[1]?.toUpperCase() ?? ''
  }

  const readStoredInviteCode = () => {
    if (typeof window === 'undefined') {
      return ''
    }

    return localStorage.getItem('menu-matcher-invite-code')?.toUpperCase() ?? ''
  }

  const [screen, setScreen] = useState<Screen>('home')
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [generatedLink, setGeneratedLink] = useState('')
  const [inviteCode, setInviteCode] = useState(
    () => readInviteCodeFromPath() || readStoredInviteCode(),
  )
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinErrorMessage, setJoinErrorMessage] = useState('')
  const [menuEntryRole, setMenuEntryRole] = useState<MenuEntryRole>('host')
  const [hostMenuInputs, setHostMenuInputs] = useState<MenuInputs>(() =>
    createEmptyMenuInputs(),
  )
  const [participantMenuInputs, setParticipantMenuInputs] = useState<MenuInputs>(() =>
    createEmptyMenuInputs(),
  )

  const memberOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10]
  const cardClassName =
    'group w-full rounded-3xl border border-slate-200 bg-white/85 p-8 text-left shadow-xl shadow-slate-400/20 backdrop-blur-[20px] transition duration-200 hover:scale-[0.99] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300'
  const actionButtonClassName =
    'rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-400'

  const generateInviteLink = (code: string, peopleCount: number) => {
    return `${window.location.origin}/join/${code}?members=${peopleCount}`
  }

  const handleCreateComplete = () => {
    if (!memberCount) {
      setFeedbackMessage('인원을 먼저 선택해주세요.')
      return
    }

    const generatedCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    const inviteLink = generateInviteLink(generatedCode, memberCount)
    setInviteCode(generatedCode)
    setGeneratedLink(inviteLink)
    setFeedbackMessage('')
    setJoinErrorMessage('')
    setHostMenuInputs(createEmptyMenuInputs())
    setParticipantMenuInputs(createEmptyMenuInputs())

    if (typeof window !== 'undefined') {
      localStorage.setItem('menu-matcher-invite-code', generatedCode)
      localStorage.setItem('menu-matcher-invite-link', inviteLink)
    }

    setScreen('generated')
  }

  const handleCopyLink = async () => {
    if (!generatedLink) {
      setFeedbackMessage('복사할 링크가 없습니다.')
      return
    }

    await navigator.clipboard.writeText(generatedLink)
    setFeedbackMessage('링크가 복사되었습니다.')
  }

  const handleCopyCode = async () => {
    if (!inviteCode) {
      setFeedbackMessage('복사할 코드가 없습니다.')
      return
    }

    await navigator.clipboard.writeText(inviteCode)
    setFeedbackMessage('코드가 복사되었습니다.')
  }

  const handleShareLink = async () => {
    if (!generatedLink) {
      setFeedbackMessage('공유할 링크가 없습니다.')
      return
    }

    if (!navigator.share) {
      setFeedbackMessage('이 기기에서는 공유 기능을 사용할 수 없습니다.')
      return
    }

    await navigator.share({
      title: 'Menu Matcher 참여 링크',
      text: '아래 링크로 모임에 참여해 주세요.',
      url: generatedLink,
    })
    setFeedbackMessage('공유 창을 열었습니다.')
  }

  const handleJoinByCode = () => {
    const normalizedInput = joinCode.trim().toUpperCase()
    if (!normalizedInput) {
      setJoinErrorMessage('참여 코드를 입력해주세요.')
      return
    }

    setInviteCode(normalizedInput)
    if (typeof window !== 'undefined') {
      localStorage.setItem('menu-matcher-invite-code', normalizedInput)
    }
    setJoinErrorMessage('')
    setMenuEntryRole('participant')
    setScreen('hostPreferences')
  }

  const updatePreferredMenu = (index: number, value: string) => {
    if (menuEntryRole === 'host') {
      setHostMenuInputs((prev) => {
        const next = [...prev.preferred]
        next[index] = value
        return { ...prev, preferred: next }
      })
      return
    }

    setParticipantMenuInputs((prev) => {
      const next = [...prev.preferred]
      next[index] = value
      return { ...prev, preferred: next }
    })
  }

  const updateDislikedMenu = (index: number, value: string) => {
    if (menuEntryRole === 'host') {
      setHostMenuInputs((prev) => {
        const next = [...prev.disliked]
        next[index] = value
        return { ...prev, disliked: next }
      })
      return
    }

    setParticipantMenuInputs((prev) => {
      const next = [...prev.disliked]
      next[index] = value
      return { ...prev, disliked: next }
    })
  }

  const addPreferredMenu = () => {
    if (menuEntryRole === 'host') {
      setHostMenuInputs((prev) => ({ ...prev, preferred: [...prev.preferred, ''] }))
      return
    }

    setParticipantMenuInputs((prev) => ({
      ...prev,
      preferred: [...prev.preferred, ''],
    }))
  }

  const removePreferredMenu = () => {
    const targetMenus =
      menuEntryRole === 'host' ? hostMenuInputs.preferred : participantMenuInputs.preferred
    if (targetMenus.length <= 1) {
      return
    }

    if (menuEntryRole === 'host') {
      setHostMenuInputs((prev) => ({ ...prev, preferred: prev.preferred.slice(0, -1) }))
      return
    }

    setParticipantMenuInputs((prev) => ({
      ...prev,
      preferred: prev.preferred.slice(0, -1),
    }))
  }

  const addDislikedMenu = () => {
    if (menuEntryRole === 'host') {
      setHostMenuInputs((prev) => ({ ...prev, disliked: [...prev.disliked, ''] }))
      return
    }

    setParticipantMenuInputs((prev) => ({
      ...prev,
      disliked: [...prev.disliked, ''],
    }))
  }

  const removeDislikedMenu = () => {
    const targetMenus =
      menuEntryRole === 'host' ? hostMenuInputs.disliked : participantMenuInputs.disliked
    if (targetMenus.length <= 1) {
      return
    }

    if (menuEntryRole === 'host') {
      setHostMenuInputs((prev) => ({ ...prev, disliked: prev.disliked.slice(0, -1) }))
      return
    }

    setParticipantMenuInputs((prev) => ({
      ...prev,
      disliked: prev.disliked.slice(0, -1),
    }))
  }

  const activeMenuInputs = menuEntryRole === 'host' ? hostMenuInputs : participantMenuInputs
  const preferredMenus = activeMenuInputs.preferred
  const dislikedMenus = activeMenuInputs.disliked

  const hasFilledAllMenus = (inputs: MenuInputs) =>
    [...inputs.preferred, ...inputs.disliked].every((menu) => menu.trim() !== '')

  const isHostCompleted = hasFilledAllMenus(hostMenuInputs)
  const isParticipantCompleted = hasFilledAllMenus(participantMenuInputs)
  const canMoveToNextInMenuEntry =
    menuEntryRole === 'host' ? isHostCompleted : isHostCompleted && isParticipantCompleted

  const handleMenuNext = () => {
    if (!canMoveToNextInMenuEntry) {
      return
    }

    if (menuEntryRole === 'host') {
      setMenuEntryRole('participant')
      return
    }

    setScreen('menuCompleted')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F5F7] text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(168,209,255,0.42),_rgba(255,208,230,0.3),_rgba(245,245,247,0))] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(182,242,215,0.4),_rgba(187,210,255,0.28),_rgba(245,245,247,0))] blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        {screen === 'home' ? (
          <div className="flex w-full flex-col gap-5">
            <button
              type="button"
              onClick={() => setScreen('createSetup')}
              className={cardClassName}
            >
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
              <p className="text-3xl font-bold tracking-tight">코드 만들기</p>
              <p className="mt-2 text-sm text-slate-500">
                새로운 모임을 시작하고 링크를 공유하세요
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScreen('joinCodeEntry')}
              className={cardClassName}
            >
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <rect x="4" y="4" width="6" height="6" rx="1.2" />
                  <rect x="14" y="4" width="6" height="6" rx="1.2" />
                  <rect x="4" y="14" width="6" height="6" rx="1.2" />
                  <path d="M15 17h5" />
                  <path d="M17.5 14.5v5" />
                </svg>
              </span>
              <p className="text-3xl font-bold tracking-tight">코드 입력하기</p>
              <p className="mt-2 text-sm text-slate-500">
                공유받은 참여 코드를 입력하세요
              </p>
            </button>
          </div>
        ) : null}

        {screen === 'createSetup' ? (
          <section className="w-full rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/25 backdrop-blur-[20px]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">인원 선택 (2~10명)</h2>
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
              >
                이전
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {memberOptions.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMemberCount(count)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition hover:scale-[0.99] active:scale-[0.97] ${
                    memberCount === count
                      ? 'border-slate-400 bg-slate-100 text-slate-900'
                      : 'border-slate-300 bg-white/70 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {count}명
                </button>
              ))}
            </div>

            <p className="mt-4 text-sm text-slate-500">
              {memberCount
                ? `선택된 인원: ${memberCount}명`
                : '참여 인원을 선택해주세요.'}
            </p>

            <button
              type="button"
              onClick={handleCreateComplete}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:scale-[0.99] active:scale-[0.97] ${
                memberCount
                  ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M5 12l4 4 10-10" />
              </svg>
              완료
            </button>
          </section>
        ) : null}

        {screen === 'joinCodeEntry' ? (
          <section className="w-full rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-300/25 backdrop-blur-[20px] sm:p-8">
            <p className="text-2xl font-bold tracking-tight">참여 코드 입력</p>
            <p className="mt-2 text-sm text-slate-500">
              공유받은 코드를 입력하고 모임에 참여하세요.
            </p>

            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="예: ABC123"
              className="mt-5 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold tracking-wider text-slate-800 outline-none transition focus:border-slate-500"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-400 shadow-sm transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-300 hover:text-slate-600"
              >
                처음으로
              </button>
              <button
                type="button"
                onClick={handleJoinByCode}
                className={actionButtonClassName}
              >
                참여하기
              </button>
            </div>

            {joinErrorMessage ? (
              <p className="mt-3 text-sm text-rose-500">{joinErrorMessage}</p>
            ) : null}
          </section>
        ) : null}

        {screen === 'generated' ? (
          <section className="w-full rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-300/25 backdrop-blur-[20px] sm:p-8">
            <p className="text-2xl font-bold tracking-tight">링크 생성 완료</p>
            <p className="mt-2 text-sm text-slate-500">
              선택 인원: {memberCount}명
            </p>

            <div className="mt-5 flex items-center gap-2">
              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 break-all">
                {generatedLink}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-base transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-400"
                aria-label="링크 복사"
              >
                📋
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                참여 코드: <span className="font-bold tracking-wider">{inviteCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-base transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-400"
                aria-label="코드 복사"
              >
                📋
              </button>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleShareLink}
                className="w-full rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-400"
              >
                공유
              </button>
            </div>

            <button
              type="button"
              onClick={() => setScreen('createSetup')}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-400 transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-300 hover:text-slate-600"
            >
              이전
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuEntryRole('host')
                setScreen('hostPreferences')
              }}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-400"
            >
              다음
            </button>

            {feedbackMessage ? (
              <p className="mt-3 text-sm text-slate-500">{feedbackMessage}</p>
            ) : null}
          </section>
        ) : null}

        {screen === 'hostPreferences' ? (
          <section className="w-full rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-300/25 backdrop-blur-[20px] sm:p-8">
            <p className="text-2xl font-bold tracking-tight">
              {menuEntryRole === 'host' ? '호스트 메뉴 선택' : '참여자 메뉴 선택'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              선호 메뉴와 싫어 메뉴의 모든 칸을 입력하면 다음으로 넘어갈 수 있어요.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">선호하는 메뉴</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addPreferredMenu}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-400"
                    >
                      + 추가
                    </button>
                    <button
                      type="button"
                      onClick={removePreferredMenu}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold transition hover:scale-[0.99] active:scale-[0.97] ${
                        preferredMenus.length > 1
                          ? 'border-slate-300 text-slate-700 hover:border-slate-400'
                          : 'cursor-not-allowed border-slate-200 text-slate-300'
                      }`}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {preferredMenus.map((value, index) => (
                    <input
                      key={`preferred-${index}`}
                      value={value}
                      onChange={(event) =>
                        updatePreferredMenu(index, event.target.value)
                      }
                      placeholder={`${index + 1}순위 선호 메뉴`}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-500"
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">싫어하는 메뉴</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addDislikedMenu}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-400"
                    >
                      + 추가
                    </button>
                    <button
                      type="button"
                      onClick={removeDislikedMenu}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold transition hover:scale-[0.99] active:scale-[0.97] ${
                        dislikedMenus.length > 1
                          ? 'border-slate-300 text-slate-700 hover:border-slate-400'
                          : 'cursor-not-allowed border-slate-200 text-slate-300'
                      }`}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {dislikedMenus.map((value, index) => (
                    <input
                      key={`dislike-${index}`}
                      value={value}
                      onChange={(event) => updateDislikedMenu(index, event.target.value)}
                      placeholder={`${index + 1}순위 싫어하는 메뉴`}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-500"
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScreen('generated')}
              className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-400 transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-300 hover:text-slate-600"
            >
              이전
            </button>

            <button
              type="button"
              onClick={handleMenuNext}
              disabled={!canMoveToNextInMenuEntry}
              className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                canMoveToNextInMenuEntry
                  ? 'border-slate-300 bg-white/85 text-slate-700 hover:scale-[0.99] active:scale-[0.97] hover:border-slate-400'
                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              다음
            </button>
          </section>
        ) : null}

        {screen === 'menuCompleted' ? (
          <section className="w-full rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-300/25 backdrop-blur-[20px] sm:p-8">
            <p className="text-2xl font-bold tracking-tight">음식 입력 완료</p>
            <p className="mt-2 text-sm text-slate-500">
              호스트와 참여자 모두 음식 입력을 마쳤어요.
            </p>
            <button
              type="button"
              onClick={() => setScreen('home')}
              className="mt-4 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:scale-[0.99] active:scale-[0.97] hover:border-slate-400"
            >
              처음으로
            </button>
          </section>
        ) : null}
      </div>
    </main>
  )
}

export default App
