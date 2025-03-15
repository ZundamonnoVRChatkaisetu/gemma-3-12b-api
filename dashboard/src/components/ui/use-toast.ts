// Inspired by react-hot-toast library
import * as React from "react"

import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

/**
 * トースト通知の状態タイプ
 */
const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

/**
 * トースト通知コンテキスト
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

/**
 * トースト通知状態インターフェース
 */
interface State {
  toasts: ToasterToast[]
}

/**
 * トースト通知用のリデューサー
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // トースト通知がすでに削除タイムアウト中であれば、何もしない
      if (toastId && toastTimeouts.has(toastId)) {
        return state
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

/**
 * トースト通知コンテキストの作成
 */
const ToastContext = React.createContext<{
  toasts: ToasterToast[]
  addToast: (props: Omit<ToasterToast, "id">) => void
  updateToast: (props: Partial<ToasterToast> & { id: string }) => void
  dismissToast: (toastId?: string) => void
  removeToast: (toastId?: string) => void
}>({
  toasts: [],
  addToast: () => {},
  updateToast: () => {},
  dismissToast: () => {},
  removeToast: () => {},
})

/**
 * トースト通知プロバイダー
 */
const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] })

  const addToast = React.useCallback(
    (props: Omit<ToasterToast, "id">) => {
      const id = genId()

      const newToast = { id, ...props }
      dispatch({ type: actionTypes.ADD_TOAST, toast: newToast })

      return id
    },
    [dispatch]
  )

  const updateToast = React.useCallback(
    (props: Partial<ToasterToast> & { id: string }) => {
      dispatch({ type: actionTypes.UPDATE_TOAST, toast: props })
    },
    [dispatch]
  )

  const dismissToast = React.useCallback(
    (toastId?: string) => {
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId })

      if (toastId) {
        toastTimeouts.set(
          toastId,
          setTimeout(() => {
            toastTimeouts.delete(toastId)
            dispatch({ type: actionTypes.REMOVE_TOAST, toastId })
          }, TOAST_REMOVE_DELAY)
        )
      }
    },
    [dispatch]
  )

  const removeToast = React.useCallback(
    (toastId?: string) => {
      if (toastId) {
        toastTimeouts.delete(toastId)
      }

      dispatch({ type: actionTypes.REMOVE_TOAST, toastId })
    },
    [dispatch]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts: state.toasts,
        addToast,
        updateToast,
        dismissToast,
        removeToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

/**
 * トースト通知フック
 */
function useToast() {
  const { toasts, addToast, updateToast, dismissToast, removeToast } =
    React.useContext(ToastContext)

  return {
    toasts,
    toast: addToast,
    update: updateToast,
    dismiss: dismissToast,
    remove: removeToast,
  }
}

export { useToast, ToastProvider }
