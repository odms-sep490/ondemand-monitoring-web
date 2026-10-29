import { Tag } from 'antd'
import { useI18n } from '../../../../../shared/i18n'
import { getPopularTopics } from '../../../data/helpArticles'
import { helpCenterHomeMessages } from '../HelpCenterHomePage.messages'

type Props = {
  selected: string
  onSelect: (topicId: string) => void
}

export function TopicGrid({ selected, onSelect }: Props) {
  const { t, lang } = useI18n(helpCenterHomeMessages)
  return (
    <section>
      <h2 className="hc-section-title">{t.topicsTitle}</h2>
      <div className="hc-topics">
        {getPopularTopics(lang).map((topic) => {
          const isSelected = selected === topic.id
          return (
            <button
              key={topic.id}
              type="button"
              className={`hc-topic${isSelected ? ' is-selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? 'ALL' : topic.id)}
            >
              <div className="hc-topic-head">
                <span className="hc-topic-name">{topic.title}</span>
                <Tag className="hc-topic-count">{t.articleCount(topic.articleCount)}</Tag>
              </div>
              <p className="hc-topic-desc">{topic.description}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
