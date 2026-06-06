"""
Database layer for Telegram bot — users, orders, products, funnel state.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "bot.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                tg_id       INTEGER PRIMARY KEY,
                username    TEXT,
                full_name   TEXT,
                phone       TEXT,
                step        TEXT DEFAULT 'start',
                funnel_step INTEGER DEFAULT 0,
                created_at  TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS products (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                title       TEXT NOT NULL,
                description TEXT,
                price       INTEGER NOT NULL,  -- в тиынах (KZT * 100)
                currency    TEXT DEFAULT 'KZT',
                file_id     TEXT,              -- Telegram file_id или URL
                file_type   TEXT DEFAULT 'document',  -- document / video / link
                active      INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS orders (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                tg_id           INTEGER NOT NULL,
                product_id      INTEGER NOT NULL,
                amount          INTEGER NOT NULL,
                currency        TEXT DEFAULT 'KZT',
                status          TEXT DEFAULT 'pending',  -- pending / paid / delivered
                payment_method  TEXT,
                provider_charge_id TEXT,
                created_at      TEXT DEFAULT (datetime('now')),
                paid_at         TEXT,
                FOREIGN KEY(tg_id) REFERENCES users(tg_id),
                FOREIGN KEY(product_id) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS funnel_messages (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                step        INTEGER NOT NULL UNIQUE,
                text        TEXT NOT NULL,
                delay_hours INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS funnel_sends (
                tg_id   INTEGER,
                step    INTEGER,
                sent_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY(tg_id, step)
            );
        """)
        _seed_products(conn)
        _seed_funnel(conn)


def _seed_products(conn: sqlite3.Connection):
    """Добавляет демо-продукты если таблица пустая."""
    count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if count > 0:
        return
    products = [
        (
            "🔮 Таро-диагностика (онлайн)",
            "Полный расклад на вашу ситуацию — любовь, карьера, здоровье. "
            "Запись 60 мин + PDF-отчёт.",
            15000_00,  # 15 000 KZT
            "link",
        ),
        (
            "🌙 Курс «Работа с духами» — базовый",
            "7 видео-уроков + чат поддержки. Научитесь чувствовать и взаимодействовать "
            "с тонким миром.",
            35000_00,
            "link",
        ),
        (
            "✨ Курс «Энергочистка дома» PRO",
            "Полный практический курс: 10 уроков + личная консультация. "
            "Избавьтесь от негативных программ навсегда.",
            49000_00,
            "link",
        ),
        (
            "⭐ VIP-пакет «Всё включено»",
            "Все 3 продукта + 2 личные сессии с Розой. Максимальный результат.",
            89000_00,
            "link",
        ),
    ]
    conn.executemany(
        "INSERT INTO products (title, description, price, file_type) VALUES (?,?,?,?)",
        products,
    )


def _seed_funnel(conn: sqlite3.Connection):
    count = conn.execute("SELECT COUNT(*) FROM funnel_messages").fetchone()[0]
    if count > 0:
        return
    messages = [
        (0, "👋 Привет! Я — консультант Матрицы Судьбы, специалист по нумерологии и матрицам судьбы.\n\n"
            "Помогаю найти ответы на самые важные вопросы жизни.\n\n"
            "Напишите /menu чтобы посмотреть все услуги.", 0),
        (1, "💫 Как вы себя чувствуете? Часто бывает так, что нас что-то тянет назад...\n\n"
            "Хотите узнать, есть ли у вас энергетическая блокировка?\n"
            "Напишите /diagnostics — пройдём *бесплатную мини-диагностику*.", 1),
        (2, "🔮 Многие мои клиенты говорят, что уже после первого сеанса чувствуют лёгкость.\n\n"
            "Отзывы реальных людей: /reviews\n"
            "Каталог услуг: /menu", 24),
        (3, "⭐ Специально для вас — скидка 10% на любой курс в течение 24 часов!\n\n"
            "Используйте промокод *ROZA10* при оплате.\n"
            "Каталог: /menu", 48),
    ]
    conn.executemany(
        "INSERT INTO funnel_messages (step, text, delay_hours) VALUES (?,?,?)",
        messages,
    )


# ── Users ──────────────────────────────────────────────────────────────────────

def upsert_user(tg_id: int, username: str | None, full_name: str):
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO users (tg_id, username, full_name)
               VALUES (?, ?, ?)
               ON CONFLICT(tg_id) DO UPDATE SET username=excluded.username, full_name=excluded.full_name""",
            (tg_id, username, full_name),
        )


def get_user(tg_id: int) -> sqlite3.Row | None:
    with get_conn() as conn:
        return conn.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,)).fetchone()


def set_user_step(tg_id: int, step: str):
    with get_conn() as conn:
        conn.execute("UPDATE users SET step=? WHERE tg_id=?", (step, tg_id))


def set_funnel_step(tg_id: int, step: int):
    with get_conn() as conn:
        conn.execute("UPDATE users SET funnel_step=? WHERE tg_id=?", (step, tg_id))


# ── Products ───────────────────────────────────────────────────────────────────

def get_products() -> list[sqlite3.Row]:
    with get_conn() as conn:
        return conn.execute("SELECT * FROM products WHERE active=1").fetchall()


def get_product(product_id: int) -> sqlite3.Row | None:
    with get_conn() as conn:
        return conn.execute("SELECT * FROM products WHERE id=?", (product_id,)).fetchone()


def update_product_file(product_id: int, file_id: str, file_type: str):
    with get_conn() as conn:
        conn.execute(
            "UPDATE products SET file_id=?, file_type=? WHERE id=?",
            (file_id, file_type, product_id),
        )


# ── Orders ─────────────────────────────────────────────────────────────────────

def create_order(tg_id: int, product_id: int, amount: int, payment_method: str) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO orders (tg_id, product_id, amount, payment_method) VALUES (?,?,?,?)",
            (tg_id, product_id, amount, payment_method),
        )
        return cur.lastrowid


def get_order(order_id: int) -> sqlite3.Row | None:
    with get_conn() as conn:
        return conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()


def mark_order_paid(order_id: int, charge_id: str = ""):
    with get_conn() as conn:
        conn.execute(
            "UPDATE orders SET status='paid', paid_at=datetime('now'), provider_charge_id=? WHERE id=?",
            (charge_id, order_id),
        )


def mark_order_delivered(order_id: int):
    with get_conn() as conn:
        conn.execute("UPDATE orders SET status='delivered' WHERE id=?", (order_id,))


def get_user_orders(tg_id: int) -> list[sqlite3.Row]:
    with get_conn() as conn:
        return conn.execute(
            "SELECT o.*, p.title FROM orders o JOIN products p ON o.product_id=p.id WHERE o.tg_id=? ORDER BY o.created_at DESC",
            (tg_id,),
        ).fetchall()


# ── Funnel ─────────────────────────────────────────────────────────────────────

def get_funnel_messages() -> list[sqlite3.Row]:
    with get_conn() as conn:
        return conn.execute("SELECT * FROM funnel_messages ORDER BY step").fetchall()


def record_funnel_send(tg_id: int, step: int):
    with get_conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO funnel_sends (tg_id, step) VALUES (?,?)",
            (tg_id, step),
        )


def users_pending_funnel(step: int, delay_hours: int) -> list[sqlite3.Row]:
    """Возвращает пользователей, которым нужно отправить шаг воронки."""
    with get_conn() as conn:
        return conn.execute(
            """SELECT u.tg_id FROM users u
               WHERE u.funnel_step = ?
               AND datetime(u.created_at, '+' || ? || ' hours') <= datetime('now')
               AND NOT EXISTS (
                   SELECT 1 FROM funnel_sends fs WHERE fs.tg_id=u.tg_id AND fs.step=?
               )""",
            (step, delay_hours, step),
        ).fetchall()


# ── Stats ──────────────────────────────────────────────────────────────────────

def get_stats() -> dict:
    with get_conn() as conn:
        total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        total_orders = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
        total_paid = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM orders WHERE status IN ('paid','delivered')"
        ).fetchone()[0]
        orders_today = conn.execute(
            "SELECT COUNT(*) FROM orders WHERE date(created_at)=date('now')"
        ).fetchone()[0]
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_paid_kzt": total_paid // 100,
        "orders_today": orders_today,
    }
