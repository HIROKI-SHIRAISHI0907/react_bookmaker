# -*- coding: utf-8 -*-
"""
BmDetailDataRole（ecs-precheck-runner-detail-data の実行ロール）を読み込み、
B016 起動 Lambda に必要な権限のうち「足りないものだけ」をインラインポリシーで追加する。

使い方（Mac のターミナル。aws CLI のログイン済みが前提）:
    python3 fix_bm_detail_data_role.py            # 確認だけ（何も変更しない）
    python3 fix_bm_detail_data_role.py --apply    # 足りない権限を追加する

やること
  1) ロールに付いているポリシー（管理ポリシー・インラインポリシー）を一覧表示
  2) タスク定義 bm-detail-data-batch から、実際に使うタスク実行ロール・タスクロールを読む（iam:PassRole の対象）
  3) IAM ポリシーシミュレーターで、必要な操作ごとに「許可されているか」を判定
  4) 許可されていないものだけで BmDetailDataTriggerMissing というインラインポリシーを作る（--apply のとき追加）
"""

import json
import subprocess
import sys

ROLE_NAME = "BmDetailDataRole"
ACCOUNT = "287190274071"
REGION = "ap-northeast-1"
BUCKET = "aws-s3-detail-data-csv"
INPUT_KEY = "b016_game_detail_path.json"
CLUSTER = "bm-detail-data-cluster"
TASK_FAMILY = "bm-detail-data-batch"
LAMBDA_NAME = "ecs-precheck-runner-detail-data"
POLICY_NAME = "BmDetailDataTriggerMissing"


def aws(*args, check=True):
    cmd = ["aws", *args, "--region", REGION, "--output", "json"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        if check:
            print(f"❌ {' '.join(cmd)}\n{res.stderr.strip()}")
            sys.exit(1)
        return None
    return json.loads(res.stdout) if res.stdout.strip() else {}


def main():
    apply = "--apply" in sys.argv
    role_arn = f"arn:aws:iam::{ACCOUNT}:role/{ROLE_NAME}"

    # 0) Lambda が本当にこのロールを使っているか
    fn = aws("lambda", "get-function-configuration", "--function-name", LAMBDA_NAME, check=False)
    if fn:
        used = fn.get("Role", "")
        mark = "✅" if used.endswith("/" + ROLE_NAME) else "⚠️ 違うロールです"
        print(f"{mark} {LAMBDA_NAME} の実行ロール: {used}")

    # 1) 今のポリシー
    print(f"\n▶ {ROLE_NAME} に付いているポリシー")
    attached = aws("iam", "list-attached-role-policies", "--role-name", ROLE_NAME)["AttachedPolicies"]
    for p in attached:
        print(f"   [管理]     {p['PolicyName']}  ({p['PolicyArn']})")
    inline = aws("iam", "list-role-policies", "--role-name", ROLE_NAME)["PolicyNames"]
    for name in inline:
        print(f"   [インライン] {name}")
        doc = aws("iam", "get-role-policy", "--role-name", ROLE_NAME, "--policy-name", name)["PolicyDocument"]
        print("      " + json.dumps(doc, ensure_ascii=False))

    # 2) タスク定義が使うロール（PassRole の対象）
    td = aws("ecs", "describe-task-definition", "--task-definition", TASK_FAMILY, check=False)
    pass_roles = []
    td_arn = f"arn:aws:ecs:{REGION}:{ACCOUNT}:task-definition/{TASK_FAMILY}:1"
    if td:
        t = td["taskDefinition"]
        td_arn = t["taskDefinitionArn"]
        for k in ("executionRoleArn", "taskRoleArn"):
            if t.get(k):
                pass_roles.append(t[k])
        print(f"\n▶ タスク定義 {td_arn}\n   PassRole の対象: {pass_roles}")
    else:
        pass_roles = [f"arn:aws:iam::{ACCOUNT}:role/ecsTaskExecutionRole",
                      f"arn:aws:iam::{ACCOUNT}:role/bmDetailDataScraperTaskRole"]
        print(f"\n⚠️ タスク定義 {TASK_FAMILY} を読めませんでした。既定のロール名で判定します: {pass_roles}")

    cluster_arn = f"arn:aws:ecs:{REGION}:{ACCOUNT}:cluster/{CLUSTER}"

    # 3) 必要な権限（判定用の操作・リソース・条件 と、足りないときに追加する Statement）
    checks = [
        {"sid": "ListDetailBucket", "action": "s3:ListBucket",
         "resource": f"arn:aws:s3:::{BUCKET}",
         "stmt": {"Effect": "Allow", "Action": "s3:ListBucket", "Resource": f"arn:aws:s3:::{BUCKET}"}},
        {"sid": "ReadInputJson", "action": "s3:GetObject",
         "resource": f"arn:aws:s3:::{BUCKET}/{INPUT_KEY}",
         "stmt": {"Effect": "Allow", "Action": "s3:GetObject", "Resource": f"arn:aws:s3:::{BUCKET}/{INPUT_KEY}"}},
        {"sid": "RunDetailTask", "action": "ecs:RunTask", "resource": td_arn,
         "context": [("ecs:cluster", cluster_arn)],
         "stmt": {"Effect": "Allow", "Action": "ecs:RunTask",
                  "Resource": [f"arn:aws:ecs:{REGION}:{ACCOUNT}:task-definition/{TASK_FAMILY}",
                               f"arn:aws:ecs:{REGION}:{ACCOUNT}:task-definition/{TASK_FAMILY}:*"]}},
        {"sid": "TagDetailTask", "action": "ecs:TagResource",
         "resource": f"arn:aws:ecs:{REGION}:{ACCOUNT}:task/{CLUSTER}/0123456789abcdef",
         "stmt": {"Effect": "Allow", "Action": "ecs:TagResource",
                  "Resource": f"arn:aws:ecs:{REGION}:{ACCOUNT}:task/{CLUSTER}/*"}},
        {"sid": "ListDetailTasks", "action": "ecs:ListTasks", "resource": "*",
         "context": [("ecs:cluster", cluster_arn)],
         "stmt": {"Effect": "Allow", "Action": "ecs:ListTasks", "Resource": "*",
                  "Condition": {"ArnEquals": {"ecs:cluster": cluster_arn}}}},
    ]
    for i, r in enumerate(pass_roles):
        checks.append({"sid": f"PassTaskRole{i + 1}", "action": "iam:PassRole", "resource": r,
                       "context": [("iam:PassedToService", "ecs-tasks.amazonaws.com")],
                       "stmt": {"Effect": "Allow", "Action": "iam:PassRole", "Resource": r,
                                "Condition": {"StringEquals": {"iam:PassedToService": "ecs-tasks.amazonaws.com"}}}})

    print("\n▶ ポリシーシミュレーターでの判定")
    missing = []
    for c in checks:
        args = ["iam", "simulate-principal-policy", "--policy-source-arn", role_arn,
                "--action-names", c["action"], "--resource-arns", c["resource"]]
        ctx = []
        for key, val in c.get("context", []):
            ctx.append(f"ContextKeyName={key},ContextKeyValues={val},ContextKeyType=string")
        if ctx:
            args += ["--context-entries", *ctx]
        res = aws(*args)
        decision = res["EvaluationResults"][0]["EvalDecision"]
        ok = decision == "allowed"
        print(f"   {'✅' if ok else '❌'} {c['action']:<18} {c['resource']}  → {decision}")
        if not ok:
            missing.append({"Sid": c["sid"], **c["stmt"]})

    if not missing:
        print("\n✅ 足りない権限はありません。")
        return

    policy = {"Version": "2012-10-17", "Statement": missing}
    print(f"\n▶ 追加するインラインポリシー {POLICY_NAME}:")
    print(json.dumps(policy, ensure_ascii=False, indent=2))

    if not apply:
        print("\n（確認だけです。追加するには --apply を付けて実行してください）")
        return

    # 既に同名のインラインポリシーがあれば、その Statement と合わせる（Sid が同じものは置き換え）
    if POLICY_NAME in inline:
        old = aws("iam", "get-role-policy", "--role-name", ROLE_NAME, "--policy-name", POLICY_NAME)["PolicyDocument"]
        old_stmts = old.get("Statement", [])
        if isinstance(old_stmts, dict):
            old_stmts = [old_stmts]
        new_sids = {s["Sid"] for s in missing}
        policy["Statement"] = [s for s in old_stmts if s.get("Sid") not in new_sids] + missing

    aws("iam", "put-role-policy", "--role-name", ROLE_NAME, "--policy-name", POLICY_NAME,
        "--policy-document", json.dumps(policy, ensure_ascii=False))
    print(f"\n✅ {ROLE_NAME} に {POLICY_NAME} を追加しました。反映まで数十秒かかることがあります。")


if __name__ == "__main__":
    main()
