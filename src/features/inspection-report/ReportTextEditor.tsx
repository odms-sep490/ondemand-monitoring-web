import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import { Button, Space } from 'antd'
import { useEffect } from 'react'
import type { JSONContent } from '@tiptap/core'

// The supported hook API keeps each independent section editor isolated.
export function ReportTextEditor({
  content,
  richText,
  editable,
  onChange,
}: {
  content: string
  richText?: JSONContent | null
  editable: boolean
  onChange: (text: string, richText: JSONContent) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        codeBlock: false,
        dropcursor: false,
      }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: richText ?? {
      type: 'doc',
      content: content.split('\n').map((text) => ({
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : [],
      })),
    },
    editable,
    onUpdate: ({ editor: current }) =>
      onChange(current.getText({ blockSeparator: '\n' }), current.getJSON()),
    editorProps: {
      attributes: {
        'aria-label': 'Nội dung phần báo cáo',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
  })
  useEffect(() => {
    if (editor && editor.getText({ blockSeparator: '\n' }) !== content)
      editor.commands.setContent(
        richText ?? {
          type: 'doc',
          content: content.split('\n').map((text) => ({
            type: 'paragraph',
            content: text ? [{ type: 'text', text }] : [],
          })),
        },
        { emitUpdate: false },
      )
  }, [editor, content, richText])
  useEffect(() => {
    editor?.setEditable(editable, false)
  }, [editor, editable])
  return (
    <div className="ir-rich-editor">
      {editable && (
        <Space wrap className="ir-editor-toolbar">
          <Button
            size="small"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            aria-label="In đậm"
          >
            Đậm
          </Button>
          <Button
            size="small"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            aria-label="In nghiêng"
          >
            Nghiêng
          </Button>
          <Button
            size="small"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            Tiêu đề
          </Button>
          <Button
            size="small"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            Danh sách
          </Button>
          <Button
            size="small"
            onClick={() =>
              editor
                ?.chain()
                .focus()
                .insertTable({ rows: 3, cols: 2, withHeaderRow: true })
                .run()
            }
          >
            Thêm bảng
          </Button>
          {editor?.isActive('table') && (
            <>
              <Button
                size="small"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                Thêm dòng
              </Button>
              <Button
                size="small"
                danger
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                Bỏ bảng
              </Button>
            </>
          )}
          <Button
            size="small"
            onClick={() => editor?.chain().focus().undo().run()}
          >
            Hoàn tác
          </Button>
          <Button
            size="small"
            onClick={() => editor?.chain().focus().redo().run()}
          >
            Làm lại
          </Button>
        </Space>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
