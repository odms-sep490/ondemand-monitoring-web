import type {
  PostflightItemKey,
  PreflightItemResult,
} from '../../types/mission'

export type PostflightCategoryDef = {
  title: string
  icon: string
  items: {
    key: PostflightItemKey
    label: string
    detail: string
    backendKeys: string[]
  }[]
}

export type ResultsState = Partial<
  Record<PostflightItemKey, PreflightItemResult>
>
