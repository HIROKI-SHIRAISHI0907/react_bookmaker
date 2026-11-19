#!/usr/bin/env bash
# =============================================================================
# bookmakers-web-alb に HTTPS（443）を付ける（2026-11-20 追加。何度流しても同じ結果になる）
#
# Chrome が http:// のサイトを https:// で開こうとして、443 が無いためにタイムアウトする対策。
#   1) ACM 証明書（bm-stats-real.com・www.bm-stats-real.com）。無ければ DNS 検証で発行（Route 53 に検証レコードを作る）
#   2) ALB のセキュリティグループで 443 を開ける
#   3) 443 のリスナーを作り、80 のリスナーの既定の転送先・ルール（/v1/api など）をそのまま写す
#   4) REDIRECT=1 のときだけ: 80 に来たものを https に 301 で転送する（https で開けるのを確かめてから）
#
# 使い方（Mac。aws CLI のログイン済み）
#   cd ~/bm_typescript/bm-live
#   bash setup_alb_https.sh              # 1)〜3)
#   CHECK=1 bash setup_alb_https.sh      # 確認だけ
#   REDIRECT=1 bash setup_alb_https.sh   # 4) も（https で開けるのを確かめてから）
# =============================================================================
set -euo pipefail

REGION="${REGION:-ap-northeast-1}"
ALB_NAME="${ALB_NAME:-bookmakers-web-alb}"
DOMAIN="${DOMAIN:-bm-stats-real.com}"
ALT_DOMAIN="${ALT_DOMAIN:-www.bm-stats-real.com}"
CHECK="${CHECK:-0}"
REDIRECT="${REDIRECT:-0}"

aws_() { aws --region "${REGION}" "$@"; }
say()  { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }
ok()   { printf '   ✅ %s\n' "$*"; }
warn() { printf '   ⚠️  %s\n' "$*"; }
doit() { if [ "${CHECK}" = "1" ]; then printf '   (CHECK) %s\n' "$*"; else "$@"; fi; }
WORK="$(mktemp -d)"; trap 'rm -rf "${WORK}"' EXIT

ALB_ARN="$(aws_ elbv2 describe-load-balancers --names "${ALB_NAME}" --query 'LoadBalancers[0].LoadBalancerArn' --output text)"
ALB_SG="$(aws_ elbv2 describe-load-balancers --names "${ALB_NAME}" --query 'LoadBalancers[0].SecurityGroups[0]' --output text)"
ok "ALB ${ALB_NAME} / SG ${ALB_SG}"

# -----------------------------------------------------------------------------
say "1) ACM 証明書（${DOMAIN}）"
CERT_ARN="$(aws_ acm list-certificates --certificate-statuses ISSUED PENDING_VALIDATION \
  --query "CertificateSummaryList[?DomainName=='${DOMAIN}'].CertificateArn | [0]" --output text)"
if [ -z "${CERT_ARN}" ] || [ "${CERT_ARN}" = "None" ]; then
  if [ "${CHECK}" = "1" ]; then warn "証明書がありません（CHECK のため発行しません）"; exit 0; fi
  CERT_ARN="$(aws_ acm request-certificate --domain-name "${DOMAIN}" --subject-alternative-names "${ALT_DOMAIN}" \
    --validation-method DNS --query CertificateArn --output text)"
  ok "証明書を発行しました（DNS 検証待ち）: ${CERT_ARN}"
  sleep 10
fi
STATUS="$(aws_ acm describe-certificate --certificate-arn "${CERT_ARN}" --query 'Certificate.Status' --output text)"
ok "証明書 ${CERT_ARN}（${STATUS}）"

if [ "${STATUS}" != "ISSUED" ]; then
  ZONE_ID="$(aws route53 list-hosted-zones-by-name --dns-name "${DOMAIN}." \
    --query "HostedZones[?Name=='${DOMAIN}.'].Id | [0]" --output text)"
  ZONE_ID="${ZONE_ID##*/}"
  [ -n "${ZONE_ID}" ] && [ "${ZONE_ID}" != "None" ] || { warn "Route 53 のホストゾーン ${DOMAIN} が見つかりません"; exit 1; }
  aws_ acm describe-certificate --certificate-arn "${CERT_ARN}" \
    --query 'Certificate.DomainValidationOptions[].ResourceRecord' --output json > "${WORK}/rr.json"
  python3 - "${WORK}/rr.json" "${WORK}/change.json" <<'PY'
import json, sys
rrs = [r for r in json.load(open(sys.argv[1])) if r]
seen, changes = set(), []
for r in rrs:
    if r["Name"] in seen:
        continue
    seen.add(r["Name"])
    changes.append({"Action": "UPSERT", "ResourceRecordSet": {
        "Name": r["Name"], "Type": r["Type"], "TTL": 300, "ResourceRecords": [{"Value": r["Value"]}]}})
json.dump({"Changes": changes}, open(sys.argv[2], "w"))
print(f"   検証レコード {len(changes)} 件")
PY
  doit aws route53 change-resource-record-sets --hosted-zone-id "${ZONE_ID}" --change-batch "file://${WORK}/change.json" >/dev/null
  ok "Route 53（${ZONE_ID}）に検証レコードを作りました。発行を待ちます（数分〜30 分）"
  [ "${CHECK}" = "1" ] || aws_ acm wait certificate-validated --certificate-arn "${CERT_ARN}"
  ok "証明書が発行されました"
fi

# -----------------------------------------------------------------------------
say "2) セキュリティグループ ${ALB_SG} で 443 を開ける"
if aws_ ec2 describe-security-groups --group-ids "${ALB_SG}" \
     --query 'SecurityGroups[0].IpPermissions[?FromPort==`443`]' --output text | grep -q .; then
  ok "443 は開いています"
else
  doit aws_ ec2 authorize-security-group-ingress --group-id "${ALB_SG}" --protocol tcp --port 443 --cidr 0.0.0.0/0 >/dev/null
  ok "443 を開けました（0.0.0.0/0）"
fi

# -----------------------------------------------------------------------------
say "3) 443 のリスナー（80 の転送先・ルールを写す）"
L80="$(aws_ elbv2 describe-listeners --load-balancer-arn "${ALB_ARN}" --query 'Listeners[?Port==`80`].ListenerArn | [0]' --output text)"
L443="$(aws_ elbv2 describe-listeners --load-balancer-arn "${ALB_ARN}" --query 'Listeners[?Port==`443`].ListenerArn | [0]' --output text)"
aws_ elbv2 describe-listeners --listener-arns "${L80}" --query 'Listeners[0].DefaultActions' --output json > "${WORK}/default.json"
aws_ elbv2 describe-rules --listener-arn "${L80}" --output json > "${WORK}/rules80.json"
if grep -q '"Type": "redirect"' "${WORK}/default.json" && [ -n "${L443}" ] && [ "${L443}" != "None" ]; then
  ok "80 は既に https への転送になっています（443 のリスナーはあります）"
else
  python3 - "${WORK}/default.json" "${WORK}/default443.json" <<'PY'
import json, sys
acts = json.load(open(sys.argv[1]))
for a in acts:
    a.pop("Order", None) if len(acts) == 1 else None
json.dump(acts, open(sys.argv[2], "w"))
PY
  if [ -z "${L443}" ] || [ "${L443}" = "None" ]; then
    if [ "${CHECK}" = "1" ]; then
      printf '   (CHECK) 443 のリスナーを作ります\n'
    else
      L443="$(aws_ elbv2 create-listener --load-balancer-arn "${ALB_ARN}" --protocol HTTPS --port 443 \
        --certificates "CertificateArn=${CERT_ARN}" --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
        --default-actions "file://${WORK}/default443.json" --query 'Listeners[0].ListenerArn' --output text)"
      ok "443 のリスナーを作りました"
    fi
  else
    ok "443 のリスナーはあります"
  fi
  # 80 のルール（既定以外）を 443 に写す（同じ優先度のルールが 443 に無いものだけ）
  if [ "${CHECK}" != "1" ] && [ -n "${L443}" ] && [ "${L443}" != "None" ]; then
    aws_ elbv2 describe-rules --listener-arn "${L443}" --query 'Rules[].Priority' --output text > "${WORK}/p443.txt"
    python3 - "${WORK}/rules80.json" "${WORK}/p443.txt" "${WORK}/torule" <<'PY'
import json, sys, os
rules = json.load(open(sys.argv[1]))["Rules"]
have = set(open(sys.argv[2]).read().split())
os.makedirs(sys.argv[3], exist_ok=True)
for r in rules:
    if r.get("IsDefault") or r["Priority"] in have:
        continue
    conds = []
    for c in r["Conditions"]:
        c = dict(c)
        if any(k.endswith("Config") for k in c):
            c.pop("Values", None)
        conds.append(c)
    acts = [{k: v for k, v in a.items()} for a in r["Actions"]]
    json.dump({"priority": r["Priority"], "conditions": conds, "actions": acts},
              open(os.path.join(sys.argv[3], f"{int(r['Priority']):05d}.json"), "w"))
PY
    for f in "${WORK}"/torule/*.json; do
      [ -e "${f}" ] || continue
      P="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['priority'])" "${f}")"
      python3 -c "import json,sys; d=json.load(open(sys.argv[1])); json.dump(d['conditions'],open(sys.argv[2],'w')); json.dump(d['actions'],open(sys.argv[3],'w'))" \
        "${f}" "${WORK}/c.json" "${WORK}/a.json"
      aws_ elbv2 create-rule --listener-arn "${L443}" --priority "${P}" \
        --conditions "file://${WORK}/c.json" --actions "file://${WORK}/a.json" >/dev/null
      ok "ルール（優先度 ${P}）を 443 に写しました"
    done
  fi
fi

# -----------------------------------------------------------------------------
if [ "${REDIRECT}" = "1" ]; then
  say "4) 80 → https に 301 で転送"
  cat > "${WORK}/redirect.json" <<'JSON'
[{"Type":"redirect","RedirectConfig":{"Protocol":"HTTPS","Port":"443","Host":"#{host}","Path":"/#{path}","Query":"#{query}","StatusCode":"HTTP_301"}}]
JSON
  doit aws_ elbv2 modify-listener --listener-arn "${L80}" --default-actions "file://${WORK}/redirect.json" >/dev/null
  # 80 のルールが残っていると、その URL は http のまま答えるので消す（443 に写してあるもの）
  for R in $(aws_ elbv2 describe-rules --listener-arn "${L80}" --query 'Rules[?IsDefault==`false`].RuleArn' --output text); do
    doit aws_ elbv2 delete-rule --rule-arn "${R}"
  done
  ok "80 は https に転送します"
fi

say "完了"
echo "   確かめる: curl -s -o /dev/null -w '%{http_code}\\n' https://${DOMAIN}/login"
[ "${REDIRECT}" = "1" ] || echo "   https で開けたら: REDIRECT=1 bash setup_alb_https.sh（http を https に転送）"
