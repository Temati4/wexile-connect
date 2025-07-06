# 🚀 Wexile Connect

<p align="center">
  <img src="https://img.shields.io/badge/Electron-Modern-blueviolet?logo=electron&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Themeable-20+_Themes-8b5cf6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Localization-EN%20%7C%20RU-22c55e?style=for-the-badge" />
  <img src="https://img.shields.io/github/license/Temati4/wexile-connect?style=for-the-badge" />
</p>

---

> **Wexile Connect** — это современное, стильное и компактное приложение для управления VPN-подключениями WireGuard на Windows. Максимум удобства, минимум лишнего!

---

## ✨ Основные возможности

- 🔥 **WireGuard only**: Быстрое подключение через рекомендуемый или любой свой конфиг
- 🎨 **20+ тем**: Мгновенное переключение, красивые градиенты, поддержка кастомных цветов
- 🌗 **Glassmorphism UI**: Современный дизайн с плавными анимациями и эффектами
- 🌍 **Локализация**: Русский и английский языки, мгновенное переключение
- 🖥️ **Компактный размер**: Окно 500x500, идеально для любого рабочего стола
- 🧩 **Вкладки**: Подключение, настройки, информация — всё под рукой
- 💾 **Автоматическое сохранение**: Все настройки темы и языка сохраняются между сессиями
- 🧑‍💻 **Открытый исходный код**: Легко доработать под свои задачи

---

## 🖼️ Скриншоты

![image](https://github.com/user-attachments/assets/ed583611-650d-4d4f-a1c6-80a784378a32)

![image](https://github.com/user-attachments/assets/daade601-ad96-45e0-906f-38b162b70233)

---

## ⚡ Быстрый старт

### 1. Клонируйте репозиторий
```bash
git clone https://github.com/Temati4/wexile-connect.git
cd wexile-connect
```

### 2. Установите зависимости
```bash
npm install
```

### 3. Запустите приложение в режиме разработки
```bash
npm start
```

### 4. Сборка для Windows
```bash
npm run build
```

> **WireGuard и конфиги должны быть в папке `resources/wireguard`!**

---

## 🎨 Темы оформления

- Более 20 уникальных тем: Midnight, Magenta, Lime, Gold, Graphite, Pink, Brown, Indigo, Lavender, Mint, Sand, Silver, Neon, Peach, Olive, Ice, Coral, Violet, Steel, Bronze и другие
- Переключение темы — в один клик в настройках
- Все элементы интерфейса мгновенно подстраиваются под выбранную тему

---

## 🌍 Локализация

- 🇷🇺 Русский
- 🇬🇧 English
- Переключение языка — в настройках
- Все тексты и подписи мгновенно обновляются

---

## 🛠️ Использование

1. **Выберите режим**: Рекомендованный (wg0.conf) или вручную (любой .conf)
2. **Нажмите "Подключиться"**
3. **В ручном режиме** выберите нужный конфиг из списка
4. **Отключение** — та же кнопка

> Для работы с WireGuard требуется запуск приложения с правами администратора!

---

## 🧑‍💻 Для разработчиков

- Весь UI — в папке `ui/`
- Основная логика Electron — в `main.js`
- Темы и локализация — в `ui/renderer.js` и `ui/styles.css`
- Стилизация скроллбаров, select, option — полностью кастомная
- Легко добавить свои темы, языки, вкладки

---

## 🤝 Вклад в проект

Будем рады вашим PR, идеям и багрепортам!

- Оформляйте Pull Request с описанием изменений
- Пишите баги и предложения в Issues
- Приветствуются новые темы, языки, UI-улучшения

---

## ❓ FAQ

**Q:** Можно ли использовать только WireGuard?  
**A:** Да, приложение поддерживает только WireGuard.

**Q:** Как добавить свой конфиг?  
**A:** Просто положите .conf файл в папку `resources/wireguard` — он появится в списке.

**Q:** Как добавить свою тему?  
**A:** Добавьте новую тему в массив THEMES и пропишите цвета в `styles.css`.

**Q:** Почему нужна админ-права?  
**A:** WireGuard требует прав администратора для управления сервисом.

---

## 🏆 Благодарности

- [WireGuard](https://www.wireguard.com/) — за быстрый и безопасный VPN
- [Electron](https://www.electronjs.org/) — за кроссплатформенный фреймворк
- [Manrope](https://manropefont.com/) — за современный шрифт
- Всем, кто помогает делать Wexile Connect лучше!

---

<p align="center">
  <b>Wexile Connect — стиль, удобство, безопасность.</b><br>
  <a href="https://github.com/Temati4/wexile-connect">GitHub проекта</a>
</p> 
