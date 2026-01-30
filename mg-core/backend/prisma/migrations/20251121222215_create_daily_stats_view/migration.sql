CREATE OR REPLACE VIEW vw_daily_wallet_stats AS
SELECT
    w.user_id,
    w.id as wallet_id,
    w.mc_balance,
    (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions t
        WHERE t.recipient_id = w.user_id
          AND DATE(t.created_at) = CURRENT_DATE
    ) as total_incoming_today,
    (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions t
        WHERE t.sender_id = w.user_id
          AND DATE(t.created_at) = CURRENT_DATE
    ) as total_outgoing_today
FROM wallets w;