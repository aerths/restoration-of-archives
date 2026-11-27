import { useEffect, useState } from 'react';
import repairTools from '../data/repair-tools.js';

const dryKinds = ['dust', 'dirt', 'crust'];
const paperKinds = ['glue', 'thread', 'tear', 'loss'];

export function DefectMarker({ damage, onClick, onDrop }) {
  const [left, top] = damage.position || [50, 50];
  const isRemoved = damage.status === 'removed';

  return (
    <button
      className={`defect-marker defect-${damage.kind} ${damage.source === 'stage1' ? 'marker-stage1' : ''} ${damage.status === 'softened' ? 'is-softened' : ''}`}
      style={{ left: `${left}%`, top: `${top}%` }}
      type="button"
      disabled={isRemoved || (!onClick && !onDrop)}
      aria-label={`${damage.name}${damage.status === 'softened' ? ', размочен' : ''}`}
      title={`${damage.name}${damage.status === 'softened' ? ' · можно снять скальпелем' : ''}`}
      onClick={() => onClick?.(damage.id)}
      onDragOver={(event) => { if (onDrop) event.preventDefault(); }}
      onDrop={(event) => {
        if (!onDrop) return;
        event.preventDefault();
        onDrop(event.dataTransfer.getData('text/plain'), damage.id);
      }}
    >
      <span aria-hidden="true">{isRemoved ? '✓' : ''}</span>
    </button>
  );
}

export function DocumentCanvas({
  document,
  damages,
  image,
  cleanImage,
  interactive = false,
  onDamageClick,
  onToolDrop,
  showRemoved = false,
}) {
  const visibleDamages = damages.filter((damage) => showRemoved || damage.status !== 'removed');

  return (
    <div className="stage2-document-canvas">
      <img src={image || document.img} alt={`Документ «${document.title}»`} />
      {cleanImage && damages.filter((damage) => damage.status === 'removed').map((damage) => {
        const x = damage.x ?? damage.position?.[0] ?? 50;
        const y = damage.y ?? damage.position?.[1] ?? 50;
        const radius = damage.radius || 4;
        return (
          <div
            className="restored-window"
            key={`restored-${damage.id}`}
            aria-label={`Восстановлен участок: ${damage.name}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${radius * 2}%`,
              height: `${radius * 2}%`,
              backgroundImage: `url(${cleanImage})`,
              backgroundSize: `${100 / (radius * 2)}% ${100 / (radius * 2)}%`,
              backgroundPosition: `${((x - radius) / (100 - radius * 2)) * 100}% ${((y - radius) / (100 - radius * 2)) * 100}%`,
            }}
          />
        );
      })}
      <div className="document-texture" aria-hidden="true" />
      {visibleDamages.map((damage) => (
        <DefectMarker
          key={damage.id}
          damage={damage}
          onClick={interactive ? onDamageClick : undefined}
          onDrop={interactive ? onToolDrop : undefined}
        />
      ))}
    </div>
  );
}

function DamageLegend({ hasStageOneDamages = false }) {
  return (
    <aside className="damage-legend" aria-label="Условные обозначения">
      <h3>Условные обозначения</h3>
      <ul>
        <li><span className="legend-dot legend-yellow" />Жёлтые кружки — засохший клей</li>
        <li><span className="legend-dot legend-gray" />Серые кружки — торчащие нитки</li>
        <li><span className="legend-dot legend-white" />Белые кружки — разрыв или утрата бумаги</li>
        {hasStageOneDamages && <li><span className="legend-dot legend-red" />Красные точки — повреждения, полученные из-за настроек на Этапе 1</li>}
      </ul>
    </aside>
  );
}

export function ToolPalette({ tools, selectedTool, onSelect, disabledTools = [] }) {
  return (
    <div className="tool-palette" aria-label="Инструменты">
      {tools.map((tool) => {
        const disabled = disabledTools.includes(tool.id);
        return (
          <button
            className={`tool-card ${selectedTool === tool.id ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
            key={tool.id}
            type="button"
            draggable={!disabled}
            disabled={disabled}
            aria-pressed={selectedTool === tool.id}
            onClick={() => onSelect(tool.id)}
            onDragStart={(event) => event.dataTransfer.setData('text/plain', tool.id)}
          >
            <span className="tool-symbol" aria-hidden="true">{tool.symbol}</span>
            <span className="tool-name">{tool.name}</span>
            <span className="tool-description">{tool.description}</span>
            {disabled && <span className="tool-lock">Заблокировано тестом</span>}
          </button>
        );
      })}
    </div>
  );
}

function StepHeading({ eyebrow, title, description }) {
  return (
    <div className="step-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function InitialPhotoStep({ session, onCapture }) {
  const damageList = session.originalSnapshot?.damages || session.damages.filter((damage) => damage.status !== 'removed');

  return (
    <section className="restoration-step">
      <StepHeading
        eyebrow="Шаг 1 · фотофиксация"
        title="Зафиксируйте исходное состояние"
        description="Снимок и перечень дефектов останутся неизменными до завершения работы."
      />
      <div className="photo-layout">
        <div className="photo-document-panel">
          <DocumentCanvas
            document={session.document}
            damages={damageList}
            image={session.originalSnapshot?.image}
          />
          <p className="canvas-caption">{session.document.title}</p>
        </div>
        <aside className={`snapshot-card ${session.originalSnapshot ? 'is-captured' : ''}`}>
          <p className="card-kicker">Архивная карточка</p>
          <h3>Исходное состояние</h3>
          {session.originalSnapshot ? (
            <>
              <p className="snapshot-stamp">Снимок сохранён</p>
              <ul className="damage-list">
                {session.originalSnapshot.damages.map((damage) => <li key={damage.id}>{damage.name}</li>)}
              </ul>
            </>
          ) : (
            <>
              <p>Перед началом работы осмотрите документ и сохраните снимок вместе со списком повреждений.</p>
              <button className="archive-button" type="button" onClick={onCapture}>Сделать снимок</button>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

export function InkTestStep({ session, onTest }) {
  return (
    <section className="restoration-step">
      <StepHeading
        eyebrow="Шаг 2 · тест чернил"
        title="Проверьте растворимость чернил"
        description="Проба помогает определить, допустима ли локальная обработка водой."
      />
      <div className="ink-test-card">
        <div className="test-drop" aria-hidden="true">H2O</div>
        <div>
          <p className="card-kicker">Бумага: {session.document.paperType}</p>
          <h3>Проба на незаметном участке</h3>
          <p>Тип бумаги влияет на результат: современные чернила обычно устойчивы, старые могут растворяться.</p>
          {session.inkSoluble === null ? (
            <button className="archive-button" type="button" onClick={onTest}>Провести тест</button>
          ) : (
            <div className={`test-result ${session.inkSoluble ? 'is-risky' : 'is-safe'}`} role="status">
              <strong>{session.inkSoluble ? 'Чернила растворяются в воде' : 'Чернила устойчивы к воде'}</strong>
              <span>{session.inkSoluble
                ? 'Водные методы заблокированы. Вы сможете выбрать рискованную стратегию с фиксативом, но вода может размыть текст.'
                : 'Водная обработка доступна при осторожном применении.'}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function DryCleaningStep({ session, selectedTool, onSelectTool, onApplyTool }) {
  const tools = repairTools.filter((tool) => tool.effects.dry);
  const remaining = session.damages.filter((damage) => dryKinds.includes(damage.kind) && damage.status !== 'removed');

  return (
    <section className="restoration-step">
      <StepHeading
        eyebrow="Шаг 3 · сухая очистка"
        title="Уберите поверхностные загрязнения"
        description="Выберите подходящий инструмент, затем нажмите на метку. Неверная пара оставит новый дефект."
      />
      <div className="work-area">
        <div className="work-document-panel">
          <DocumentCanvas
            document={session.document}
            damages={session.damages}
            cleanImage={session.cleanImg}
            interactive
            onDamageClick={(damageId) => selectedTool && onApplyTool(selectedTool, damageId)}
          />
          <p className="canvas-caption">Осталось загрязнений: {remaining.length}</p>
        </div>
        <aside className="tool-side-panel">
          <h3>Инструменты</h3>
          <ToolPalette tools={tools} selectedTool={selectedTool} onSelect={onSelectTool} />
          <DamageLegend hasStageOneDamages={session.damages.some((damage) => damage.source === 'stage1')} />
          <p className="interaction-hint">Сначала выберите инструмент, затем нажмите на соответствующую точку.</p>
        </aside>
      </div>
    </section>
  );
}

export function StrategyStep({ session, onChoose }) {
  const strategies = [
    {
      id: 'dry',
      title: 'Только сухие методы',
      description: 'Самый бережный путь для особо ценных документов. Не требует контакта чернил с водой.',
      note: session.document.category === 'ОЦД' ? 'Рекомендовано для ОЦД · бонус к оценке' : 'Безопасный вариант без водной обработки',
    },
    {
      id: 'water',
      title: 'Фиксатив и водная обработка',
      description: 'Укрепить чернила фиксативом, затем использовать влажную салфетку и другие водные методы.',
      note: session.inkSoluble ? 'Риск: тест показал растворимость, вода может размыть текст' : 'Подходит для устойчивых чернил',
    },
  ];

  return (
    <section className="restoration-step">
      <StepHeading
        eyebrow="Шаг 4 · стратегия"
        title="Выберите план реставрации"
        description="Решение определит доступность водных инструментов и повлияет на итоговую оценку."
      />
      <div className="strategy-grid">
        {strategies.map((strategy) => (
          <button
            className={`strategy-card ${session.strategy === strategy.id ? 'is-selected' : ''}`}
            type="button"
            key={strategy.id}
            aria-pressed={session.strategy === strategy.id}
            onClick={() => onChoose(strategy.id)}
          >
            <span className="strategy-number">{strategy.id === 'dry' ? '01' : '02'}</span>
            <strong>{strategy.title}</strong>
            <span>{strategy.description}</span>
            <em>{strategy.note}</em>
          </button>
        ))}
      </div>
      {session.strategy === 'water' && session.inkSoluble && (
        <p className="warning-note" role="alert">Тест показал растворимость. Фиксатив не отменяет риск: при контакте с водой текст может размыться.</p>
      )}
    </section>
  );
}

export function PaperRepairStep({ session, selectedTool, onSelectTool, onApplyTool }) {
  const tools = repairTools.filter((tool) => tool.effects.paper);
  const disabledTools = session.strategy !== 'water' ? ['water-cloth'] : [];
  const remaining = session.damages.filter((damage) => paperKinds.includes(damage.kind) && damage.status !== 'removed');
  const canLeaveGlue = session.strategy === 'dry' && remaining.every((damage) => damage.kind === 'glue');

  return (
    <section className="restoration-step">
      <StepHeading
        eyebrow="Шаг 5 · восстановление бумаги"
        title="Обработайте повреждения основы"
        description="Перетащите инструмент на метку или выберите его нажатием и затем нажмите на дефект."
      />
      <div className="work-area paper-work-area">
        <div className="work-document-panel">
          <DocumentCanvas
            document={session.document}
            damages={session.damages}
            cleanImage={session.cleanImg}
            interactive
            onDamageClick={(damageId) => selectedTool && onApplyTool(selectedTool, damageId)}
            onToolDrop={onApplyTool}
          />
          <p className="canvas-caption">Осталось дефектов бумаги: {remaining.length}</p>
        </div>
        <aside className="tool-side-panel">
          <h3>Палитра реставратора</h3>
          <ToolPalette tools={tools} selectedTool={selectedTool} onSelect={onSelectTool} disabledTools={disabledTools} />
          <DamageLegend hasStageOneDamages={session.damages.some((damage) => damage.source === 'stage1')} />
          {session.strategy !== 'water' && (
            <p className="warning-note compact-note">Салфетка недоступна при сухой стратегии. Чтобы работать с клеем водой, вернитесь к стратегии и выберите водный метод.</p>
          )}
          {session.inkSoluble && session.strategy === 'water' && (
            <p className="warning-note compact-note">При первом применении воды будет добавлено повреждение «размытие текста».</p>
          )}
          {canLeaveGlue && <p className="interaction-hint">При сухой стратегии клей останется на месте. Можно продолжить без водной обработки.</p>}
        </aside>
      </div>
    </section>
  );
}

export function DryingStep({ onWrongTool, onDryComplete }) {
  const [drying, setDrying] = useState(false);
  const [message, setMessage] = useState('');
  const tools = repairTools.filter((tool) => tool.effects.drying);

  useEffect(() => {
    if (!drying) return undefined;
    const timer = window.setTimeout(() => {
      setDrying(false);
      onDryComplete();
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [drying, onDryComplete]);

  const selectTool = (toolId) => {
    if (drying) return;
    if (toolId === 'blotter') {
      setMessage('Документ сохнет под фильтровальной бумагой с грузом…');
      setDrying(true);
      return;
    }
    const tool = tools.find((item) => item.id === toolId);
    onWrongTool(tool.effects.drying.errorDamage);
    setMessage(`${tool.name} повредил лист. Выберите фильтровальную бумагу с грузом.`);
  };

  return (
    <section className="restoration-step">
      <StepHeading
        eyebrow="Шаг 6 · сушка"
        title="Высушите документ без нагрева"
        description="Положите документ под фильтровальную бумагу с небольшим грузом. Фен и утюг запрещены."
      />
      <div className="drying-layout">
        <div className={`drying-illustration ${drying ? 'is-drying' : ''}`} aria-hidden="true">
          <span className="paper-stack paper-top" />
          <span className="paper-stack paper-document" />
          <span className="paper-weight" />
          <span className="drying-stamp">АРХИВ</span>
        </div>
        <div className="drying-options">
          <h3>Способ сушки</h3>
          <ToolPalette tools={tools} onSelect={selectTool} selectedTool={drying ? 'blotter' : null} />
          <p className={drying ? 'drying-message is-active' : 'drying-message'} role="status">
            {message || 'Безопасный способ сохранит форму и волокна бумаги.'}
          </p>
        </div>
      </div>
    </section>
  );
}

function DamageList({ damages }) {
  if (!damages.length) return <p className="no-damages">Видимых дефектов не осталось.</p>;
  return <ul className="damage-list">{damages.map((damage) => <li key={damage.id}>{damage.name}</li>)}</ul>;
}

export function FinalPhotoStep({ session, readability, onCapture }) {
  if (!session.finalSnapshot) {
    return (
      <section className="restoration-step">
        <StepHeading
          eyebrow="Шаг 7 · итоговая фотофиксация"
          title="Сохраните результат реставрации"
          description="Сделайте второй снимок. Он будет сопоставлен с неизменённым исходным состоянием."
        />
        <div className="final-photo-prompt">
          <DocumentCanvas document={session.document} damages={session.damages} cleanImage={session.cleanImg} />
          <div>
            <p className="card-kicker">После реставрации</p>
            <h3>{session.document.title}</h3>
            <p>На изображении останутся только необработанные дефекты и следы ошибок.</p>
            <button className="archive-button" type="button" onClick={onCapture}>Сделать итоговый снимок</button>
          </div>
        </div>
      </section>
    );
  }

  const startImage = session.originalSnapshot?.image || session.document.img;
  const endImage = session.finalSnapshot.image;

  return (
    <section className="restoration-step">
      <StepHeading
        eyebrow="Шаг 7 · сравнение снимков"
        title="До и после реставрации"
        description="Исходный снимок сохранён отдельно. Чистое изображение документа показывается, если оно есть в архивных данных."
      />
      <div className="comparison-grid">
        <article className="comparison-card">
          <div className="comparison-title"><span>01</span><h3>Исходное состояние</h3></div>
          <DocumentCanvas document={session.document} damages={session.originalSnapshot?.damages || []} image={startImage} />
          <DamageList damages={session.originalSnapshot?.damages || []} />
        </article>
        <article className="comparison-card is-after">
          <div className="comparison-title"><span>02</span><h3>После реставрации</h3></div>
           <DocumentCanvas document={session.document} damages={session.finalSnapshot.damages} image={endImage} cleanImage={session.cleanImg} />
          <DamageList damages={session.finalSnapshot.damages} />
        </article>
      </div>
      <div className="readability-result">
        <span>Читаемость текста</span>
        <strong>{readability}%</strong>
        <div className="readability-track"><span style={{ width: `${readability}%` }} /></div>
      </div>
    </section>
  );
}

export { dryKinds, paperKinds };
