export interface FoodItemCatalog {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  baseWeight: number;
}

export const POPULAR_FOODS: FoodItemCatalog[] = [
  // Источники белка (курица, мясо, рыба, яйца, творог)
  { name: 'Куриное филе отварное', calories: 170, protein: 30, fat: 3.5, carbs: 0, baseWeight: 100 },
  { name: 'Индейка филе запеченное', calories: 145, protein: 25, fat: 3, carbs: 0, baseWeight: 100 },
  { name: 'Говядина постная тушеная', calories: 220, protein: 22, fat: 15, carbs: 0, baseWeight: 100 },
  { name: 'Свинина вырезка запеченная', calories: 180, protein: 20, fat: 11, carbs: 0, baseWeight: 100 },
  { name: 'Лосось (семга) на пару', calories: 197, protein: 21, fat: 12.3, carbs: 0, baseWeight: 100 },
  { name: 'Тунец консервированный в собств. соку', calories: 96, protein: 21.5, fat: 1, carbs: 0, baseWeight: 100 },
  { name: 'Минтай отварной', calories: 79, protein: 17.2, fat: 0.9, carbs: 0, baseWeight: 100 },
  { name: 'Креветки вареные', calories: 95, protein: 19, fat: 1.5, carbs: 0, baseWeight: 100 },
  { name: 'Яйцо куриное вареное (1 шт ~55г)', calories: 155, protein: 12.6, fat: 10.6, carbs: 0.8, baseWeight: 100 },
  { name: 'Белок яичный вареный', calories: 44, protein: 11.1, fat: 0.2, carbs: 0.7, baseWeight: 100 },
  { name: 'Творог 5%', calories: 121, protein: 17.2, fat: 5, carbs: 1.8, baseWeight: 100 },
  { name: 'Творог обезжиренный 0.2%', calories: 78, protein: 16.5, fat: 0.2, carbs: 2, baseWeight: 100 },
  { name: 'Сыр легкий 15%', calories: 260, protein: 30, fat: 15, carbs: 0, baseWeight: 100 },
  { name: 'Сыр Пармезан', calories: 392, protein: 35.7, fat: 25.8, carbs: 3.2, baseWeight: 100 },
  { name: 'Йогурт греческий 2%', calories: 73, protein: 8, fat: 2, carbs: 3.5, baseWeight: 100 },
  { name: 'Молоко 2.5%', calories: 52, protein: 2.8, fat: 2.5, carbs: 4.7, baseWeight: 100 },
  { name: 'Кефир 1%', calories: 40, protein: 3, fat: 1, carbs: 4, baseWeight: 100 },

  // Источники углеводов (крупы, макароны, хлеб, картофель)
  { name: 'Гречневая каша вареная', calories: 110, protein: 4, fat: 1, carbs: 21, baseWeight: 100 },
  { name: 'Рис белый вареный', calories: 130, protein: 2.7, fat: 0.3, carbs: 28, baseWeight: 100 },
  { name: 'Рис бурый вареный', calories: 111, protein: 2.6, fat: 0.9, carbs: 23, baseWeight: 100 },
  { name: 'Макароны твердых сортов вареные', calories: 140, protein: 5, fat: 0.5, carbs: 28, baseWeight: 100 },
  { name: 'Овсяная каша на воде', calories: 88, protein: 3, fat: 1.7, carbs: 15, baseWeight: 100 },
  { name: 'Киноа вареная', calories: 120, protein: 4.4, fat: 1.9, carbs: 21.3, baseWeight: 100 },
  { name: 'Булгур вареный', calories: 83, protein: 3, fat: 0.2, carbs: 18.6, baseWeight: 100 },
  { name: 'Картофель отварной', calories: 82, protein: 2, fat: 0.4, carbs: 16.7, baseWeight: 100 },
  { name: 'Хлеб ржаной', calories: 215, protein: 6.5, fat: 1.2, carbs: 42, baseWeight: 100 },
  { name: 'Хлеб цельнозерновой', calories: 247, protein: 11, fat: 3.5, carbs: 41, baseWeight: 100 },
  { name: 'Хлеб пшеничный (батон)', calories: 262, protein: 7.5, fat: 2.9, carbs: 50.9, baseWeight: 100 },
  { name: 'Хлебцы ржаные', calories: 310, protein: 10, fat: 2, carbs: 61, baseWeight: 100 },

  // Жиры и орехи
  { name: 'Масло оливковое', calories: 884, protein: 0, fat: 99.8, carbs: 0, baseWeight: 100 },
  { name: 'Масло сливочное 82.5%', calories: 748, protein: 0.5, fat: 82.5, carbs: 0.8, baseWeight: 100 },
  { name: 'Авокадо', calories: 160, protein: 2, fat: 14.7, carbs: 1.8, baseWeight: 100 },
  { name: 'Арахисовая паста', calories: 590, protein: 24, fat: 50, carbs: 12, baseWeight: 100 },
  { name: 'Миндаль орех', calories: 579, protein: 21.2, fat: 49.9, carbs: 21.6, baseWeight: 100 },
  { name: 'Грецкий орех', calories: 654, protein: 15.2, fat: 65.2, carbs: 13.7, baseWeight: 100 },
  { name: 'Кешью орех', calories: 553, protein: 18.2, fat: 43.8, carbs: 30.2, baseWeight: 100 },

  // Овощи и зелень (клетчатка)
  { name: 'Помидоры (томаты)', calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, baseWeight: 100 },
  { name: 'Огурцы свежие', calories: 15, protein: 0.8, fat: 0.1, carbs: 2.8, baseWeight: 100 },
  { name: 'Брокколи отварная', calories: 35, protein: 2.4, fat: 0.4, carbs: 6.6, baseWeight: 100 },
  { name: 'Цветная капуста отварная', calories: 25, protein: 1.9, fat: 0.3, carbs: 5, baseWeight: 100 },
  { name: 'Капуста белокочанная свежая', calories: 25, protein: 1.8, fat: 0.1, carbs: 4.7, baseWeight: 100 },
  { name: 'Болгарский перец красный', calories: 26, protein: 1.3, fat: 0.1, carbs: 5.3, baseWeight: 100 },
  { name: 'Морковь свежая', calories: 41, protein: 0.9, fat: 0.2, carbs: 9.6, baseWeight: 100 },
  { name: 'Шпинат свежий', calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, baseWeight: 100 },
  { name: 'Салат листовой', calories: 15, protein: 1.2, fat: 0.2, carbs: 2.9, baseWeight: 100 },

  // Фрукты и ягоды
  { name: 'Банан', calories: 96, protein: 1.5, fat: 0.2, carbs: 22, baseWeight: 100 },
  { name: 'Яблоко зеленое', calories: 52, protein: 0.3, fat: 0.2, carbs: 12, baseWeight: 100 },
  { name: 'Груша конфер', calories: 47, protein: 0.4, fat: 0.3, carbs: 10.3, baseWeight: 100 },
  { name: 'Апельсин', calories: 47, protein: 0.9, fat: 0.2, carbs: 10.3, baseWeight: 100 },
  { name: 'Грейпфрут', calories: 35, protein: 0.7, fat: 0.2, carbs: 8, baseWeight: 100 },
  { name: 'Клубника свежая', calories: 32, protein: 0.7, fat: 0.3, carbs: 7.7, baseWeight: 100 },
  { name: 'Черника свежая', calories: 57, protein: 0.7, fat: 0.3, carbs: 14.5, baseWeight: 100 },

  // Готовые блюда и спортивное питание
  { name: 'Протеиновый концентрат сывороточный', calories: 400, protein: 80, fat: 5, carbs: 10, baseWeight: 100 },
  { name: 'Борщ домашний со свининой', calories: 96, protein: 4.5, fat: 6.8, carbs: 4.2, baseWeight: 100 },
  { name: 'Суп куриный с лапшой', calories: 45, protein: 3.2, fat: 1.8, carbs: 4, baseWeight: 100 },
  { name: 'Сырники из творога (жареные)', calories: 220, protein: 15, fat: 9, carbs: 19.5, baseWeight: 100 },
  { name: 'Котлета куриная паровая', calories: 135, protein: 18.5, fat: 5, carbs: 4, baseWeight: 100 },
  { name: 'Шаурма с курицей (готовая)', calories: 175, protein: 9, fat: 8.5, carbs: 15.5, baseWeight: 100 },
  { name: 'Салат Цезарь с курицей', calories: 150, protein: 11, fat: 9.5, carbs: 5.2, baseWeight: 100 },
  { name: 'Салат томаты/огурцы с оливковым маслом', calories: 90, protein: 0.8, fat: 8, carbs: 3.8, baseWeight: 100 },
];
