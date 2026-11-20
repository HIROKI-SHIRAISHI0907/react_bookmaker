#!/usr/bin/env bash
# 2026-11-20 の反映チェック（読むだけ。何も変えない）
#   cd ~/bm_typescript/bm-live && bash check_release_20261120.sh
set -uo pipefail
REGION=ap-northeast-1
ACCOUNT=287190274071
aws_() { aws --region "$REGION" "$@"; }
ok()  { printf '  ✅ %s\n' "$*"; }
ng()  { printf '  ❌ %s\n' "$*"; }
say() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

# ---------------------------------------------------------------------------
say "1) Lambda ecs-precheck-runner-batch"
FN=ecs-precheck-runner-batch
ENV=$(aws_ lambda get-function-configuration --function-name $FN --query 'Environment.Variables' --output json)
if echo "$ENV" | grep -q 'JOB_B008_TASK_DEFINITION\|JOB_B008_CONTAINER_NAME'; then
  ng "環境変数に JOB_B008_TASK_DEFINITION / JOB_B008_CONTAINER_NAME が残っています: $(echo "$ENV" | grep JOB_B008 | tr -d ' ')"
else
  ok "環境変数に JOB_B008_* はありません"
fi
echo "  最終更新: $(aws_ lambda get-function-configuration --function-name $FN --query LastModified --output text)"
# コードの中身（ダウンロードして確認）
URL=$(aws_ lambda get-function --function-name $FN --query 'Code.Location' --output text)
TMP=$(mktemp -d); curl -s -o "$TMP/c.zip" "$URL" && unzip -q -o "$TMP/c.zip" -d "$TMP"
python3 - "$TMP/lambda_function.py" <<'PY'
import re, sys
s = open(sys.argv[1], encoding="utf-8").read()
m = re.search(r'"B008":\s*\{(.*?)\n    \},', s, re.S)
b = m.group(1) if m else ""
print("  ✅ B008 の起動先クラスター = batch-backend" if "cluster/batch-backend" in b else "  ❌ B008 の起動先が batch-backend になっていません（コード未デプロイ）")
print("  ✅ B008 は seqmap/ を数えない" if "seqmap/" in b else "  ❌ B008 の seqmap/ 除外が入っていません（コード未デプロイ）")
print("  ✅ B008 の二重起動防止あり" if "skip_if_same_job_running" in b else "  ❌ B008 の二重起動防止が入っていません（コード未デプロイ）")
PY
rm -rf "$TMP"
# 判定だけ動かす（CSV が無ければ起動しない。起動先だけ確認する）
OUT=$(aws_ lambda invoke --function-name $FN --cli-binary-format raw-in-base64-out --payload '{"BM_JOB":"B008"}' /dev/stdout 2>/dev/null | head -1)
echo "  B008 の判定: $OUT"
echo "$OUT" | grep -q 'cluster/batch-backend' && echo "$OUT" | grep -q '"task_definition": "bookmakers-batch"' \
  && ok "B008 は batch-backend / bookmakers-batch で起動する設定" || ng "B008 の起動先が bookmakers-batch になっていません"

# ---------------------------------------------------------------------------
say "2) イメージ（ECR の最新 push 日時）"
for repo in bookmakers-app bookmakers-batch bookmakers-web bookmakers-front; do
  # ページごとに結果が出るので、全部の push 日時を並べて一番新しいものを取る
  T=$(aws_ ecr describe-images --repository-name "$repo" --query 'imageDetails[].imagePushedAt' --output text 2>/dev/null | tr '\t' '\n' | sort | tail -1)
  if [ -z "$T" ] || [ "$T" = "None" ]; then echo "  ・ $repo: リポジトリが見つかりません（名前が違う可能性）"; continue; fi
  case "$T" in 2026-11-20T1[89]*|2026-11-20T2*|2026-11-21*) ok "$repo: $T";; *) ng "$repo: 最新の push が ${T}（今日の夜の修正が入っていない可能性）";; esac
done

# ---------------------------------------------------------------------------
say "3) web / frontend のサービスが新しいイメージで動いているか"
for c in $(aws_ ecs list-clusters --query 'clusterArns' --output text); do
  for s in $(aws_ ecs list-services --cluster "$c" --query 'serviceArns' --output text); do
    aws_ ecs describe-services --cluster "$c" --services "$s" \
      --query 'services[0].{svc:serviceName,running:runningCount,desired:desiredCount,updated:deployments[0].updatedAt,state:deployments[0].rolloutState}' \
      --output text | awk '{printf "  ・ %s\n", $0}'
  done
done
echo "  （updated が今日で state が COMPLETED、running = desired ならデプロイ完了）"

# 中身の確認（画面の JS に今日の修正が入っているか）
JS=$(curl -sL https://bm-stats-real.com/ | grep -o '/assets/index-[^"]*\.js' | head -1)
if [ -n "$JS" ]; then
  BODY=$(curl -sL "https://bm-stats-real.com${JS}")
  for word in "stat-data" "新規リーグ（30日以内）" "del_flg=1" "チームごとのメイン / サブカラーの確認・更新"; do
    echo "$BODY" | grep -q "$word" && ok "frontend に「${word}」あり" || ng "frontend に「${word}」がありません（frontend 未デプロイ）"
  done
else
  ng "frontend の JS が見つかりません"
fi
# web の新しい API があるか（ログインしていないので 401/403 なら「ある」、404 なら「無い」）
C=$(curl -s -o /dev/null -w '%{http_code}' --post301 --post302 -L -X POST -H 'Content-Type: application/json' -d '{}' https://bm-stats-real.com/v1/api/admin/exec/task/stat-data)
case "$C" in 404) ng "web に /admin/exec/task/stat-data がありません（web 未デプロイ）";; *) ok "web に /admin/exec/task/stat-data あり（HTTP ${C}）";; esac

# ---------------------------------------------------------------------------
say "4) bookmakers-app のタスクロールの S3 権限"
ROLE=$(aws_ ecs describe-task-definition --task-definition bookmakers-app --query 'taskDefinition.taskRoleArn' --output text); ROLE=${ROLE##*/}
aws iam get-role-policy --role-name "$ROLE" --policy-name BmAppExportCsvB011 >/dev/null 2>&1 \
  && ok "$ROLE に BmAppExportCsvB011 あり" || ng "$ROLE に BmAppExportCsvB011 がありません"
for a in "s3:DeleteObject arn:aws:s3:::aws-s3-stat-csv/x.csv" "s3:PutObject arn:aws:s3:::aws-s3-mail/x.json" "s3:GetObject arn:aws:s3:::aws-s3-mail/x.json"; do
  set -- $a
  R=$(aws iam simulate-principal-policy --policy-source-arn "arn:aws:iam::${ACCOUNT}:role/${ROLE}" \
      --action-names "$1" --resource-arns "$2" --query 'EvaluationResults[0].EvalDecision' --output text)
  [ "$R" = "allowed" ] && ok "$1 $2" || ng "$1 $2 → $R"
done

say "完了（❌ の行があれば貼ってください）"
