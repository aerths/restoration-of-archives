const repairTools = [
  {
    id: 'brush',
    name: 'Кисть',
    symbol: 'К',
    description: 'Снимает поверхностную пыль',
    effects: {
      dry: { removes: ['dust'], errorDamage: 'царапина кистью' },
    },
  },
  {
    id: 'eraser',
    name: 'Ластик',
    symbol: 'Л',
    description: 'Удаляет сухие загрязнения',
    effects: {
      dry: { removes: ['dirt'], errorDamage: 'потёртость бумаги' },
    },
  },
  {
    id: 'scalpel',
    name: 'Скальпель',
    symbol: 'С',
    description: 'Снимает наросты и размоченный клей',
    effects: {
      dry: { removes: ['crust'], errorDamage: 'порез бумаги' },
      paper: { removes: ['glue'], requires: 'softened', errorDamage: 'порез бумаги' },
    },
  },
  {
    id: 'water-cloth',
    name: 'Влажная салфетка',
    symbol: 'В',
    description: 'Размачивает засохший клей',
    effects: {
      paper: { prepares: 'glue', errorDamage: 'водяное пятно' },
    },
  },
  {
    id: 'tweezers',
    name: 'Щипцы',
    symbol: 'Щ',
    description: 'Извлекают торчащие нитки',
    effects: {
      paper: { removes: ['thread'], errorDamage: 'надрыв волокон' },
    },
  },
  {
    id: 'japanese-paper',
    name: 'Японская бумага',
    symbol: 'Я',
    description: 'Метилцеллюлоза укрепляет разрывы и утраты',
    effects: {
      paper: { removes: ['tear', 'loss'], errorDamage: 'деформация бумаги' },
    },
  },
  {
    id: 'blotter',
    name: 'Фильтровальная бумага с грузом',
    symbol: 'Ф',
    description: 'Равномерно сушит документ под небольшим грузом',
    effects: {
      drying: { correct: true },
    },
  },
  {
    id: 'dryer',
    name: 'Фен',
    symbol: 'Ф',
    description: 'Быстрая сушка вызывает деформацию',
    effects: {
      drying: { correct: false, errorDamage: 'деформация от фена' },
    },
  },
  {
    id: 'iron',
    name: 'Утюг',
    symbol: 'У',
    description: 'Нагрев повреждает бумагу',
    effects: {
      drying: { correct: false, errorDamage: 'деформация от утюга' },
    },
  },
];

export default repairTools;
