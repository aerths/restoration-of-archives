import { useEffect, useState } from 'react';
import documents from './data/documents.js';
import HelpGuide from './components/HelpGuide.jsx';
import StageTwo from './components/StageTwo.jsx';

const safeRanges = {
  массовый: { temperature: [40, 60], humidity: [40, 60], light: [20, 50] },
  ценный: { temperature: [45, 55], humidity: [45, 55], light: [15, 35] },
  ОЦД: { temperature: [48, 52], humidity: [48, 52], light: [10, 20] },
};

const sliderInfo = {
  temperature: { label: 'Температура', icon: '🌡️' },
  humidity: { label: 'Влажность', icon: '💧' },
  light: { label: 'Свет', icon: '☀️' },
};

const initialSettings = { temperature: 50, humidity: 50, light: 25 };
const stageOneDamageInfo = {
  temperature: { kind: 'deformation', name: 'деформация', position: [13, 67], affectsText: false },
  humidity: { kind: 'stain', name: 'пятно', position: [83, 22], affectsText: true },
  light: { kind: 'fading', name: 'выцветание', position: [82, 79], affectsText: true },
};

function isInSafeRange(value, range) {
  return value >= range[0] && value <= range[1];
}

function getStageOneDamages(document, settings) {
  const ranges = safeRanges[document.category];
  return Object.keys(sliderInfo)
    .filter((type) => !isInSafeRange(settings[type], ranges[type]))
    .map((type) => ({
      id: `stage1-${type}`,
      ...stageOneDamageInfo[type],
    }));
}

function createWorkbenchResult(document) {
  const settings = { ...initialSettings };
  return {
    document,
    settings,
    fixed: false,
    documentState: { damages: getStageOneDamages(document, settings) },
  };
}

function ConditionLabel({ condition }) {
  return <span className="condition-label">{condition}</span>;
}

function EnvironmentSlider({ type, value, range, disabled, onChange }) {
  const info = sliderInfo[type];
  const isSafe = isInSafeRange(value, range);

  return (
    <div className="environment-slider">
      <div className="slider-heading">
        <span className="slider-name"><span className="slider-icon" aria-hidden="true">{info.icon}</span>{info.label}</span>
        <output>{value}</output>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        disabled={disabled}
        style={{ accentColor: isSafe ? '#6f8e5c' : '#a24c3e' }}
        aria-label={info.label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className={`range-indicator ${isSafe ? 'safe' : 'unsafe'}`} aria-hidden="true" />
      <div className={`range-status ${isSafe ? 'safe' : 'unsafe'}`}>
        <span>{isSafe ? 'В зелёной зоне' : 'Вне зелёной зоны'}</span>
        <span>{range[0]}–{range[1]}</span>
      </div>
    </div>
  );
}

function RestorationCard({ document, result, onChange, onFix }) {
  const ranges = safeRanges[document.category];
  const hasBeenFixed = result.fixed;

  return (
    <article className={`restoration-card ${hasBeenFixed ? 'is-fixed' : ''}`}>
      <header className="restoration-card-header">
        <div>
          <p className="card-kicker">Документ {document.id}</p>
          <h2>{document.title}</h2>
        </div>
        {hasBeenFixed && <span className="fixed-mark">Зафиксировано</span>}
      </header>
      <dl className="document-facts">
        <div><dt>Категория</dt><dd>{document.category}</dd></div>
        <div><dt>Бумага</dt><dd>{document.paperType}</dd></div>
        <div><dt>Состояние</dt><dd><ConditionLabel condition={document.condition} /></dd></div>
      </dl>
      <div className="sliders-list">
        {Object.keys(sliderInfo).map((type) => (
          <EnvironmentSlider
            key={type}
            type={type}
            value={result.settings[type]}
            range={ranges[type]}
            disabled={hasBeenFixed}
            onChange={(value) => onChange(type, value)}
          />
        ))}
      </div>
      {result.documentState.damages.length > 0 && (
        <div className="penalties stage1-penalties">
          <strong>Повреждения от настроек среды</strong>
          <ul>{result.documentState.damages.map((damage) => <li key={damage.id}>{damage.name}</li>)}</ul>
        </div>
      )}
      <button className="fix-button" disabled={hasBeenFixed} onClick={onFix}>
        {hasBeenFixed ? 'Параметры зафиксированы' : 'Зафиксировать'}
      </button>
    </article>
  );
}

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

function Workbench({ selectedDocuments, onBack }) {
  const [results, setResults] = useState(() => selectedDocuments.map(createWorkbenchResult));
  const [showStageTwo, setShowStageTwo] = useState(false);
  const allFixed = results.length > 0 && results.every((result) => result.fixed);

  useEffect(() => {
    setResults(selectedDocuments.map(createWorkbenchResult));
    setShowStageTwo(false);
  }, [selectedDocuments]);

  if (showStageTwo) {
    return <StageTwo results={results} onBack={() => setShowStageTwo(false)} onNewTask={() => { setShowStageTwo(false); setResults(selectedDocuments.map(createWorkbenchResult)); }} onExit={() => { setShowStageTwo(false); onBack(); }} />;
  }

  const updateSetting = (documentId, type, value) => {
    setResults((current) => current.map((result) => {
      if (result.document.id !== documentId) return result;
      const settings = { ...result.settings, [type]: value };
      return {
        ...result,
        settings,
        documentState: { ...result.documentState, damages: getStageOneDamages(result.document, settings) },
      };
    }));
  };

  const fixDocument = (documentId) => {
    setResults((current) => current.map((result) => result.document.id === documentId
      ? { ...result, fixed: true }
      : result));
  };

  return (
    <main className="workbench page-shell">
      <header className="page-header workbench-header">
        <button className="back-link" onClick={onBack}>← Вернуться к выбору</button>
        <p className="eyebrow">Этап 1 · подготовка среды</p>
        <h1>Настройте условия хранения</h1>
        <p className="intro">Для каждого документа выберите температуру, влажность и освещение. Следите за зелёными зонами.</p>
      </header>
      {selectedDocuments.length ? <section className="restoration-grid" aria-label="Документы на реставрацию">
        {results.map((result) => <RestorationCard
          key={result.document.id}
          document={result.document}
          result={result}
          onChange={(type, value) => updateSetting(result.document.id, type, value)}
          onFix={() => fixDocument(result.document.id)}
        />)}
      </section> : <p className="empty-note">Вы не выбрали документы для реставрации.</p>}
      <footer className="action-bar stage-action-bar">
        <span className="marked-count" aria-live="polite">Зафиксировано: {results.filter((result) => result.fixed).length} из {results.length}</span>
        <button className="continue-button" disabled={!allFixed} onClick={() => setShowStageTwo(true)}>Перейти к реставрации <span aria-hidden="true">→</span></button>
      </footer>
      <HelpGuide stage="environment" />
    </main>
  );
}

export default function App() {
  const [choices, setChoices] = useState({});
  const [activeDocument, setActiveDocument] = useState(null);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const markedCount = Object.keys(choices).length;
  const selectedDocuments = documents.filter((item) => choices[item.id] === 'restore');

  if (showWorkbench) return <Workbench selectedDocuments={selectedDocuments} onBack={() => setShowWorkbench(false)} />;

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
      <HelpGuide stage="selection" />
    </main>
  );
}
