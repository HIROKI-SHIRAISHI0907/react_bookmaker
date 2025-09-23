-- 初回（空ボリューム時）のみ実行されます
CREATE DATABASE IF NOT EXISTS `soccer_bm_user`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

-- 既存の統計DBには触れません（作成・変更しない）