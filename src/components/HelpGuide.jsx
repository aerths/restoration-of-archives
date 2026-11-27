import { useEffect, useState } from 'react';
import './HelpGuide.css';

const restorationGuides = [
  {
    title: 'Фотофиксация',
    instructions: [
      'Осмотрите документ и нажмите «Сделать снимок», чтобы сохранить исходное состояние.',
      'В карточке справа перечислены все найденные дефекты. Красные точки — это повреждения, полученные из-за настроек на Этапе 1.',
      'Снимок останется неизменным для итогового сравнения.',
    ],
  },
  {
    title: 'Тест чернил',
    instructions: [
      'Нажмите «Провести тест» и дождитесь результата проверки на незаметном участке.',
      'Для современной бумаги чернила чаще устойчивы, для старой бумаги вероятность растворения выше.',
      'При растворимых чернилах сухая стратегия безопаснее. Водная обработка по рискованной стратегии может размыть текст.',
    ],
  },
  {
    title: 'Сухая очистка',
    instructions: [
      'Выберите инструмент и нажмите на метку: красные точки — повреждения, полученные из-за настроек на Этапе 1.',
      'Кисть убирает пыль, ластик — загрязнение, скальпель — жёсткий нарост.',
      'Неверный инструмент добавит вторичное повреждение. Обработайте все три точки, чтобы продолжить.',
    ],
  },
  {
    title: 'Выбор стратегии',
    instructions: [
      'Выберите один из планов реставрации. Для ОЦД сухая стратегия даёт бонус к оценке.',
      'Водный план предполагает укрепление чернил фиксативом перед обработкой.',
      'Если тест показал растворимость чернил, выбор воды рискован: первое применение добавит размытие текста.',
    ],
  },
  {
    title: 'Восстановление бумаги',
    instructions: [
      'Перетащите инструмент на метку или выберите его нажатием. Красные точки — повреждения, полученные из-за настроек на Этапе 1.',
      'Салфетка размягчает клей, скальпель снимает размоченный клей, щипцы удаляют нитки.',
      'Японская бумага закрывает разрывы и утраты. При сухой стратегии клей можно оставить и продолжить без воды.',
    ],
  },
  {
    title: 'Сушка',
    instructions: [
      'Выберите фильтровальную бумагу с грузом и дождитесь окончания сушки.',
      'Фен и утюг запрещены: они деформируют бумагу и добавляют вторичное повреждение.',
    ],
  },
  {
    title: 'Итоговая фотофиксация',
    instructions: [
      'Сделайте итоговый снимок после завершения обработки.',
      'Сравните его с исходной фотографией и проверьте список оставшихся дефектов.',
      'Читаемость текста учитывает устранённые повреждения и штраф за вторичные дефекты.',
    ],
  },
   {
    title: 'Сравнение и оценка',
    instructions: [
      'Полнота текста показывает долю устранённых текстовых дефектов.',
      'Прочность зависит от аккуратности действий, а показатель вторичных повреждений учитывает ошибки Этапа 1 и реставрации.',
      'Итоговые очки умножаются на коэффициент категории: массовый — 1,0, ценный — 1,2, ОЦД — 1,5.',
    ],
  },
];

const generalGuides = {
  selection: {
    eyebrow: 'Этап 0 · первичный осмотр',
    title: 'Выберите документы',
    instructions: [
      'Откройте карточку документа, чтобы рассмотреть его описание и состояние.',
      'Для каждого документа выберите «Оставить» или «На реставрацию».',
      'Когда отмечены все документы, нажмите «Перейти к реставрации».',
    ],
  },
  environment: {
    eyebrow: 'Этап 1 · подготовка среды',
    title: 'Настройте условия хранения',
    instructions: [
      'Для каждого документа выставьте температуру, влажность и освещение в указанном безопасном диапазоне.',
      'Выход за диапазон добавляет документу повреждение: деформацию, пятно или выцветание.',
      'Нажмите «Зафиксировать» для каждого документа. Повреждения от настроек перейдут в Этап 2.',
    ],
  },
};

export default function HelpGuide({ stage, stepIndex = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const positionClass = stage === 'environment' ? 'is-stage-one' : stage === 'selection' ? 'is-selection' : '';
  const content = stage === 'restoration'
    ? { eyebrow: `Этап 2 · шаг ${stepIndex + 1} из 8`, ...restorationGuides[stepIndex] }
    : generalGuides[stage];

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        className={`help-guide-trigger ${positionClass}`}
        type="button"
        aria-label={isOpen ? 'Закрыть инструкцию' : 'Открыть инструкцию'}
        aria-expanded={isOpen}
        aria-controls="help-guide-panel"
        onClick={() => setIsOpen((current) => !current)}
      >
        !
      </button>
      {isOpen && (
        <div className={`help-guide-backdrop ${positionClass}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
          <section className="help-guide-panel" id="help-guide-panel" role="dialog" aria-modal="true" aria-labelledby="help-guide-title">
            <button className="help-guide-close" type="button" aria-label="Закрыть инструкцию" onClick={() => setIsOpen(false)}>×</button>
            <p className="eyebrow">{content.eyebrow}</p>
            <h2 id="help-guide-title">{content.title}</h2>
            <ol>
              {content.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
            </ol>
          </section>
        </div>
      )}
    </>
  );
}
