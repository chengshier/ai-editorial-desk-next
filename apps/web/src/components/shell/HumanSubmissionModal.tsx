import { Lightbulb, Link2, Send, X } from 'lucide-react'
import { useState } from 'react'

export function HumanSubmissionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState('')
  if (!open) return null

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section
      className="submission-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="submission-modal__header">
        <div><div className="eyebrow">Human Submission</div><h2 id="submission-title">交给编辑部</h2></div>
        <button className="icon-button" type="button" aria-label="关闭" onClick={onClose}><X size={18}/></button>
      </div>
      <p className="submission-modal__hint">刚看到什么值得我们看一下？可以粘贴链接、文字、问题、想法或观察。</p>
      <textarea
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="粘贴链接、文字、问题、想法……"
        rows={7}
      />
      <div className="submission-modal__chips">
        <span><Link2 size={14}/>URL</span><span><Lightbulb size={14}/>Text / Question / Idea</span>
      </div>
      <div className="submission-modal__footer">
        <p>S5 接入 HumanSubmission API 后才会真正提交；当前入口不会伪造成功状态。</p>
        <button type="button" className="primary-button" disabled={!value.trim()} title="S5 接入后开放提交">
          <Send size={15}/>S5 接入后提交
        </button>
      </div>
    </section>
  </div>
}
