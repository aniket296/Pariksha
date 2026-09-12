import { vi } from 'vitest'

// Mock 'server-only' so server utilities and grading functions can be tested in Vitest
vi.mock('server-only', () => ({}))
