import { useState } from 'react';
import stageTwoDocuments from '../data/stage2-docs.js';
import repairTools from '../data/repair-tools.js';
import HelpGuide from './HelpGuide.jsx';
import {
  DryCleaningStep,
  DryingStep,
  FinalPhotoStep,
  InitialPhotoStep,
  InkTestStep,
  PaperRepairStep,
  StrategyStep,
  DocumentCanvas,
  dryKinds,
  paperKinds,
} from './StageTwoSteps.jsx';
import './StageTwo.css';

const stepNames = [
  'Фотофиксация',
  'Тест чернил',
  'Сухая очистка',
  'Стратегия',
  'Восстановление бумаги',
  'Сушка',
  'Итоговый снимок',
  'Сравнение и оценка',
];

const severityFactors = { массовый: 1, ценный: 1.2, ОЦД: 1.5 };

function createSession(result) {
  const documentData = stageTwoDocuments.find((item) => item.id === result.document.id);
  const originalDamages = (documentData?.damages || []).map((damage) => ({
    ...damage,
    position: [...damage.position],
    status: 'active',
    source: 'base',
    secondary: false,
  }));
  const inheritedDamages = (result.documentState?.damages || []).map((damage) => ({
    ...damage,
    status: 'active',
    source: 'stage1',
    secondary: true,
  }));

  return {
    document: result.document,
    cleanImg: documentData?.cleanImg || null,
    damages: [...originalDamages, ...inheritedDamages],
    originalSnapshot: null,
    finalSnapshot: null,
    inkSoluble: null,
    strategy: null,
    waterUsed: false,
    waterBlurAdded: false,
    dried: false,
    mistakes: 0,
    correctActions: 0,
    nextDamageId: 1,
  };
}

function appendSecondaryDamage(session, name, kind = 'secondary') {
  const positions = [[52, 35], [39, 67], [72, 57], [28, 48], [63, 24]];
  const position = positions[(session.nextDamageId - 1) % positions.length];
  const damage = {
    id: `secondary-${session.nextDamageId}`,
    kind,
    name,
    position,
    affectsText: true,
    status: 'active',
    source: 'secondary',
    secondary: true,
  };

  return {
    ...session,
    damages: [...session.damages, damage],
    mistakes: session.mistakes + 1,
    nextDamageId: session.nextDamageId + 1,
  };
}

function getTextReadability(session) {
  const textDamages = session.damages.filter((damage) => !damage.secondary && damage.affectsText);
  const removedCount = textDamages.filter((damage) => damage.status === 'removed').length;
  const basePercent = textDamages.length ? (removedCount / textDamages.length) * 100 : 100;
  const secondaryCount = session.damages.filter((damage) => damage.secondary).length;
  return Math.max(0, Math.min(100, Math.round(basePercent - secondaryCount * 4)));
}

function getSessionScore(session) {
  const textDamages = session.damages.filter((damage) => !damage.secondary && damage.affectsText);
  const removedText = textDamages.filter((damage) => damage.status === 'removed').length;
  const secondaryCount = session.damages.filter((damage) => damage.secondary).length;
  const remainingPaper = session.damages.filter((damage) => (
    !damage.secondary && paperKinds.includes(damage.kind) && damage.status !== 'removed'
  )).length;
  const readability = getTextReadability(session);
  const actionCount = session.correctActions + session.mistakes;
  const actionAccuracy = actionCount ? (session.correctActions / actionCount) * 100 : 100;
  const paperStrength = Math.max(0, Math.min(100, Math.round(actionAccuracy - session.mistakes * 4 - remainingPaper * 8 - secondaryCount * 2)));
  const secondarySafety = Math.max(0, 100 - secondaryCount * 12);
  const strategyBonus = session.document.category === 'ОЦД' && session.strategy === 'dry' ? 15 : 0;
  const rawScore = Math.max(0, readability + paperStrength + secondarySafety + strategyBonus);
  const factor = severityFactors[session.document.category] || 1;

  return {
    readability,
    paperStrength,
    secondarySafety,
    secondaryCount,
    strategyBonus,
    factor,
    score: Math.round(rawScore * factor),
    removedText,
    totalText: textDamages.length,
  };
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function ResultsStep({ sessions, onNewTask, onExit }) {
  const scoredSessions = sessions.map((session) => ({ session, score: getSessionScore(session) }));
  const totalScore = scoredSessions.reduce((total, item) => total + item.score.score, 0);
  const overallReadability = average(scoredSessions.map((item) => item.score.readability));
  const overallStrength = average(scoredSessions.map((item) => item.score.paperStrength));
  const overallSafety = average(scoredSessions.map((item) => item.score.secondarySafety));
  const totalSecondary = scoredSessions.reduce((total, item) => total + item.score.secondaryCount, 0);

  return (
    <section className="stage2-results">
      <p className="eyebrow">Этап 2 · завершён</p>
      <h2>Реставрация завершена</h2>
      <p className="results-intro">Снимки сохранены. Оценка учитывает состояние бумаги, ошибки и категорию каждого документа.</p>
      <div className="overall-score-card">
        <div>
          <span>Итоговый балл</span>
          <strong>{totalScore}</strong>
        </div>
        <div className="score-seal" aria-hidden="true">АРХИВ<br />СОХРАНЁН</div>
      </div>
      <div className="score-metrics">
        <article className="score-metric">
          <span className="metric-index">01</span>
          <h3>Полнота текста</h3>
          <strong>{overallReadability}%</strong>
          <span>повреждений текста устранено</span>
        </article>
        <article className="score-metric">
          <span className="metric-index">02</span>
          <h3>Прочность бумаги</h3>
          <strong>{overallStrength}%</strong>
          <span>аккуратность обработки</span>
        </article>
        <article className="score-metric">
          <span className="metric-index">03</span>
          <h3>Без вторичных повреждений</h3>
          <strong>{overallSafety}%</strong>
          <span>всего вторичных дефектов: {totalSecondary}</span>
        </article>
      </div>
      <div className="results-document-list">
        {scoredSessions.map(({ session, score }) => (
          <article className="result-item stage2-result-item" key={session.document.id}>
            <div className="result-heading">
              <div>
                <p className="card-kicker">{session.document.category} · коэффициент {score.factor.toFixed(1)}</p>
                <h3>{session.document.title}</h3>
              </div>
              <strong className="document-score">{score.score} баллов</strong>
            </div>
            <div className="result-comparison-mini">
              <figure>
                <img src={session.originalSnapshot?.image || session.document.img} alt="Исходный снимок" />
                <figcaption>До</figcaption>
              </figure>
              <figure>
                {session.damages.some((damage) => damage.secondary) ? (
                  <div className="result-document-preview">
                    <DocumentCanvas
                      document={session.document}
                      damages={session.damages.filter((damage) => damage.secondary)}
                      image={session.cleanImg}
                    />
                  </div>
                ) : (
                  <img src={session.cleanImg} alt="Документ хорошего качества после реставрации" />
                )}
                <figcaption>После · читаемость {score.readability}%</figcaption>
              </figure>
            </div>
            <p className="document-score-note">
              Текст: {score.removedText} из {score.totalText} повреждений убрано · вторичных повреждений: {score.secondaryCount}
              {score.strategyBonus ? ` · бонус за сухую стратегию: +${score.strategyBonus}` : ''}
            </p>
          </article>
        ))}
      </div>
      <div className="results-actions">
        <button className="archive-button" type="button" onClick={onNewTask}>Начать новое задание</button>
        <button className="back-link" type="button" onClick={onExit}>Выйти</button>
      </div>
    </section>
  );
}

export default function StageTwo({ results, onBack, onNewTask, onExit }) {
  const [sessions, setSessions] = useState(() => results.map(createSession));
  const [activeDocument, setActiveDocument] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState(null);
  const isResults = stepIndex === 7;
  const session = sessions[activeDocument];

  const updateSession = (updater) => {
    setSessions((current) => current.map((item, index) => (
      index === activeDocument ? updater(item) : item
    )));
  };

  const recordToolAction = (phase, toolId, damageId) => {
    const tool = repairTools.find((item) => item.id === toolId);
    const effect = tool?.effects[phase];
    if (!effect) return;

    updateSession((current) => {
      const target = current.damages.find((damage) => damage.id === damageId);
      if (!target || target.status === 'removed') return current;
      let next = current;

      if (phase === 'paper' && toolId === 'water-cloth') {
        if (current.inkSoluble && current.strategy !== 'water') return current;
        next = { ...next, waterUsed: true };
        if (current.inkSoluble && !current.waterBlurAdded) {
          next = appendSecondaryDamage(next, 'Размытие текста', 'blur');
          next.waterBlurAdded = true;
        }
      }

      const nextTarget = next.damages.find((damage) => damage.id === damageId);
      if (effect.prepares === nextTarget.kind && nextTarget.status === 'active') {
        return {
          ...next,
          correctActions: next.correctActions + 1,
          damages: next.damages.map((damage) => damage.id === damageId ? { ...damage, status: 'softened' } : damage),
        };
      }

      const matches = effect.removes?.includes(nextTarget.kind)
        && (!effect.requires || nextTarget.status === effect.requires);
      if (matches) {
        return {
          ...next,
          correctActions: next.correctActions + 1,
          damages: next.damages.map((damage) => damage.id === damageId ? { ...damage, status: 'removed' } : damage),
        };
      }

      return appendSecondaryDamage(next, effect.errorDamage);
    });
  };

  const applyDryTool = (toolId, damageId) => recordToolAction('dry', toolId, damageId);
  const applyPaperTool = (toolId, damageId) => recordToolAction('paper', toolId, damageId);

  const captureOriginal = () => updateSession((current) => ({
    ...current,
    originalSnapshot: {
      image: current.document.img,
      damages: current.damages.filter((damage) => damage.status !== 'removed').map((damage) => ({ ...damage })),
    },
  }));

  const captureFinal = () => updateSession((current) => ({
    ...current,
      finalSnapshot: {
        image: current.document.img,
        damages: current.damages.map((damage) => ({ ...damage })),
    },
  }));

  const runInkTest = () => {
    updateSession((current) => ({ ...current, inkSoluble: false }));
  };

  const chooseStrategy = (strategy) => updateSession((current) => ({ ...current, strategy }));

  const markDried = () => updateSession((current) => ({
    ...current,
    dried: true,
    correctActions: current.correctActions + 1,
  }));

  const damageFromDrying = (name) => updateSession((current) => appendSecondaryDamage(current, name, 'deformation'));

  const paperDefects = session?.damages.filter((damage) => paperKinds.includes(damage.kind) && !damage.secondary) || [];
  const activePaperDefects = paperDefects.filter((damage) => damage.status !== 'removed');
  const canSkipGlueWithDryPlan = session?.strategy === 'dry' && activePaperDefects.every((damage) => damage.kind === 'glue');
  const dryDefects = session?.damages.filter((damage) => dryKinds.includes(damage.kind) && !damage.secondary) || [];
  const canContinue = session && [
    Boolean(session.originalSnapshot),
    session.inkSoluble !== null,
    dryDefects.every((damage) => damage.status === 'removed'),
    Boolean(session.strategy),
    activePaperDefects.length === 0 || canSkipGlueWithDryPlan,
    session.dried,
    Boolean(session.finalSnapshot),
  ][stepIndex];

  const advanceStep = () => {
    setSelectedTool(null);
    if (stepIndex === 6) {
      if (activeDocument < sessions.length - 1) {
        setActiveDocument((current) => current + 1);
        setStepIndex(0);
      } else {
        setStepIndex(7);
      }
      return;
    }
    setStepIndex((current) => current + 1);
  };

  if (!session && !isResults) {
    return (
      <main className="page-shell stage-two-shell">
        <p className="eyebrow">Этап 2 · реставрация документа</p>
        <h1>Нет документов для реставрации</h1>
        <button className="back-link" type="button" onClick={onBack}>Вернуться к условиям хранения</button>
        <HelpGuide stage="restoration" stepIndex={0} />
      </main>
    );
  }

  const progressTotal = sessions.length * 7 + 1;
  const progressValue = isResults ? progressTotal : activeDocument * 8 + stepIndex;
  const progressPercent = Math.round((progressValue / progressTotal) * 100);

  return (
    <main className="page-shell stage-two-shell">
      <header className="stage2-header">
        <button className="back-link" type="button" onClick={onBack}>← Вернуться к условиям</button>
        <p className="eyebrow">Этап 2 · реставрация документа</p>
        <h1>{isResults ? 'Сравнение и оценка' : stepNames[stepIndex]}</h1>
        {!isResults && <p className="stage2-document-title">Документ {activeDocument + 1} из {sessions.length} · {session.document.title}</p>}
        <div className="stage2-progress" aria-label={`Выполнено ${progressPercent}%`}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <ol className="stage2-stepper" aria-label="Шаги реставрации">
          {stepNames.map((name, index) => (
            <li className={`${index === stepIndex ? 'is-current' : ''} ${index < stepIndex ? 'is-complete' : ''}`} key={name}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <small>{name}</small>
            </li>
          ))}
        </ol>
      </header>

      {isResults ? (
        <ResultsStep sessions={sessions} onNewTask={onNewTask} onExit={onExit} />
      ) : (
        <>
          {stepIndex === 0 && <InitialPhotoStep session={session} onCapture={captureOriginal} />}
          {stepIndex === 1 && <InkTestStep session={session} onTest={runInkTest} />}
          {stepIndex === 2 && <DryCleaningStep session={session} selectedTool={selectedTool} onSelectTool={setSelectedTool} onApplyTool={applyDryTool} />}
          {stepIndex === 3 && <StrategyStep session={session} onChoose={chooseStrategy} />}
          {stepIndex === 4 && <PaperRepairStep session={session} selectedTool={selectedTool} onSelectTool={setSelectedTool} onApplyTool={applyPaperTool} />}
          {stepIndex === 5 && <DryingStep onWrongTool={damageFromDrying} onDryComplete={markDried} />}
          {stepIndex === 6 && <FinalPhotoStep session={session} readability={getTextReadability(session)} onCapture={captureFinal} />}
          
          {stepIndex < 7 && (
            <footer className="stage2-action-bar">
              <span>Шаг {stepIndex + 1} из 7 · документ {activeDocument + 1} из {sessions.length}</span>
              <button className="archive-button" type="button" disabled={!canContinue} onClick={advanceStep}>
                Продолжить <span aria-hidden="true">→</span>
              </button>
            </footer>
          )}
        </>
      )}
      <HelpGuide stage="restoration" stepIndex={stepIndex} />
    </main>
  );
}
