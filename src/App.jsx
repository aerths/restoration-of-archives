import { useEffect, useState } from 'react';
import documents from './data/documents.js';

function DocumentCard({ document, choice, onChoose, onOpen }) {
  return (
    <article className="document-card">
      <button className="document-preview" onClick={onOpen} aria-label={`Подробнее: ${document.title}`}>
        <img className={document.condition === 'ветхое' ? 'aged-image' : ''} src={document.img} alt={`Изображение документа «${document.title}»`} />
        {choice && <span className={`choice-badge ${choice === 'restore' ? 'badge-restore' : 'badge-keep'}`}>
          {choice === 'restore' ? 'На реставрацию' : 'Оставить'}
        </span>}
        <span className="zoom-hint">Нажмите, чтобы рассмотреть</span>
      </button>
      <h2>{document.title}</h2>
      <div className="card-actions" aria-label={`Выбор для документа «${document.title}»`}>
        <button className={`choice-button keep-button ${choice === 'keep' ? 'selected' : ''}`} aria-pressed={choice === 'keep'} onClick={() => onChoose('keep')}>Оставить</button>
        <button className={`choice-button restore-button ${choice === 'restore' ? 'selected' : ''}`} aria-pressed={choice === 'restore'} onClick={() => onChoose('restore')}>На реставрацию</button>
      </div>
    </article>
  );
}

function DocumentModal({ document, onClose }) {
  useEffect(() => {
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-window" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Закрыть окно">×</button>
        <div className="document-info">
          <p className="eyebrow">Архивная карточка</p>
          <h2 id="modal-title">{document.title}</h2>
          <dl>
            <div><dt>Категория</dt><dd>{document.category}</dd></div>
            <div><dt>Тип бумаги</dt><dd>{document.paperType}</dd></div>
            <div><dt>Состояние</dt><dd>{document.condition}</dd></div>
          </dl>
          <p>{document.description}</p>
        </div>
        <img className={`modal-image ${document.condition === 'ветхое' ? 'aged-image' : ''}`} src={document.img} alt={`Увеличенное изображение: ${document.title}`} />
      </section>
    </div>
  );
}

function Workbench({ selectedDocuments }) {
  return (
    <main className="workbench page-shell">
      <p className="eyebrow">Следующий этап</p>
      <h1>Рабочий стол</h1>
      <p className="intro">Документы, выбранные для реставрации</p>
      {selectedDocuments.length ? <div className="workbench-list">
        {selectedDocuments.map((item) => <article className="workbench-item" key={item.id}>
          <img className={item.condition === 'ветхое' ? 'aged-image' : ''} src={item.img} alt="" />
          <h2>{item.title}</h2>
        </article>)}
      </div> : <p className="empty-note">Вы не выбрали документы для реставрации.</p>}
      <p className="placeholder-note"></p>
    </main>
  );
}

export default function App() {
  const [choices, setChoices] = useState({});
  const [activeDocument, setActiveDocument] = useState(null);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const markedCount = Object.keys(choices).length;
  const selectedDocuments = documents.filter((item) => choices[item.id] === 'restore');

  if (showWorkbench) return <Workbench selectedDocuments={selectedDocuments} />;

  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">Архив · первичный осмотр</p>
        <h1>Реставрация архивных документов</h1>
        <p className="intro">Рассмотрите документы и решите, каким из них нужна помощь.</p>
      </header>
      <section className="documents-grid" aria-label="Документы для оценки">
        {documents.map((item) => <DocumentCard key={item.id} document={item} choice={choices[item.id]} onChoose={(choice) => setChoices((current) => ({ ...current, [item.id]: choice }))} onOpen={() => setActiveDocument(item)} />)}
      </section>
      <footer className="action-bar">
        <span className="marked-count" aria-live="polite">Отмечено: {markedCount} из {documents.length}</span>
        <button className="continue-button" disabled={markedCount !== documents.length} onClick={() => setShowWorkbench(true)}>Перейти к реставрации <span aria-hidden="true">→</span></button>
      </footer>
      {activeDocument && <DocumentModal document={activeDocument} onClose={() => setActiveDocument(null)} />}
    </main>
  );
}
