import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Target, 
  Activity, 
  Dumbbell, 
  Sparkles, 
  Scale, 
  ChevronDown, 
  ChevronUp 
} from '../BroskyIcon';

interface LexiconItem {
  id: string;
  term: string;
  fullName: string;
  category: 'autopilot' | 'metabolism' | 'volume' | 'nutrition';
  badge: string;
  badgeColor: string;
  summary: string;
  description: string;
  formulaOrRule?: string;
}

const LEXICON_ITEMS: LexiconItem[] = [
  // 1. Силовой автопилот и Авторегуляция
  {
    id: 'rir',
    term: 'RIR',
    fullName: 'Reps in Reserve (Запас повторов)',
    category: 'autopilot',
    badge: 'Автопилот Нагрузки',
    badgeColor: 'bg-gym-accent/10 text-gym-accent border-gym-accent/20',
    summary: 'Количество повторений, которое вы могли бы сделать до полного мышечного отказа.',
    description: 'Фундаментальный показатель авторегуляции в Brosky Gym. Например, RIR 2 означает, что вы завершили подход на отметке, когда у вас оставалось силы строго на 2 чистых повторения. Автопилот использует RIR для точного расчета безопасного шага прибавки веса.',
    formulaOrRule: 'Шкала RIR: RIR 0 = Отказ | RIR 1 = Высокая интенсивность | RIR 2 = Стандарт гипертрофии | RIR 3+ = Разминка'
  },
  {
    id: 'rpe',
    term: 'RPE',
    fullName: 'Rating of Perceived Exertion (Шкала воспринимаемого напряжения)',
    category: 'autopilot',
    badge: 'Шкала Интенсивности',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    summary: 'Субъективная оценка тяжести подхода от 1 до 10 по системе Майка Тачшерера (RTS).',
    description: 'RPE напрямую зеркалит RIR: RPE 10 соответствует абсолютному отказу (RIR 0), RPE 9 означает RIR 1, RPE 8 означает RIR 2. Позволяет адаптировать рабочий вес под ваше дневное самочувствие и уровень ЦНС.',
    formulaOrRule: 'RPE = 10 - RIR (например: RPE 8.5 = 1.5 повтора в запасе)'
  },
  {
    id: '1rm',
    term: '1RM',
    fullName: 'One-Repetition Maximum (Одноповторный максимум)',
    category: 'autopilot',
    badge: 'Силовой Рекорд',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    summary: 'Максимальный вес, который атлет способен поднять в одном повторении с идеальной техникой.',
    description: 'В Brosky Gym 1RM рассчитывается автоматически в реальном времени во время тренировки на основе выполненных весов и повторов по формуле Эпли с коррекцией RPE. На его основе вычисляются проценты интенсивности и сила атлета.',
    formulaOrRule: 'Формула Epley: 1RM = Weight × (1 + Reps / 30)'
  },
  {
    id: 'doms',
    term: 'DOMS',
    fullName: 'Delayed Onset Muscle Soreness (Запоздалая мышечная боль)',
    category: 'autopilot',
    badge: 'Защита Фасций',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    summary: 'Синдром мышечной боли, возникающий через 24–48 часов после непривычной или тяжелой нагрузки.',
    description: 'Автопилот Brosky Gym учитывает статус DOMS. Если вы отмечаете высокую боль в целевой группе мышц, алгоритм автоматически активирует режим защиты связок и фасций, снижая рабочий вес на 15% для полного восстановления.',
    formulaOrRule: 'При DOMS = Высокая: Рабочий вес = Базовый вес × 0.85 (-15%)'
  },
  {
    id: 'neural_rate',
    term: 'Neural Rate',
    fullName: 'Агрессивность прогрессивной перегрузки',
    category: 'autopilot',
    badge: 'Настройка Алгоритма',
    badgeColor: 'bg-gym-accent/10 text-gym-accent border-gym-accent/20',
    summary: 'Скорость, с которой система наращивает ваши рабочие веса в упражнениях.',
    description: 'Три режима: Консервативный (+0.5x шага, плавный рост с большим запасом RIR 2), Сбалансированный (+1.0x шаг, научно обоснованный стандарт), Хардкор (+1.5x шага, быстрая прогрессия с выходом на RIR 1 для опытных).',
  },

  // 2. Метаболизм и Расход Энергии
  {
    id: 'tdee',
    term: 'TDEE',
    fullName: 'Total Daily Energy Expenditure (Суточный расход энергии)',
    category: 'metabolism',
    badge: 'Суточный Калораж',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    summary: 'Суммарное количество калорий, которое ваш организм сжигает за полные 24 часа.',
    description: 'TDEE складывается из базового метаболизма (BMR), бытовой активности (NEAT), тренировок (EAT) и переваривания пищи (TEF). В приложениях используется алгоритм динамического TDEE (модель MacroFactor EMA), который вычисляет ваш реальный расход по замеру массы и логам питания.',
    formulaOrRule: 'TDEE = BMR + NEAT + EAT + TEF'
  },
  {
    id: 'bmr',
    term: 'BMR',
    fullName: 'Basal Metabolic Rate (Базовый обмен веществ)',
    category: 'metabolism',
    badge: 'Базовый Затрат',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    summary: 'Энергия, необходимая организму в состоянии полного покоя для поддержания жизни.',
    description: 'Расход на работу сердца, легких, мозга, печени и поддержание температуры тела. В Brosky Gym вычисляется как среднее арифметическое двух эталонных формул: Mifflin-St Jeor (по росту/весу) и Katch-McArdle (по чистой сухой массе LBM).',
    formulaOrRule: 'Katch-McArdle: BMR = 370 + (21.6 × LBM в кг)'
  },
  {
    id: 'neat',
    term: 'NEAT',
    fullName: 'Non-Exercise Activity Thermogenesis (Бытовой термогенез)',
    category: 'metabolism',
    badge: 'Бытовая Активность',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    summary: 'Калории, сжигаемые во время любой активности вне специализированных тренировок.',
    description: 'Включает ходьбу (шаги по шагомеру), подъем по лестнице, прогулки, работу по дому и дачные дела. Составляет до 15-30% от общего суточного TDEE.',
    formulaOrRule: 'Авторасчет: каждые 1000 шагов добавляют ~45-55 ккал в зависимости от веса тела'
  },
  {
    id: 'eat',
    term: 'EAT',
    fullName: 'Exercise Activity Thermogenesis (Тренировочный термогенез)',
    category: 'metabolism',
    badge: 'Энергия Зала',
    badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    summary: 'Расход энергии непосредственно во время силовых и кардио тренировок в зале.',
    description: 'Рассчитывается динамически на основе суммарного поднятого тоннажа, количества подходов и длительности тренировочной сессии.',
  },
  {
    id: 'tef',
    term: 'TEF',
    fullName: 'Thermic Effect of Food (Термический эффект пищи)',
    category: 'metabolism',
    badge: 'Переваривание',
    badgeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    summary: 'Количество калорий, затрачиваемое организмом на переваривание и усвоение еды.',
    description: 'Белки имеют самый высокий TEF (до 20-30% калорий сгорает при переваривании), углеводы — 5-10%, жиры — 0-3%. По этой причине белковая диета ускоряет метаболизм.',
  },
  {
    id: 'ewma',
    term: 'EWMA',
    fullName: 'Exponentially Weighted Moving Average (Сглаженный тренд массы)',
    category: 'metabolism',
    badge: 'Математика Сглаживания',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    summary: 'Алгоритм экспоненциального сглаживания для отсечения шума и отеков воды.',
    description: 'Дневные взвешивания хаотичны из-за колебаний воды, задержки соли и содержимого ЖКТ. EWMA вычисляет истинный математический тренд массы с весовым коэффициентом alpha (0.25), исключая ложную панику при временных скачках веса.',
  },

  // 3. Анатомический объем и Зоны Восстановления
  {
    id: 'mev',
    term: 'MEV',
    fullName: 'Minimum Effective Volume (Минимальный эффективный объем)',
    category: 'volume',
    badge: 'Порог Роста',
    badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    summary: 'Наименьший недельный объем подходов на группу мышц, необходимый для стимуляции роста.',
    description: 'Нагрузка ниже MEV позволяет лишь поддерживать существующие мышцы, но не вызывает гипертрофии. Обычно составляет 6–10 тяжелых подходов в неделю на мышечную группу.',
  },
  {
    id: 'mav',
    term: 'MAV',
    fullName: 'Maximum Adaptive Volume (Максимальный адаптивный объем)',
    category: 'volume',
    badge: 'Золотой Стандарт',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    summary: 'Оптимальный диапазон нагрузки в неделю, обеспечивающий самый быстрый прирост мышц.',
    description: '«Сладкая точка» (Sweet Spot) гипертрофии. В этом диапазоне мышцы получают максимальный стимул при полном успевании восстановления. В среднем составляет 12–20 подходов в неделю.',
  },
  {
    id: 'mrv',
    term: 'MRV',
    fullName: 'Maximum Recoverable Volume (Предел восстановления)',
    category: 'volume',
    badge: 'Критический Предел',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    summary: 'Предельное количество подходов в неделю, которое ваше тело еще способно восстановить.',
    description: 'Превышение MRV ведет к хронической усталости, падению силовых и перетренированности. При достижении MRV необходимо провести разгрузочную неделю (Deload).',
  },

  // 4. Режимы и Фазы КБЖУ
  {
    id: 'refeed',
    term: 'Refeed',
    fullName: 'Углеводный рефид (Загрузочный день)',
    category: 'nutrition',
    badge: 'Прессет КБЖУ',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    summary: 'Загрузочный день с повышенным содержанием углеводов на дефиците или поддержке.',
    description: 'Динамический формульный пресет. Увеличивает калорийность на +10% от TDEE, максимизирует белки (2.2 г/кг) и урезает жиры до 15% в пользу сложных углеводов. Необходим для заполнения мышечного гликогена и нормализации лептина.',
  },
  {
    id: 'lchf',
    term: 'LCHF / Кето-день',
    fullName: 'Low-Carb High-Fat (Низкоуглеводный рацион)',
    category: 'nutrition',
    badge: 'Прессет КБЖУ',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    summary: 'Фиксированный низкоуглеводный режим с акцентом на полезные жиры и белок.',
    description: 'Строгие лимиты: 20г углеводов, 130г белков и 120г жиров. Оптимален для стимуляции липолиза, кето-адаптации и снижения уровня инсулина в крови.',
  },
  {
    id: 'fast',
    term: 'Fast / Разгрузка',
    fullName: 'Разгрузочный низкокалорийный день',
    category: 'nutrition',
    badge: 'Прессет КБЖУ',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    summary: 'Фиксированный разгрузочный рацион объемом 1300 ккал.',
    description: 'Фиксированные макросы: 1300 ккал (100г белков, 40г жиров, 135г углеводов). Применяется для разгрузки ЖКТ, оздоровления организма и преодоления диетического плато.',
  }
];

export const LexiconPanel: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'autopilot' | 'metabolism' | 'volume' | 'nutrition'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('rir');

  const filteredItems = useMemo(() => {
    return LEXICON_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.term.toLowerCase().includes(q) || 
        item.fullName.toLowerCase().includes(q) || 
        item.summary.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-white/70 border border-gym-border/80 shadow-xl backdrop-blur-md space-y-5">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gym-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gym-accent text-white rounded-2xl shadow-md shadow-gym-accent/20 flex items-center justify-center shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold font-display text-gray-900">
              Глоссарий и Справочник Терминов
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Полная расшифровка спортивно-научной терминологии, формул и алгоритмов Brosky Gym
            </p>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск термина (RIR, TDEE)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50/80 border border-gym-border/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-gym-accent focus:ring-2 focus:ring-gym-accent/10 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Category Segmented Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {[
          { id: 'all', label: 'Все термины', Icon: BookOpen },
          { id: 'autopilot', label: 'Силовой автопилот', Icon: Target },
          { id: 'metabolism', label: 'Метаболизм и TDEE', Icon: Activity },
          { id: 'volume', label: 'Объем & MEV/MRV', Icon: Dumbbell },
          { id: 'nutrition', label: 'Режимы КБЖУ', Icon: Scale },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as typeof activeCategory)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 btn-interactive ${
                isActive
                  ? 'bg-gym-accent text-white shadow-sm'
                  : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 border border-gym-border/50'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-gray-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Lexicon Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
          <BookOpen size={28} className="mx-auto text-gray-400 mb-2 opacity-50" />
          <p className="text-xs font-bold text-gray-500">По вашему запросу терминов не найдено</p>
          <span className="text-[11px] text-gray-400 block mt-1">Попробуйте ввести другой поиск или сбросить категории</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-white border-gym-accent/40 shadow-md ring-1 ring-gym-accent/15'
                    : 'bg-white/60 hover:bg-white border-gym-border/70 shadow-2xs'
                }`}
              >
                {/* Header Item */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full p-4 text-left cursor-pointer flex items-center justify-between gap-3 btn-interactive"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gym-accent/10 border border-gym-accent/20 flex items-center justify-center shrink-0">
                      <span className="font-extrabold text-xs font-mono text-gym-accent">
                        {item.term}
                      </span>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-gray-900 text-sm font-display truncate">
                          {item.fullName}
                        </h4>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate font-medium">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-gray-100/80 text-gray-500 shrink-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gym-border/40 space-y-3 bg-gray-50/40 animate-fadeIn">
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">
                      {item.description}
                    </p>

                    {item.formulaOrRule && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-gym-accent/5 via-purple-500/5 to-white border border-gym-accent/20 flex items-start gap-2 text-xs">
                        <Sparkles size={15} className="text-gym-accent mt-0.5 shrink-0" />
                        <span className="font-mono font-bold text-gray-800 leading-snug">
                          {item.formulaOrRule}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
