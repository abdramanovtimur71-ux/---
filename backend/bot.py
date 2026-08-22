"""
Telegram-бот автоворонки продаж для Rose Ogly.

Команды:
  /start   — приветствие + воронка
  /menu    — каталог курсов
  /buy <id>— купить курс
  /myorders— мои покупки
  /reviews — отзывы
  /diagnostics — бесплатная диагностика
  /admin   — панель администратора (только для владельца)
"""

import asyncio
import logging
import os

from aiogram import Bot, Dispatcher, F, Router
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    CallbackQuery,
    ContentType,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    LabeledPrice,
    Message,
    PreCheckoutQuery,
    ReplyKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardRemove,
)
from dotenv import load_dotenv

import bot_database as db

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
PAYMENT_PROVIDER_TOKEN = os.getenv("PAYMENT_PROVIDER_TOKEN", "")  # от @BotFather
ADMIN_TG_ID = int(os.getenv("ADMIN_TG_ID", "0"))
KASPI_QR_LINK = os.getenv("KASPI_QR_LINK", "")  # ваша ссылка на QR Kaspi

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

router = Router()

# ─────────────────────────── FSM States ───────────────────────────────────────

class DiagFSM(StatesGroup):
    q1 = State()
    q2 = State()
    q3 = State()

class AdminFSM(StatesGroup):
    waiting_product_id = State()
    waiting_file = State()
    waiting_link = State()

# ─────────────────────────── Helpers ──────────────────────────────────────────

def fmt_price(tiyyn: int) -> str:
    return f"{tiyyn // 100:,} ₸".replace(",", " ")


def product_keyboard(products) -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(
            text=f"{p['title']} — {fmt_price(p['price'])}",
            callback_data=f"buy:{p['id']}"
        )]
        for p in products
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def pay_keyboard(order_id: int, product_id: int, has_telegram_pay: bool, has_kaspi: bool) -> InlineKeyboardMarkup:
    buttons = []
    if has_telegram_pay:
        buttons.append([InlineKeyboardButton(text="💳 Оплатить картой (Telegram Pay)", callback_data=f"tgpay:{order_id}:{product_id}")])
    if has_kaspi:
        buttons.append([InlineKeyboardButton(text="🟡 Оплатить через Kaspi QR", callback_data=f"kaspi:{order_id}:{product_id}")])
    buttons.append([InlineKeyboardButton(text="❌ Отмена", callback_data="cancel")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def admin_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Статистика", callback_data="admin:stats")],
        [InlineKeyboardButton(text="📦 Загрузить файл курса", callback_data="admin:upload")],
        [InlineKeyboardButton(text="📋 Список курсов", callback_data="admin:products")],
        [InlineKeyboardButton(text="👥 Список пользователей", callback_data="admin:users")],
        [InlineKeyboardButton(text="📢 Рассылка", callback_data="admin:broadcast")],
    ])

# ─────────────────────────── /start ───────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(msg: Message, state: FSMContext):
    await state.clear()
    db.upsert_user(msg.from_user.id, msg.from_user.username, msg.from_user.full_name)

    text = (
        "🌙 *Добро пожаловать!*\n\n"
        "Я — консультант Матрицы Судьбы, специалист по нумерологии и матрице судьбы с 15-летним опытом.\n\n"
        "Помогаю:\n"
        "▸ Найти ответы на важные вопросы\n"
        "▸ Очистить энергетику дома и себя\n"
        "▸ Освободиться от привязанностей\n\n"
        "Выберите действие:"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔮 Каталог курсов", callback_data="show_menu")],
        [InlineKeyboardButton(text="✨ Бесплатная диагностика", callback_data="diagnostics")],
        [InlineKeyboardButton(text="⭐ Отзывы клиентов", callback_data="reviews")],
    ])
    await msg.answer(text, reply_markup=kb, parse_mode="Markdown")

# ─────────────────────────── /menu ────────────────────────────────────────────

@router.message(Command("menu"))
@router.callback_query(F.data == "show_menu")
async def cmd_menu(event: Message | CallbackQuery):
    products = db.get_products()
    text = "📚 *Каталог услуг и курсов:*\n\nВыберите, что вас интересует:"
    kb = product_keyboard(products)
    if isinstance(event, CallbackQuery):
        await event.message.answer(text, reply_markup=kb, parse_mode="Markdown")
        await event.answer()
    else:
        await event.answer(text, reply_markup=kb, parse_mode="Markdown")

# ─────────────────────────── Просмотр продукта ────────────────────────────────

@router.callback_query(F.data.startswith("buy:"))
async def show_product(call: CallbackQuery):
    product_id = int(call.data.split(":")[1])
    p = db.get_product(product_id)
    if not p:
        await call.answer("Продукт не найден", show_alert=True)
        return

    text = (
        f"*{p['title']}*\n\n"
        f"{p['description']}\n\n"
        f"💰 Стоимость: *{fmt_price(p['price'])}*"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Купить", callback_data=f"confirm_buy:{product_id}")],
        [InlineKeyboardButton(text="◀️ Назад", callback_data="show_menu")],
    ])
    await call.message.answer(text, reply_markup=kb, parse_mode="Markdown")
    await call.answer()

# ─────────────────────────── Подтверждение и оплата ───────────────────────────

@router.callback_query(F.data.startswith("confirm_buy:"))
async def confirm_buy(call: CallbackQuery):
    product_id = int(call.data.split(":")[1])
    p = db.get_product(product_id)
    if not p:
        await call.answer("Ошибка", show_alert=True)
        return

    order_id = db.create_order(call.from_user.id, product_id, p["price"], "pending")
    has_tg_pay = bool(PAYMENT_PROVIDER_TOKEN)
    has_kaspi = bool(KASPI_QR_LINK)

    text = (
        f"🛒 *Оформление заказа #{order_id}*\n\n"
        f"Товар: {p['title']}\n"
        f"Сумма: *{fmt_price(p['price'])}*\n\n"
        "Выберите способ оплаты:"
    )
    kb = pay_keyboard(order_id, product_id, has_tg_pay, has_kaspi)
    await call.message.answer(text, reply_markup=kb, parse_mode="Markdown")
    await call.answer()

# ─── Telegram Payments ────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("tgpay:"))
async def tgpay(call: CallbackQuery, bot: Bot):
    _, order_id, product_id = call.data.split(":")
    p = db.get_product(int(product_id))
    if not p or not PAYMENT_PROVIDER_TOKEN:
        await call.answer("Оплата картой временно недоступна", show_alert=True)
        return

    await bot.send_invoice(
        chat_id=call.from_user.id,
        title=p["title"],
        description=p["description"] or "Курс от Розы Оглы",
        payload=f"order:{order_id}",
        provider_token=PAYMENT_PROVIDER_TOKEN,
        currency="KZT",
        prices=[LabeledPrice(label=p["title"], amount=p["price"])],
        start_parameter=f"order_{order_id}",
    )
    await call.answer()


@router.pre_checkout_query()
async def pre_checkout(query: PreCheckoutQuery):
    await query.answer(ok=True)


@router.message(F.content_type == ContentType.SUCCESSFUL_PAYMENT)
async def successful_payment(msg: Message, bot: Bot):
    payload = msg.successful_payment.invoice_payload  # "order:123"
    order_id = int(payload.split(":")[1])
    charge_id = msg.successful_payment.provider_payment_charge_id
    db.mark_order_paid(order_id, charge_id)
    await deliver_product(msg.from_user.id, order_id, bot)

# ─── Kaspi QR ─────────────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("kaspi:"))
async def kaspi_pay(call: CallbackQuery):
    _, order_id, product_id = call.data.split(":")
    p = db.get_product(int(product_id))
    amount = p["price"] // 100 if p else "—"

    text = (
        f"🟡 *Оплата через Kaspi*\n\n"
        f"Сумма к оплате: *{amount} ₸*\n\n"
        f"1. Откройте Kaspi.kz\n"
        f"2. Перейдите по ссылке или отсканируйте QR: {KASPI_QR_LINK}\n"
        f"3. Переведите точную сумму\n"
        f"4. Нажмите кнопку ниже и пришлите скриншот"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Я оплатил(а)", callback_data=f"kaspi_confirm:{order_id}")],
    ])
    await call.message.answer(text, reply_markup=kb, parse_mode="Markdown")
    await call.answer()


@router.callback_query(F.data.startswith("kaspi_confirm:"))
async def kaspi_confirm(call: CallbackQuery):
    order_id = int(call.data.split(":")[1])
    order = db.get_order(order_id)
    if not order:
        await call.answer("Заказ не найден", show_alert=True)
        return

    db.mark_order_paid(order_id, "kaspi_manual")
    await call.message.answer(
        "✅ *Оплата получена!*\n\n"
        "Ваш продукт уже готовится к выдаче.\n"
        "Администратор подтвердит и пришлёт материалы в течение нескольких минут.\n\n"
        "Если что-то пошло не так — напишите /help",
        parse_mode="Markdown",
    )
    # Уведомить администратора для ручного подтверждения
    if ADMIN_TG_ID:
        await call.bot.send_message(
            ADMIN_TG_ID,
            f"💰 *Новая оплата (Kaspi)!*\n\n"
            f"Заказ #{order_id}\n"
            f"Пользователь: {call.from_user.full_name} (@{call.from_user.username})\n"
            f"ID: `{call.from_user.id}`\n\n"
            f"Нажмите чтобы выдать продукт: /deliver_{order_id}",
            parse_mode="Markdown",
        )
    await call.answer()

# ─────────────────────────── Выдача продукта ──────────────────────────────────

async def deliver_product(tg_id: int, order_id: int, bot: Bot):
    order = db.get_order(order_id)
    if not order:
        return
    p = db.get_product(order["product_id"])
    if not p:
        return

    db.mark_order_delivered(order_id)

    await bot.send_message(
        tg_id,
        f"🎉 *Поздравляем с покупкой!*\n\n"
        f"📦 *{p['title']}*\n\n"
        f"Ваши материалы:",
        parse_mode="Markdown",
    )

    if p["file_id"]:
        if p["file_type"] == "video":
            await bot.send_video(tg_id, p["file_id"], caption=p["title"])
        elif p["file_type"] == "link":
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔗 Открыть курс", url=p["file_id"])]
            ])
            await bot.send_message(tg_id, "👆 Нажмите кнопку для доступа к курсу:", reply_markup=kb)
        else:
            await bot.send_document(tg_id, p["file_id"], caption=p["title"])
    else:
        await bot.send_message(
            tg_id,
            "⏳ Материалы готовятся и будут отправлены администратором в ближайшее время.",
        )

    # Уведомить администратора
    if ADMIN_TG_ID:
        await bot.send_message(
            ADMIN_TG_ID,
            f"✅ Продукт выдан пользователю `{tg_id}` (заказ #{order_id})",
            parse_mode="Markdown",
        )

# ─────────────────────────── /deliver_ID (admin) ──────────────────────────────

@router.message(Command(commands=["deliver"]))
async def admin_deliver(msg: Message, bot: Bot):
    if msg.from_user.id != ADMIN_TG_ID:
        return
    try:
        order_id = int(msg.text.split("_")[1])
    except (IndexError, ValueError):
        await msg.answer("Использование: /deliver_<order_id>")
        return
    order = db.get_order(order_id)
    if not order:
        await msg.answer("Заказ не найден")
        return
    await deliver_product(order["tg_id"], order_id, bot)
    await msg.answer(f"✅ Продукт выдан по заказу #{order_id}")

# ─────────────────────────── /myorders ────────────────────────────────────────

@router.message(Command("myorders"))
async def cmd_myorders(msg: Message):
    orders = db.get_user_orders(msg.from_user.id)
    if not orders:
        await msg.answer(
            "У вас пока нет покупок.\n\n"
            "Посмотрите каталог: /menu"
        )
        return
    lines = ["📋 *Мои покупки:*\n"]
    for o in orders:
        status_icon = {"pending": "⏳", "paid": "💳", "delivered": "✅"}.get(o["status"], "❓")
        lines.append(f"{status_icon} *{o['title']}* — {fmt_price(o['amount'])}")
    await msg.answer("\n".join(lines), parse_mode="Markdown")

# ─────────────────────────── /reviews ─────────────────────────────────────────

@router.message(Command("reviews"))
@router.callback_query(F.data == "reviews")
async def cmd_reviews(event: Message | CallbackQuery):
    text = (
        "⭐⭐⭐⭐⭐ *Отзывы клиентов:*\n\n"
        "👤 *Айгерим, Алматы:*\n"
        "_«Роза помогла мне разобраться в сложной ситуации с работой. "
        "После сеанса я приняла правильное решение и всё пошло в гору!»_\n\n"
        "👤 *Дамир, Астана:*\n"
        "_«Прошёл курс по работе с духами — это изменило моё восприятие мира."
        " Рекомендую всем открытым людям.»_\n\n"
        "👤 *Жанна, Шымкент:*\n"
        "_«VIP-пакет — лучшее вложение в себя! Энергия дома изменилась "
        "полностью уже после первого урока.»_\n\n"
        "Хотите тоже? /menu"
    )
    if isinstance(event, CallbackQuery):
        await event.message.answer(text, parse_mode="Markdown")
        await event.answer()
    else:
        await event.answer(text, parse_mode="Markdown")

# ─────────────────────────── Бесплатная диагностика ───────────────────────────

@router.message(Command("diagnostics"))
@router.callback_query(F.data == "diagnostics")
async def cmd_diagnostics(event: Message | CallbackQuery, state: FSMContext):
    await state.set_state(DiagFSM.q1)
    text = (
        "✨ *Бесплатная мини-диагностика*\n\n"
        "Отвечу на 3 вопроса и покажу, что блокирует вашу энергию прямо сейчас.\n\n"
        "❓ *Вопрос 1/3:*\n"
        "Как вы себя чувствуете последнее время?\n\n"
        "1️⃣ — Постоянно устаю\n"
        "2️⃣ — Чувствую тревогу\n"
        "3️⃣ — Не могу двигаться вперёд\n"
        "4️⃣ — Всё хорошо"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="1️⃣", callback_data="diag:q1:1"),
            InlineKeyboardButton(text="2️⃣", callback_data="diag:q1:2"),
            InlineKeyboardButton(text="3️⃣", callback_data="diag:q1:3"),
            InlineKeyboardButton(text="4️⃣", callback_data="diag:q1:4"),
        ]
    ])
    if isinstance(event, CallbackQuery):
        await event.message.answer(text, reply_markup=kb, parse_mode="Markdown")
        await event.answer()
    else:
        await event.answer(text, reply_markup=kb, parse_mode="Markdown")


@router.callback_query(F.data.startswith("diag:q1:"), DiagFSM.q1)
async def diag_q2(call: CallbackQuery, state: FSMContext):
    await state.update_data(q1=call.data.split(":")[2])
    await state.set_state(DiagFSM.q2)
    text = (
        "❓ *Вопрос 2/3:*\n\n"
        "Как давно у вас это состояние?\n\n"
        "1️⃣ — Несколько дней\n"
        "2️⃣ — Несколько недель\n"
        "3️⃣ — Несколько месяцев\n"
        "4️⃣ — Год и более"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="1️⃣", callback_data="diag:q2:1"),
            InlineKeyboardButton(text="2️⃣", callback_data="diag:q2:2"),
            InlineKeyboardButton(text="3️⃣", callback_data="diag:q2:3"),
            InlineKeyboardButton(text="4️⃣", callback_data="diag:q2:4"),
        ]
    ])
    await call.message.answer(text, reply_markup=kb, parse_mode="Markdown")
    await call.answer()


@router.callback_query(F.data.startswith("diag:q2:"), DiagFSM.q2)
async def diag_q3(call: CallbackQuery, state: FSMContext):
    await state.update_data(q2=call.data.split(":")[2])
    await state.set_state(DiagFSM.q3)
    text = (
        "❓ *Вопрос 3/3:*\n\n"
        "Что сейчас для вас важнее всего изменить?\n\n"
        "1️⃣ — Отношения\n"
        "2️⃣ — Деньги и работу\n"
        "3️⃣ — Здоровье\n"
        "4️⃣ — Внутренний покой"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="1️⃣", callback_data="diag:q3:1"),
            InlineKeyboardButton(text="2️⃣", callback_data="diag:q3:2"),
            InlineKeyboardButton(text="3️⃣", callback_data="diag:q3:3"),
            InlineKeyboardButton(text="4️⃣", callback_data="diag:q3:4"),
        ]
    ])
    await call.message.answer(text, reply_markup=kb, parse_mode="Markdown")
    await call.answer()


@router.callback_query(F.data.startswith("diag:q3:"), DiagFSM.q3)
async def diag_result(call: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    await state.clear()

    results = {
        ("1", "3", "1"): ("💔 Энергетическая блокировка в сфере отношений",
                          "Вам необходима чистка родовых программ и таро-диагностика."),
        ("2", "3", "2"): ("💸 Денежный блок",
                          "Застой в финансах часто связан с негативными установками предков."),
    }
    q1, q2 = data.get("q1", "1"), data.get("q2", "1")
    q3 = call.data.split(":")[2]
    title, advice = results.get((q1, q2, q3), (
        "🌙 Смешанная энергетическая блокировка",
        "В вашей ситуации я вижу сразу несколько уровней, требующих работы."
    ))

    text = (
        f"🔮 *Результат диагностики:*\n\n"
        f"*{title}*\n\n"
        f"{advice}\n\n"
        f"Хотите узнать подробнее и получить персональный план?\n"
        f"Запишитесь на полную консультацию:"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📚 Смотреть каталог", callback_data="show_menu")],
        [InlineKeyboardButton(text="🔮 Таро-диагностика", callback_data="buy:1")],
    ])
    await call.message.answer(text, reply_markup=kb, parse_mode="Markdown")
    await call.answer()

# ─────────────────────────── /admin ───────────────────────────────────────────

@router.message(Command("admin"))
async def cmd_admin(msg: Message):
    if msg.from_user.id != ADMIN_TG_ID:
        await msg.answer("🚫 Доступ закрыт.")
        return
    await msg.answer("🔧 *Панель администратора*", reply_markup=admin_keyboard(), parse_mode="Markdown")


@router.callback_query(F.data == "admin:stats")
async def admin_stats(call: CallbackQuery):
    if call.from_user.id != ADMIN_TG_ID:
        await call.answer("Нет доступа", show_alert=True)
        return
    s = db.get_stats()
    text = (
        f"📊 *Статистика бота:*\n\n"
        f"👥 Пользователей: *{s['total_users']}*\n"
        f"🛒 Всего заказов: *{s['total_orders']}*\n"
        f"📅 Заказов сегодня: *{s['orders_today']}*\n"
        f"💰 Оплачено: *{s['total_paid_kzt']:,} ₸*\n".replace(",", " ")
    )
    await call.message.answer(text, parse_mode="Markdown")
    await call.answer()


@router.callback_query(F.data == "admin:products")
async def admin_products(call: CallbackQuery):
    if call.from_user.id != ADMIN_TG_ID:
        await call.answer("Нет доступа", show_alert=True)
        return
    products = db.get_products()
    lines = ["📦 *Курсы и продукты:*\n"]
    for p in products:
        has_file = "✅" if p["file_id"] else "❌"
        lines.append(f"[{p['id']}] {has_file} *{p['title']}*\n    {fmt_price(p['price'])}")
    lines.append("\nДля загрузки файла: /upload_<id>")
    await call.message.answer("\n".join(lines), parse_mode="Markdown")
    await call.answer()


@router.callback_query(F.data == "admin:upload")
async def admin_upload_prompt(call: CallbackQuery):
    if call.from_user.id != ADMIN_TG_ID:
        await call.answer("Нет доступа", show_alert=True)
        return
    products = db.get_products()
    lines = ["Выберите ID курса командой /upload_<id>:\n"]
    for p in products:
        lines.append(f"  /upload_{p['id']} — {p['title']}")
    await call.message.answer("\n".join(lines))
    await call.answer()


@router.message(Command(commands=["upload"]))
async def admin_upload_start(msg: Message, state: FSMContext):
    if msg.from_user.id != ADMIN_TG_ID:
        return
    try:
        product_id = int(msg.text.split("_")[1])
    except (IndexError, ValueError):
        await msg.answer("Использование: /upload_<product_id>")
        return
    p = db.get_product(product_id)
    if not p:
        await msg.answer("Продукт не найден")
        return
    await state.set_state(AdminFSM.waiting_file)
    await state.update_data(product_id=product_id)

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔗 Добавить ссылку", callback_data=f"admin:addlink:{product_id}")],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="cancel")],
    ])
    await msg.answer(
        f"📤 Загрузка файла для: *{p['title']}*\n\n"
        f"Отправьте файл (PDF, видео) или нажмите кнопку для добавления ссылки:",
        reply_markup=kb,
        parse_mode="Markdown",
    )


@router.callback_query(F.data.startswith("admin:addlink:"))
async def admin_add_link_prompt(call: CallbackQuery, state: FSMContext):
    product_id = int(call.data.split(":")[2])
    await state.set_state(AdminFSM.waiting_link)
    await state.update_data(product_id=product_id)
    await call.message.answer("🔗 Отправьте ссылку (например, на Google Drive, Notion, сайт):")
    await call.answer()


@router.message(AdminFSM.waiting_link)
async def admin_save_link(msg: Message, state: FSMContext):
    data = await state.get_data()
    product_id = data["product_id"]
    url = msg.text.strip()
    if not url.startswith("http"):
        await msg.answer("❌ Некорректная ссылка. Должна начинаться с http/https")
        return
    db.update_product_file(product_id, url, "link")
    await state.clear()
    await msg.answer(f"✅ Ссылка сохранена для продукта #{product_id}")


@router.message(AdminFSM.waiting_file)
async def admin_save_file(msg: Message, state: FSMContext):
    data = await state.get_data()
    product_id = data["product_id"]

    file_id = None
    file_type = "document"

    if msg.document:
        file_id = msg.document.file_id
        file_type = "document"
    elif msg.video:
        file_id = msg.video.file_id
        file_type = "video"

    if not file_id:
        await msg.answer("❌ Пожалуйста, пришлите файл (PDF или видео).")
        return

    db.update_product_file(product_id, file_id, file_type)
    await state.clear()
    await msg.answer(f"✅ Файл сохранён для продукта #{product_id}")


@router.callback_query(F.data == "admin:users")
async def admin_users(call: CallbackQuery):
    if call.from_user.id != ADMIN_TG_ID:
        await call.answer("Нет доступа", show_alert=True)
        return
    s = db.get_stats()
    await call.message.answer(f"👥 Всего пользователей: *{s['total_users']}*", parse_mode="Markdown")
    await call.answer()


@router.callback_query(F.data == "admin:broadcast")
async def admin_broadcast_prompt(call: CallbackQuery, state: FSMContext):
    if call.from_user.id != ADMIN_TG_ID:
        await call.answer("Нет доступа", show_alert=True)
        return
    await call.message.answer(
        "📢 Отправьте сообщение для рассылки всем пользователям:\n_(следующее ваше сообщение будет разослано)_",
        parse_mode="Markdown",
    )
    await state.set_state(AdminFSM.waiting_product_id)  # reuse state as broadcast step
    await state.update_data(broadcast=True)
    await call.answer()


@router.callback_query(F.data == "cancel")
async def cancel(call: CallbackQuery, state: FSMContext):
    await state.clear()
    await call.message.answer("❌ Отменено.")
    await call.answer()

# ─────────────────────────── Приветствие ──────────────────────────────────────

GREETING_WORDS = {"привет", "хай", "здравствуй", "здравствуйте", "добрый", "доброе", "hi", "hello", "салам"}

def _is_greeting(msg: Message) -> bool:
    words = (msg.text or "").lower().strip().split()
    return bool(words) and words[0] in GREETING_WORDS


@router.message(F.text, _is_greeting)
async def handle_greeting(msg: Message, state: FSMContext):
    if await state.get_state() is not None:
        return
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔮 Каталог курсов", callback_data="show_menu")],
        [InlineKeyboardButton(text="✨ Бесплатная диагностика", callback_data="diagnostics")],
        [InlineKeyboardButton(text="⭐ Отзывы клиентов", callback_data="reviews")],
    ])
    await msg.answer("Привет! Как я могу помочь вам сегодня?", reply_markup=kb)

# ─────────────────────────── Воронка (фоновая задача) ─────────────────────────

async def funnel_worker(bot: Bot):
    """Фоновая задача: отправляет сообщения воронки по расписанию."""
    while True:
        try:
            messages = db.get_funnel_messages()
            for fm in messages:
                step, text, delay = fm["step"], fm["text"], fm["delay_hours"]
                users = db.users_pending_funnel(step, delay)
                for row in users:
                    tg_id = row["tg_id"]
                    try:
                        await bot.send_message(tg_id, text, parse_mode="Markdown")
                        db.record_funnel_send(tg_id, step)
                        db.set_funnel_step(tg_id, step + 1)
                    except Exception as e:
                        log.warning(f"Funnel send failed for {tg_id}: {e}")
        except Exception as e:
            log.error(f"Funnel worker error: {e}")
        await asyncio.sleep(300)  # проверять каждые 5 минут

# ─────────────────────────── ИИ-ответы ───────────────────────────────────────

_OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")

_BOT_SYSTEM_PROMPT = (
    "Ты — консультант Матрицы Судьбы, специалист с 15-летним опытом в нумерологии, матрицах судьбы и духовных практиках. "
    "Ты общаешься с клиентами через Telegram-бот. "
    "Услуги: Расчёт матрицы судьбы (5 000 ₸), Нумерология (3 500 ₸), Духовные практики (8 000 ₸), "
    "Чистка энергетики (6 000 ₸), Таро-расклад (4 000 ₸). "
    "Правила: отвечай по-русски тепло и кратко (2-4 предложения), "
    "для записи направляй на сайт https://abdramanovtimur71-ux.github.io/---/, "
    "при вопросах о нумерологии проси дату рождения, используй мягкий мистический тон. "
    "Команды: /menu — каталог, /diagnostics — диагностика, /myorders — мои заказы."
)

_ai_history: dict = {}  # tg_id → list of messages


async def _ai_reply(tg_id: int, text: str) -> str:
    if not _OPENAI_KEY:
        return "Я пока не могу ответить на это. Используйте /menu для каталога услуг 🙏"

    import aiohttp

    if tg_id not in _ai_history:
        _ai_history[tg_id] = []
    _ai_history[tg_id].append({"role": "user", "content": text})
    if len(_ai_history[tg_id]) > 10:
        _ai_history[tg_id] = _ai_history[tg_id][-10:]

    messages = [{"role": "system", "content": _BOT_SYSTEM_PROMPT}] + _ai_history[tg_id]
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {_OPENAI_KEY}",
                    "Content-Type": "application/json",
                },
                json={"model": "gpt-4o", "messages": messages, "max_tokens": 350, "temperature": 0.75},
                timeout=aiohttp.ClientTimeout(total=20),
            ) as resp:
                data = await resp.json()
                reply = data["choices"][0]["message"]["content"].strip()
                _ai_history[tg_id].append({"role": "assistant", "content": reply})
                return reply
    except Exception as e:
        log.error("OpenAI bot error: %s", e)
        return "Сейчас немного занята, попробуйте чуть позже или воспользуйтесь /menu 🌙"


@router.message(F.text)
async def ai_message_handler(msg: Message, state: FSMContext):
    """Ловит любой текст, не перехваченный другими хендлерами (не команды, не FSM)."""
    if await state.get_state():
        return  # уступаем FSM
    if not msg.text or msg.text.startswith("/"):
        return
    await msg.bot.send_chat_action(msg.chat.id, "typing")
    reply = await _ai_reply(msg.from_user.id, msg.text)
    await msg.answer(reply)


# ─────────────────────────── Запуск ───────────────────────────────────────────

async def main():
    db.init_db()
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)

    asyncio.create_task(funnel_worker(bot))
    log.info("Bot started")
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


if __name__ == "__main__":
    asyncio.run(main())
